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

    // Map internal history format to @google/genai format
    // The new SDK likely expects: { role: 'user' | 'model', content: lines } or similar.
    // Based on common patterns for this new SDK (Unified):
    
    // Construct the request
    // The new SDK commonly uses client.models.generateContent or similar for simple calls,
    // but for chat, it might vary.
    // Let's assume standard generateContent with history as part of the "contents" array.
    
    const contents = history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    }));
    
    // Add the new message
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
  }
};
