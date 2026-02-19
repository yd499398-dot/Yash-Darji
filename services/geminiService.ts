
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast } from "../types";
import { CATEGORIES } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview';
// Fix: Use the recommended alias for gemini flash lite
const MODEL_LITE = 'gemini-flash-lite-latest';

/**
 * Helper to extract JSON from a string that might contain markdown blocks.
 */
const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Raw text:", text);
    throw new Error("Invalid response format from AI");
  }
};

/**
 * Parses a natural language input using Flash-Lite for low latency.
 */
export const parseTransactionInput = async (input: string): Promise<{
  amount?: number;
  category?: string;
  description?: string;
  type?: 'expense' | 'income';
}> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_LITE,
      contents: `Extract transaction details from this text: "${input}". 
      Available categories: ${CATEGORIES.join(', ')}.
      Return JSON: {amount: number, category: string, description: string, type: 'expense'|'income'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['expense', 'income'] },
          }
        }
      }
    });

    // Fix: Access response.text property directly
    const text = response.text;
    if (!text) return {};
    return extractJson(text);
  } catch (error) {
    console.error("Gemini parse error:", error);
    return {};
  }
};

/**
 * Suggests a single category using Flash-Lite for speed.
 */
export const suggestCategory = async (description: string): Promise<string | null> => {
  if (!description || description.length < 3) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_LITE,
      contents: `Map this description to exactly one of: ${CATEGORIES.join(', ')}.
      Description: "${description}"
      Return ONLY the category name.`,
    });

    // Fix: Access response.text property directly
    const text = response.text?.trim();
    if (text && CATEGORIES.includes(text)) {
      return text;
    }
    return null;
  } catch (error) {
    console.error("Gemini category suggestion error:", error);
    return null;
  }
};

/**
 * Generates an advanced forecast with Search Grounding.
 */
export const generateForecast = async (transactions: Transaction[]): Promise<FinancialForecast> => {
  try {
    const history = transactions.slice(0, 50).map(t => 
      `${t.date}: ${t.description} - $${t.amount} (${t.category}) [${t.type}]`
    ).join('\n');

    const prompt = `Act as a Senior Financial Advisor. Today is ${new Date().toISOString().split('T')[0]}.
    Analyze history and forecast spend. Use Google Search to factor in inflation, season, and trends.
    History:
    ${history}

    Return JSON:
    {
      "predictedSpendNextMonth": number,
      "savingsPotential": number,
      "advice": [string],
      "riskFactor": "Low" | "Medium" | "High",
      "anomalies": [string]
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      }
    });

    // Fix: Access response.text property directly
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsedData = extractJson(text) as FinancialForecast;

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return { ...parsedData, searchSources };
  } catch (error) {
    console.error("Gemini forecast error:", error);
    return {
      predictedSpendNextMonth: 0,
      savingsPotential: 0,
      advice: ["Insufficient data for AI strategic modeling."],
      riskFactor: 'Low',
      anomalies: [],
      searchSources: []
    };
  }
};
