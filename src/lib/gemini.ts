import { GoogleGenAI } from "@google/genai";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getGeminiClient(): Promise<GoogleGenAI> {
  let apiKey: string | undefined;
  try {
    const { env } = await getCloudflareContext();
    apiKey = (env as unknown as Record<string, string>).GEMINI_API_KEY;
  } catch {
    // 本地开发 fallback
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export const MODEL_ID = "gemini-2.5-flash";
