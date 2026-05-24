import { auth } from "@/auth";
import { ai, DEFAULT_MODEL, formatGeminiError } from "@/lib/ai/client";

import { buildValidationSystemPrompt, buildValidationUserPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function extractTagContent(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { sourceCode, sourceLanguage, fileName } = body;

    if (!sourceCode || !sourceLanguage) {
      return new Response("Missing required fields: sourceCode, sourceLanguage", {
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

    // Gate validation if they don't have credits and have no active subscription
    if (user.credits <= 0 && !user.stripeSubscriptionId) {
      return new Response("Insufficient credits", { status: 403 });
    }

    const systemPrompt = buildValidationSystemPrompt();
    const userPrompt = buildValidationUserPrompt({
      sourceLanguage,
      sourceCode,
      fileName,
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const responseText = response.text || "";
    const isValidStr = extractTagContent(responseText, "is_valid");
    const isValid = isValidStr.toLowerCase() === "true";

    if (isValid) {
      return new Response(JSON.stringify({ isValid: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorLineStr = extractTagContent(responseText, "error_line");
    const errorLine = errorLineStr ? parseInt(errorLineStr, 10) : undefined;
    const errorMessage = extractTagContent(responseText, "error_message") || "Syntax error detected.";
    const suggestedFix = extractTagContent(responseText, "suggested_fix") || "Review the syntax near the error.";

    return new Response(
      JSON.stringify({
        isValid: false,
        errorLine: isNaN(errorLine as any) ? undefined : errorLine,
        errorMessage,
        suggestedFix,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Validation route error:", error);
    const { status, body } = formatGeminiError(error);
    return new Response(
      JSON.stringify(body),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
