import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getBossTaunt = async (playerScore: number, situation: 'intro' | 'damage' | 'death'): Promise<string> => {
  if (!genAI) {
    return "Show me your strength, warrior!";
  }

  try {
    const model = 'gemini-2.5-flash';
    let prompt = "";

    switch (situation) {
      case 'intro':
        prompt = `You are a mystical Samurai guarding a jungle temple. A commando has arrived. 
        Give a short, intimidating, poetic battle cry (max 10 words). The player has score ${playerScore}.`;
        break;
      case 'damage':
        prompt = `You are a Samurai boss taking heavy damage. Express shock or anger briefly (max 5 words).`;
        break;
      case 'death':
        prompt = `You are a dying Samurai boss. Utter a final haiku about honor and jungle leaves.`;
        break;
    }

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "...";
  }
};
