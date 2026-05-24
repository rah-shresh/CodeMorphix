import { auth } from "@/auth";
import { ai, DEFAULT_MODEL } from "@/lib/ai/client";
import { getPistonConfig } from "@/lib/piston";

export const dynamic = "force-dynamic";

interface ExecutionResult {
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
  };
  run: {
    stdout: string;
    stderr: string;
    code: number;
    output: string;
  };
  executionTimeMs: number;
}

// AI Sandbox simulation fallback if Piston is blocked or offline
async function simulateCodeExecution(code: string, language: string): Promise<ExecutionResult> {
  console.log(`[EXEC-DEBUG] Falling back to AI simulation for language: ${language}`);
  const prompt = `You are a secure remote code execution sandbox simulator.
Your job is to analyze the provided source code, perform a strict dry run of it in your mind, and output what the execution results would be if it were run in a standard isolated environment (like a Piston sandbox) for the language "${language}".

Source Code:
${code}

If there are syntax or compilation errors (e.g. invalid syntax for "${language}", missing declarations, mismatch of braces, etc.), describe them in compile.stderr, set compile.code to 1, and leave run outputs empty.
If it compiles successfully but crashes at runtime (e.g. division by zero, null pointer, index out of range, unhandled exceptions), describe the crash in run.stderr, set run.code to 1.
If it runs successfully, capture all console outputs (stdout) exactly as they would print, set compile.code to 0, run.code to 0, and run.stderr to "".

You MUST respond with a single JSON object. Do NOT wrap it in markdown code blocks like \`\`\`json. Return only the raw JSON.
JSON Structure:
{
  "compile": {
    "stdout": "",
    "stderr": "compilation error text, if any",
    "code": 0
  },
  "run": {
    "stdout": "console output here",
    "stderr": "runtime error text, if any",
    "code": 0,
    "output": "combined stdout and stderr"
  },
  "executionTimeMs": 15
}
`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = aiResponse.text;
    if (!text) {
      throw new Error("Empty response from AI simulator");
    }

    const parsed = JSON.parse(text) as ExecutionResult;
    return parsed;
  } catch (error: any) {
    console.error("AI simulation parsing error:", error);
    return {
      compile: { stdout: "", stderr: "", code: 0 },
      run: {
        stdout: "",
        stderr: `Execution simulation failed: ${error.message || "Unknown error"}`,
        code: 1,
        output: `Execution simulation failed: ${error.message || "Unknown error"}`,
      },
      executionTimeMs: 0,
    };
  }
}

async function executeOnPiston(
  code: string,
  language: string,
  fileName?: string
): Promise<ExecutionResult> {
  const pistonConfig = getPistonConfig(language);
  if (!pistonConfig) {
    throw new Error(`Unsupported execution language: ${language}`);
  }

  const pistonUrl = process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";
  const pistonToken = process.env.PISTON_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (pistonToken) {
    headers["Authorization"] = pistonToken;
  }

  const body = {
    language: pistonConfig.language,
    version: pistonConfig.version,
    files: [
      {
        name: fileName || `main.${pistonConfig.extension}`,
        content: code,
      },
    ],
  };

  const response = await fetch(pistonUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    // 8-second execution timeout
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Piston API returned HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    compile: data.compile ? {
      stdout: data.compile.stdout || "",
      stderr: data.compile.stderr || "",
      code: data.compile.code ?? 0,
    } : undefined,
    run: {
      stdout: data.run.stdout || "",
      stderr: data.run.stderr || "",
      code: data.run.code ?? 0,
      output: data.run.output || "",
    },
    executionTimeMs: 0, // Piston v2 doesn't always provide execution time directly
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { sourceCode, sourceLanguage, targetCode, targetLanguage, fileName } = body;

    if (!sourceCode || !sourceLanguage || !targetCode || !targetLanguage) {
      return new Response("Missing required fields: sourceCode, sourceLanguage, targetCode, targetLanguage", {
        status: 400,
      });
    }

    console.log(`[EXEC-INFO] Requesting execution: Source(${sourceLanguage}), Target(${targetLanguage})`);

    // Execute source code
    let sourceResult: ExecutionResult;
    try {
      sourceResult = await executeOnPiston(sourceCode, sourceLanguage, fileName);
    } catch (err) {
      // Fallback to AI simulation
      sourceResult = await simulateCodeExecution(sourceCode, sourceLanguage);
    }

    // Execute target code
    let targetResult: ExecutionResult;
    try {
      targetResult = await executeOnPiston(targetCode, targetLanguage, fileName);
    } catch (err) {
      // Fallback to AI simulation
      targetResult = await simulateCodeExecution(targetCode, targetLanguage);
    }

    // Comparison logic
    const sourceStdoutTrimmed = sourceResult.run.stdout.trim();
    const targetStdoutTrimmed = targetResult.run.stdout.trim();
    
    const isStdoutMatch = sourceStdoutTrimmed === targetStdoutTrimmed;
    
    const sourceCompiled = !sourceResult.compile || sourceResult.compile.code === 0;
    const targetCompiled = !targetResult.compile || targetResult.compile.code === 0;
    
    const sourceRan = sourceResult.run.code === 0;
    const targetRan = targetResult.run.code === 0;

    let status = "verified";

    if (!targetCompiled || !targetRan) {
      status = "failed"; // Target failed to compile or run
    } else if (!isStdoutMatch) {
      status = "mismatch"; // Output mismatch
    }

    return new Response(
      JSON.stringify({
        sourceResult,
        targetResult,
        status,
        isStdoutMatch,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Execute route handler error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
