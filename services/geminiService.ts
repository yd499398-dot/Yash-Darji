import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, FinancialForecast } from "../types";
import { CATEGORIES } from "../constants";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-3-flash-preview';

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
    return JSON.parse(text);
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
    // We limit the context to the last 50 transactions to save tokens/latency if list is huge
    const recentHistory = transactions.slice(0, 50).map(t => 
      `${t.date}: ${t.description} - $${t.amount} (${t.category})`
    ).join('\n');

    const prompt = `Analyze these financial transactions and provide a forecast for the upcoming month.
    
    Use the Google Search tool to find current economic trends, inflation rates, or specific category price changes (e.g., gas, food) to inform your forecast and advice.
    
    Transactions:
    ${recentHistory}

    You must return a valid JSON object. Do not include markdown code blocks. The JSON must have this structure:
    {
      "predictedSpendNextMonth": number,
      "savingsPotential": number,
      "advice": ["string", "string", "string"],
      "riskFactor": "Low" | "Medium" | "High",
      "anomalies": ["string"]
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        // responseSchema is avoided here because Search Grounding responses can be text-heavy or variable in structure
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean up potential markdown formatting if the model adds it despite instructions
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(text) as FinancialForecast;

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
    // Return a safe fallback
    return {
      predictedSpendNextMonth: 0,
      savingsPotential: 0,
      advice: ["Could not generate forecast at this time. Please try again."],
      riskFactor: 'Low',
      anomalies: [],
      searchSources: []
    };
  }
};