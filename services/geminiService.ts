
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast } from "../types";
import { CATEGORIES } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';

/**
 * Helper to extract JSON from a string that might contain markdown blocks or leading/trailing text.
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
 * Parses a natural language input to suggest transaction details.
 */
export const parseTransactionInput = async (input: string): Promise<{
  amount?: number;
  category?: string;
  description?: string;
  type?: 'expense' | 'income';
}> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Extract transaction details from this text: "${input}". 
      Available categories: ${CATEGORIES.join(', ')}.
      If no category fits perfectly, choose 'Other'.
      Return a JSON object with keys: amount (number), category (string), description (cleaned string), type ('expense' or 'income').`,
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

    const text = response.text;
    if (!text) return {};
    return extractJson(text);
  } catch (error) {
    console.error("Gemini parse error:", error);
    return {};
  }
};

/**
 * Analyzes spending history to generate a forecast using Google Search for context.
 */
export const generateForecast = async (transactions: Transaction[]): Promise<FinancialForecast> => {
  try {
    const recentHistory = transactions.slice(0, 50).map(t => 
      `${t.date}: ${t.description} - $${t.amount} (${t.category}) [${t.type}]`
    ).join('\n');

    const prompt = `Act as a Senior Financial Advisor. Analyze these recent transactions and provide a forecast for the upcoming month.
    
    Use Google Search to factor in:
    1. Current inflation trends (specifically for food, fuel, or rent).
    2. Upcoming seasonal spending patterns based on the current date (assume today is ${new Date().toISOString().split('T')[0]}).
    3. Any economic news that might affect consumer spending.
    
    Transactions:
    ${recentHistory}

    Return a JSON object exactly with these keys:
    {
      "predictedSpendNextMonth": number,
      "savingsPotential": number,
      "advice": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
      "riskFactor": "Low" | "Medium" | "High",
      "anomalies": ["Explanation of unusual spending found"]
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        thinkingConfig: { thinkingBudget: 0 } // Faster response for dashboard feel
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const parsedData = extractJson(text) as FinancialForecast;

    // Extract Google Search grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return {
      ...parsedData,
      searchSources
    };

  } catch (error) {
    console.error("Gemini forecast error:", error);
    return {
      predictedSpendNextMonth: 0,
      savingsPotential: 0,
      advice: ["Connect your bank or add more transactions for better AI forecasting."],
      riskFactor: 'Low',
      anomalies: [],
      searchSources: []
    };
  }
};
