
import { GoogleGenAI } from "@google/genai";
import { Trip, FuelLog, Expense } from "../types";

// Always use the direct process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' as per @google/genai guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

export const generateDailySummary = async (trips: Trip[], expenses: Expense[], fuelLogs: FuelLog[]) => {
  // Use generateContent directly and await it for proper promise handling
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these daily records and provide a concise WhatsApp-friendly summary.
    Trips: ${JSON.stringify(trips)}
    Expenses: ${JSON.stringify(expenses)}
    Fuel: ${JSON.stringify(fuelLogs)}
    
    Format:
    ð Daily Report: [Date]
    â Total Trips: [X]
    ðï¸ Total Tons: [X]
    ð° Est Revenue: [X]
    â½ Fuel Expense: [X]
    ð¸ Other Expenses: [X]
    ð Net Performance: [X]
    `,
  });
  
  // Access .text property directly (not as a function) as per guidelines
  return response.text || "Summary unavailable.";
};

export const getNearbyFuelStations = async (lat: number, lng: number) => {
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
    // Return both text and grounding chunks to satisfy requirement of displaying links on the web app
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
