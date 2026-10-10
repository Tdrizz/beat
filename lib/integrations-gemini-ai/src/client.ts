import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model IDs are configurable so a Google deprecation can be handled with an
// env change instead of a deploy. Re-test try-on fidelity after any change.
export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
export const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
