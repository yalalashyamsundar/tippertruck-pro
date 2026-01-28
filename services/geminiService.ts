
import { GoogleGenAI } from "@google/genai";
import { Trip, FuelLog, Expense } from "../types";

export const generateDailySummary = async (trips: Trip[], expenses: Expense[], fuelLogs: FuelLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these daily records and provide a concise WhatsApp-friendly summary.
    Trips: ${JSON.stringify(trips)}
    Expenses: ${JSON.stringify(expenses)}
    Fuel: ${JSON.stringify(fuelLogs)}
    
    Format:
    🚜 Daily Report: [Date]
    ✅ Total Trips: [X]
    🏗️ Total Tons: [X]
    💰 Est Revenue: [X]
    ⛽ Fuel Expense: [X]
    💸 Other Expenses: [X]
    📊 Net Performance: [X]
    `,
  });
  
  return response.text || "Summary unavailable.";
};

export const getNearbyFuelStations = async (lat: number, lng: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 nearby fuel stations or diesel bunks suitable for heavy trucks.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });
    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (err) {
    console.error("Maps grounding failed", err);
    return {
      text: "Unable to fetch nearby stations at this moment.",
      groundingChunks: []
    };
  }
};
