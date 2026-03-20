import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import { requireAdminAuth } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `You are an expert e-commerce product photographer and retoucher. Your primary directive is to preserve the exact physical geometry, material texture, and natural color variations of the main product in the provided image. Do not alter, redraw, or hallucinate text or logos on the product. Your job is exclusively to enhance the lighting, remove unwanted background elements, and generate a high-end, photorealistic environment around the unaltered core product. Output in a 1:1 aspect ratio.`;

type GeneratedInlineDataPart = {
  inlineData?: {
    data?: string;
    mimeType?: string;
  };
};

type GenerateContentResponseShape = {
  candidates?: Array<{
    content?: {
      parts?: GeneratedInlineDataPart[];
    };
  }>;
};

export async function POST(request: Request) {
  try {
    await requireAdminAuth();

    if (!ai) {
      return NextResponse.json(
        { error: "Google AI is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const slotKey = formData.get("slotKey");
    const categoryName = formData.get("categoryName");
    const image = formData.get("image");

    if (
      typeof slotKey !== "string" ||
      typeof categoryName !== "string" ||
      !(image instanceof File)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const mimeType = getMimeType(image);
    const promptText = getPromptForSlot(slotKey, categoryName);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType,
          },
        },
        promptText,
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    const imageBase64 = extractImageBase64(
      response as unknown as GenerateContentResponseShape
    );

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Model did not return an image." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      imageBase64,
    });
  } catch (error) {
    console.error("Failed to generate AI photo:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during generation." },
      { status: 500 }
    );
  }
}

function getPromptForSlot(slotKey: string, categoryName: string): string {
  if (slotKey === "front_closed") {
    return `Using the provided image as the base, generate a high-quality, professional e-commerce hero shot of this ${categoryName}. Strictly preserve the natural color variations and texture of the leather. Remove the current background and place the item squarely in the center of a minimalist, seamless light-grey studio backdrop. Apply soft, diffused top-down studio lighting to gently highlight the leather's grain and the embossed logo without washing it out. Crisp focus, 1:1 aspect ratio.`;
  }

  if (slotKey === "interior_open") {
    return `Using the provided image as the base, generate a realistic lifestyle e-commerce shot of this opened ${categoryName}. Strictly preserve the internal layout, the color of the leather, and the exact appearance of the paper, money, or coins inside. Place the product naturally on a smooth dark wooden cafe table. In the background, create a beautifully blurred (bokeh) warmly lit environment like a modern coffee shop. Add soft, natural morning sunlight streaming in from the side, casting gentle, realistic shadows. 1:1 aspect ratio.`;
  }

  if (slotKey === "detail_spine") {
    return `Using the provided image as the base, create a moody, cinematic detail photograph focusing on the material craftsmanship. Keep the central logo and the immediate surrounding leather texture in laser-sharp focus, preserving all natural color inconsistencies and grain. Apply directional, low-key side lighting to create deep shadows and bright highlights on the material's surface, making it look incredibly tactile and premium. Blur the edges of the frame significantly to draw the eye to the center. 1:1 aspect ratio.`;
  }

  return `Create a beautiful 1:1 aspect ratio product photo of this ${categoryName}.`;
}

function getMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function extractImageBase64(
  response: GenerateContentResponseShape
): string | null {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part?.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  return null;
}
