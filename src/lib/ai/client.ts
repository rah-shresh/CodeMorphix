import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const DEFAULT_MODEL = "gemini-2.5-flash";

export function formatGeminiError(apiError: any) {
  let status = 502;
  let errorCode = "API_ERROR";
  let friendlyMessage = "Failed to contact Gemini translation services.";
  
  const errorMessage = apiError.message || "";
  const errorStatus = apiError.status || apiError.statusCode;
  
  if (
    errorStatus === 429 ||
    errorMessage.includes("429") ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorMessage.includes("quota")
  ) {
    status = 429;
    errorCode = "RESOURCE_EXHAUSTED";
    friendlyMessage = "Daily AI request limit reached. Please try again later.";
  } else if (
    errorMessage.includes("API_KEY_INVALID") ||
    errorMessage.includes("API key") ||
    errorStatus === 400 ||
    errorStatus === 403
  ) {
    status = 401;
    errorCode = "API_KEY_INVALID";
    friendlyMessage = "AI service configuration error.";
  } else if (
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("network") ||
    errorStatus === 503 ||
    errorStatus === 504
  ) {
    status = 503;
    errorCode = "NETWORK_ERROR";
    friendlyMessage = "Connection issue detected.";
  }

  return {
    status,
    body: {
      error: errorCode,
      message: friendlyMessage,
      details: errorMessage,
    },
  };
}

