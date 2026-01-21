
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getCleanupMessage(cleanedCount: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is playing a game called 'Pixel Vacuum' and has just cleaned ${cleanedCount} pixels. Give them a very short, minimalist, cool motivational phrase in Russian. No more than 3 words. Example: "Безупречная чистота", "Мастер порядка".`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 20,
      }
    });
    return response.text || "Так держать!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Отлично!";
  }
}
