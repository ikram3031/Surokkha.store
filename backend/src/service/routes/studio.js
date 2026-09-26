import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const router = Router();

let aiClient = null;

// Initialize or retrieve Google GenAI SDK instance using arrow function
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured on the server.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

// Health check endpoint
router.get("/health", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    status: "ok",
    hasKey,
    models: [
      { id: "gemini-3.1-flash-lite-image", name: "Gemini 3.1 Flash Lite Image", default: true },
      { id: "gemini-3.1-flash-image", name: "Gemini 3.1 Flash Image (High Res / 2K)", default: false },
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Prompt & Vision Analysis)" },
    ],
  });
});

// Transform / Edit a single product image
router.post("/transform", authenticateToken, async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      prompt,
      aspectRatio = "1:1",
      imageSize = "1K",
      model = "gemini-3.1-flash-lite-image",
    } = req.body;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: "Both imageBase64 and prompt are required." });
    }

    const ai = getGenAI();
    const startTime = Date.now();

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");
    const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
    const targetAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const selectedModel = model === "gemini-3.1-flash-image"
      ? "gemini-3.1-flash-image"
      : "gemini-3.1-flash-lite-image";

    const imageConfig = {
      aspectRatio: targetAspect,
    };

    if (selectedModel === "gemini-3.1-flash-image" && imageSize) {
      imageConfig.imageSize = imageSize;
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          {
            text: `E-commerce product photo studio transformation: Maintain the core product shape, materials, logo, branding, and details from the original image with highest fidelity. Place and seamlessly composite the product into the following scene/background: ${prompt}. Studio lighting, professional commercial photography, sharp focus, clean reflections, no artifacts, output aspect ratio ${targetAspect}.`,
          },
        ],
      },
      config: {
        imageConfig,
      },
    });

    let resultImageDataUrl = null;
    let textOutput = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageDataUrl = `data:${outMime};base64,${part.inlineData.data}`;
        break;
      } else if (part.text) {
        textOutput += part.text + " ";
      }
    }

    if (!resultImageDataUrl) {
      return res.status(502).json({
        error: "Model did not return image data. Response text: " + (textOutput || "No output parts generated."),
        textOutput,
      });
    }

    const elapsed = Date.now() - startTime;
    res.json({
      success: true,
      imageUrl: resultImageDataUrl,
      elapsedMs: elapsed,
      model: selectedModel,
      aspectRatio: targetAspect,
    });
  } catch (err) {
    console.error("Error in /api/v1/studio/transform:", err);
    res.status(500).json({
      error: err.message || "Failed to transform product image.",
    });
  }
});

// Generate fresh product shots from scratch in bulk
router.post("/generate-bulk", authenticateToken, async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = "1:1",
      imageSize = "1K",
      model = "gemini-3.1-flash-lite-image",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const ai = getGenAI();
    const startTime = Date.now();

    const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"];
    const targetAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const selectedModel = model === "gemini-3.1-flash-image"
      ? "gemini-3.1-flash-image"
      : "gemini-3.1-flash-lite-image";

    const imageConfig = {
      aspectRatio: targetAspect,
    };

    if (selectedModel === "gemini-3.1-flash-image" && imageSize) {
      imageConfig.imageSize = imageSize;
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            text: `High-end commercial product photography: ${prompt}. Ultra-sharp focus, cinematic studio lighting, balanced composition, commercial e-commerce advertising quality.`,
          },
        ],
      },
      config: {
        imageConfig,
      },
    });

    let resultImageDataUrl = null;
    let textOutput = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageDataUrl = `data:${outMime};base64,${part.inlineData.data}`;
        break;
      } else if (part.text) {
        textOutput += part.text + " ";
      }
    }

    if (!resultImageDataUrl) {
      return res.status(502).json({
        error: "Model did not return image data. " + (textOutput || ""),
        textOutput,
      });
    }

    const elapsed = Date.now() - startTime;
    res.json({
      success: true,
      imageUrl: resultImageDataUrl,
      elapsedMs: elapsed,
    });
  } catch (err) {
    console.error("Error in /api/v1/studio/generate-bulk:", err);
    res.status(500).json({
      error: err.message || "Failed to generate product image.",
    });
  }
});

// Smart prompt enhancer for e-commerce photography
router.post("/enhance-prompt", authenticateToken, async (req, res) => {
  try {
    const { basePrompt, styleCategory = "studio", platform = "ecommerce" } = req.body;
    const ai = getGenAI();

    const systemPrompt = `You are a world-class commercial product photographer and prompt engineer for Google Flow image editing models.
Your task is to take a raw user idea or background description and expand it into an ultra-vivid, photorealistic scene description for e-commerce product placement.
Focus on:
1. Exact studio lighting setup (softbox, rim light, golden hour, dappled shadows, diffused highlight).
2. Material surfaces (polished travertine marble podium, brushed aluminum, matte terrazzo, weathered oak wood, water droplets, velvet).
3. Foreground and background depth of field, natural atmospheric elements, reflections, and clean negative space suited for product listings.
4. Keep the product itself front-and-center and pristine.

Return ONLY a concise, high-impact prompt sentence (maximum 50 words) without boilerplate or conversational preamble.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Category: ${styleCategory}. Target Platform: ${platform}. Base idea: "${basePrompt || "Studio podium with modern lighting"}". Produce the enhanced prompt.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const enhancedText = response.text ? response.text.trim().replace(/^["']|["']$/g, "") : basePrompt;
    res.json({ enhancedPrompt: enhancedText });
  } catch (err) {
    console.error("Error in /api/v1/studio/enhance-prompt:", err);
    res.status(500).json({ error: err.message || "Failed to enhance prompt." });
  }
});

// Multimodal Image Analysis for Product Photos
router.post("/analyze-product", authenticateToken, async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required." });
    }

    const ai = getGenAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const prompt = `Analyze this product photo. Output a valid JSON object with the following structure:
{
  "productName": "Concise name of the item (e.g. Matte Black Wireless Headphones)",
  "category": "e.g. Electronics, Cosmetics, Footwear, Fashion, Home & Kitchen",
  "dominantColors": ["Hex or color names like #1A1A1A, Gold, Rose Pink"],
  "recommendedScenes": [
    {
      "title": "Short scene title (e.g. Minimal Marble Pedestal)",
      "prompt": "Full detailed prompt describing background, lighting, and placement"
    },
    {
      "title": "Second scene title (e.g. Sunlit Tropical Terrace)",
      "prompt": "Full detailed prompt describing background, lighting, and placement"
    },
    {
      "title": "Third scene title (e.g. Moody Cyberpunk Neon)",
      "prompt": "Full detailed prompt describing background, lighting, and placement"
    }
  ],
  "compositionAdvice": "1-2 sentences on best aspect ratio or cropping advice (e.g. Recommended 1:1 for hero feed or 9:16 for vertical reels)"
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawJson = response.text || "{}";
    const parsed = JSON.parse(rawJson);
    res.json(parsed);
  } catch (err) {
    console.error("Error in /api/v1/studio/analyze-product:", err);
    res.status(500).json({ error: err.message || "Failed to analyze product." });
  }
});

export default router;
