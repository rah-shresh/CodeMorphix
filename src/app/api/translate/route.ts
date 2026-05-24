import { auth } from "@/auth";
import { ai, DEFAULT_MODEL, formatGeminiError } from "@/lib/ai/client";

import { buildTranslationSystemPrompt, buildTranslationUserPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

// Force dynamic execution for session checks and database calls
export const dynamic = "force-dynamic";

function extractTagContent(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

async function saveTranslationJob({
  userId,
  sourceCode,
  sourceLanguage,
  targetLanguage,
  fileName,
  completeText,
}: {
  userId: string;
  sourceCode: string;
  sourceLanguage: string;
  targetLanguage: string;
  fileName?: string;
  completeText: string;
}) {
  const detectedSourceLang = extractTagContent(completeText, "source_language");
  let translatedCode = extractTagContent(completeText, "translated_code");
  let explanation = extractTagContent(completeText, "explanation");

  // Fallbacks if formatting wasn't perfectly parsed
  if (!translatedCode) {
    // If the model output markdown code block, try to extract it
    const codeBlockMatch = completeText.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      translatedCode = codeBlockMatch[1].trim();
    } else {
      // Clean tags from the whole response as last resort fallback
      translatedCode = completeText
        .replace(/<\/?source_language>/gi, "")
        .replace(/<\/?translated_code>/gi, "")
        .replace(/<\/?explanation>/gi, "")
        .trim();
    }
  }

  if (!explanation) {
    // Try to extract content after </translated_code>
    const closingTagIndex = completeText.indexOf("</translated_code>");
    if (closingTagIndex !== -1) {
      explanation = completeText.substring(closingTagIndex + 18).replace(/<\/?explanation>/gi, "").trim();
    }
  }

  // Fetch current user subscription state
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true, credits: true },
  });

  if (!user) return;

  const decrementCredits = !user.stripeSubscriptionId;

  // Run database update and log creation in transaction
  const results = await db.$transaction([
    ...(decrementCredits
      ? [
          db.user.update({
            where: { id: userId },
            data: { credits: { decrement: 1 } },
          }),
        ]
      : []),
    db.translationJob.create({
      data: {
        userId,
        sourceLanguage: (detectedSourceLang || sourceLanguage).toLowerCase(),
        targetLanguage: targetLanguage.toLowerCase(),
        sourceCode,
        translatedCode,
        explanation: explanation || null,
        fileName: fileName || null,
        charCount: sourceCode.length,
      },
    }),
  ]);

  return results[results.length - 1];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { sourceCode, sourceLanguage, targetLanguage, fileName } = body;

    if (!sourceCode || !sourceLanguage || !targetLanguage) {
      return new Response("Missing required fields: sourceCode, sourceLanguage, targetLanguage", {
        status: 400,
      });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, stripeSubscriptionId: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Gate translation if they don't have credits and have no active subscription
    if (user.credits <= 0 && !user.stripeSubscriptionId) {
      return new Response("Insufficient credits", { status: 403 });
    }

    const systemPrompt = buildTranslationSystemPrompt();
    const userPrompt = buildTranslationUserPrompt({
      sourceCode,
      sourceLanguage,
      targetLanguage,
      fileName,
    });

    const encoder = new TextEncoder();
    let completeText = "";

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: DEFAULT_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });
    } catch (apiError: any) {
      console.error("Gemini API stream initialization error:", apiError);
      const { status, body } = formatGeminiError(apiError);
      return new Response(
        JSON.stringify(body),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
              completeText += chunkText;
              controller.enqueue(encoder.encode(chunkText));
            }
          }

          // Once streaming is done, process and save to DB
          try {
            const savedJob = await saveTranslationJob({
              userId: session.user.id!,
              sourceCode,
              sourceLanguage,
              targetLanguage,
              fileName,
              completeText,
            });
            if (savedJob && savedJob.id) {
              controller.enqueue(encoder.encode(`\n<job_id>${savedJob.id}</job_id>`));
            }
          } catch (dbError) {
            console.error("Failed to save translation job to DB:", dbError);
          }

          controller.close();
        } catch (error) {
          console.error("Stream generation error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Translation route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response("Missing job ID", { status: 400 });
    }

    // Ensure the job belongs to the current user before deleting
    const job = await db.translationJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    await db.translationJob.delete({
      where: { id },
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Delete translation job error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, isSaved } = body;

    if (!id || typeof isSaved !== "boolean") {
      return new Response("Missing or invalid fields: id, isSaved", { status: 400 });
    }

    const job = await db.translationJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const updatedJob = await db.translationJob.update({
      where: { id },
      data: { isSaved },
    });

    return new Response(JSON.stringify(updatedJob), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Patch translation job error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, fileName, translatedCode } = body;

    if (!id) {
      return new Response("Missing job ID", { status: 400 });
    }

    const job = await db.translationJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    if (job.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const dataToUpdate: any = {};
    if (fileName !== undefined) {
      dataToUpdate.fileName = fileName || null;
    }
    if (translatedCode !== undefined) {
      dataToUpdate.translatedCode = translatedCode;
    }

    const updatedJob = await db.translationJob.update({
      where: { id },
      data: dataToUpdate,
    });

    return new Response(JSON.stringify(updatedJob), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Put translation job error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


