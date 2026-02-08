import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';

// Initialize GenAI Client
const client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY || '' });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const geminiService = {
  async chat(history: ChatMessage[], newMessage: string, systemInstruction: string) {
    if (!CONFIG.GEMINI_API_KEY) {
        return "Error: Gemini API Key not configured.";
    }

    const contents = history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        },
        contents: contents
      });

      return response.text || '';
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  },

  async generateJSON(prompt: string, systemInstruction: string) {
    if (!CONFIG.GEMINI_API_KEY) {
        throw new Error("Gemini API Key not configured.");
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
        },
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      let text = response.text || '{}';
      
      // Remove markdown code blocks if present
      if (text.includes('```')) {
        text = text.replace(/```json\n?|```/g, '').trim();
      }
      
      return text;
    } catch (error: any) {
      console.error("Gemini API JSON Error:", error);
      throw new Error(`Gemini API JSON Error: ${error.message}`);
    }
  }
};
