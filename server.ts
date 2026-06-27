import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json({ limit: "10mb" }));

  // API Route to generate the voiceover
  app.post("/api/generate-voiceover", async (req, res) => {
    try {
      const { text, voiceName, tone } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const requestedVoice = voiceName || "Kore";
      const requestedTone = tone || "warm and natural";

      // Guiding the TTS model to perform high-quality local Tunisian Arabic pronunciation, dialect and conversational style
      const prompt = `[VOICEOVER GUIDELINES]
Role: Native Tunisian Speaker (Tounsi / Derja dialect)
Tone: ${requestedTone}, warm, fluent, conversational, natural pacing, friendly.
Pronunciation: Tunisian dialect (Tounsi). Do NOT pronounce words in Modern Standard Arabic (Fusha). Avoid artificial or robotic pacing. Maintain high-quality natural voice acting.
Script: Please read the text below exactly word-for-word.

Script:
${text}`;

      console.log(`[TTS API] Generating voiceover. Voice: ${requestedVoice}, Tone: ${requestedTone}`);

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured. Please add it to your secrets or environment." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: requestedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        console.error("[TTS API] No audio data returned from Gemini");
        return res.status(500).json({ error: "Gemini did not return audio. Try using a simpler script or a different voice." });
      }

      res.json({
        audio: base64Audio,
        voiceUsed: requestedVoice,
        toneUsed: requestedTone
      });
    } catch (err: any) {
      console.error("[TTS API] Error in voice generation:", err);
      
      const errMsg = err?.message || "";
      const isQuotaError = errMsg.includes("RESOURCE_EXHAUSTED") || 
                           errMsg.includes("quota") || 
                           errMsg.includes("429") || 
                           err?.status === "RESOURCE_EXHAUSTED" || 
                           err?.code === 429;

      if (isQuotaError) {
        return res.status(429).json({
          errorType: "QUOTA_EXHAUSTED",
          error: "You have temporarily exceeded the Gemini TTS free tier quota (10 requests per day per model).",
          suggestion: "Please try again in a few minutes, use a shorter text script, or configure your personal Google AI Studio API key with a pay-as-you-go billing setup in the Secrets panel to get unlimited generations instantly."
        });
      }

      res.status(500).json({ error: errMsg || "Failed to generate Tunisian voiceover." });
    }
  });

  // Vite middleware for development / Static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (Production: ${process.env.NODE_ENV === "production"})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
