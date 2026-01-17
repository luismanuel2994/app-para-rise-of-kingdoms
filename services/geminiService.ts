
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const chatWithGemini = async (message: string, systemInstruction: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: message }] }],
    config: { systemInstruction }
  });
  return response.text;
};

export const textToSpeech = async (text: string, lang: string) => {
  const ai = getAIClient();
  // Prompt minimalista para que el modelo genere audio instantáneamente
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const analyzeImage = async (base64Image: string, prompt: string) => {
  const ai = getAIClient();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  const textPart = {
    text: prompt
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [imagePart, textPart] },
  });
  return response.text;
};
