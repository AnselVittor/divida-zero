import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBillData = async (base64Data: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analise este documento (boleto ou fatura). Extraia os seguintes dados: Título (nome do estabelecimento ou serviço), Valor total (número), Data de Vencimento (formato YYYY-MM-DD) e Código de Barras (linha digitável), se visível.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            value: { type: Type.NUMBER },
            dueDate: { type: Type.STRING },
            barcode: { type: Type.STRING },
          },
          required: ["title", "value", "dueDate"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao processar boleto com Gemini:", error);
    throw error;
  }
};
