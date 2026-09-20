import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";

import { requireAdminAuth } from "@/lib/admin/auth";
import { REQUIRED_PHOTO_KINDS } from "@/lib/catalog/photoProduct";
import type { ProductPhotoKind } from "@/lib/catalog/types";

export const dynamic = "force-dynamic";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `You are an expert e-commerce product photographer and retoucher. Your primary directive is to preserve the exact physical geometry, material texture, and natural color variations of the same product shown across all provided reference images. Do not alter, redraw, or hallucinate text or logos on the product. Your job is exclusively to enhance lighting, clean the composition, and generate a premium photorealistic presentation around the unaltered product. Output in a 1:1 aspect ratio.`;

const referenceLabels: Record<ProductPhotoKind, string> = {
  front_closed: "Reference 1 shows the product closed from the front.",
  interior_open: "Reference 2 shows the product opened from the interior.",
  detail_spine: "Reference 3 shows a close-up of the spine and material detail.",
};

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

type PreparedReference = {
  key: ProductPhotoKind;
  label: string;
  inlineData: {
    data: string;
    mimeType: string;
  };
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

    const json = await request.json();
    const categoryName = json.categoryName || "product";
    const stylePrompt = json.stylePrompt || "clean minimal light-grey studio background with soft diffused lighting";
    const singleSlotParam = json.slotKey as ProductPhotoKind | undefined;

    const preparedReferences = await prepareReferenceImagesFromPaths(json);

    if (!preparedReferences) {
      return NextResponse.json(
        { error: "Missing required reference images from local paths." },
        { status: 400 }
      );
    }

    const images = {} as Record<
      ProductPhotoKind,
      { base64: string; mimeType: string }
    >;

    const targetSlots = singleSlotParam
      ? ([singleSlotParam] as ProductPhotoKind[])
      : REQUIRED_PHOTO_KINDS;

    for (const slotKey of targetSlots) {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: buildContentsForSlot(preparedReferences, slotKey, categoryName, stylePrompt),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      const generatedImage = extractGeneratedImage(
        response as unknown as GenerateContentResponseShape
      );

      if (!generatedImage) {
        return NextResponse.json(
          { error: `Model did not return an image for ${slotKey}.` },
          { status: 502 }
        );
      }

      images[slotKey] = generatedImage;
    }

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Failed to regenerate AI photos:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during regeneration." },
      { status: 500 }
    );
  }
}

async function prepareReferenceImagesFromPaths(
  json: any
): Promise<PreparedReference[] | null> {
  const preparedReferences: PreparedReference[] = [];

  for (const slotKey of REQUIRED_PHOTO_KINDS) {
    const src = json[slotKey];

    if (typeof src !== "string" || !src.startsWith("/uploads/")) {
      return null;
    }

    const localPath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    const fileBuffer = await fs.readFile(localPath);
    const mimeType = getMimeTypeFromPath(localPath);

    preparedReferences.push({
      key: slotKey,
      label: referenceLabels[slotKey],
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType,
      },
    });
  }

  return preparedReferences;
}

function buildContentsForSlot(
  references: PreparedReference[],
  slotKey: ProductPhotoKind,
  categoryName: string,
  stylePrompt: string
) {
  const targetReference = references.find((ref) => ref.key === slotKey);

  if (!targetReference) {
    throw new Error("Reference image not found for the requested slot.");
  }

  return [
    "You are an expert product retoucher. You are generating a single specific view of a product. Strictly maintain the exact physical dimensions, straight corners, and texture seen in the provided reference image. Do not use elements from other views.",
    targetReference.label,
    { inlineData: targetReference.inlineData },
    getPromptForSlot(slotKey, categoryName, stylePrompt)
  ];
}

function getPromptForSlot(slotKey: ProductPhotoKind, categoryName: string, stylePrompt: string): string {
  if (slotKey === "front_closed") {
    return `Generate a premium e-commerce hero image of this ${categoryName} in the closed front view. Match the exterior shape from the closed reference, preserve leather grain, preserve natural color variation, keep any logo or embossing untouched. Style: ${stylePrompt}. Crisp focus. 1:1 aspect ratio.`;
  }

  if (slotKey === "interior_open") {
    return `Generate a premium e-commerce image of this ${categoryName} in the opened interior view. Match the open structure from the interior reference, preserve the internal construction and visible materials exactly, keep color and texture faithful to the references. Style: ${stylePrompt}. 1:1 aspect ratio.`;
  }

  return `Generate a premium close detail image of this ${categoryName} focused on the spine and craftsmanship. Match the spine geometry and nearby material detail from the references, preserve texture and stitching, use directional dramatic light. Style: ${stylePrompt}. Composition photorealistic with shallow depth of field. 1:1 aspect ratio.`;
}

function getMimeTypeFromPath(localPath: string): string {
  const ext = path.extname(localPath).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function extractGeneratedImage(
  response: GenerateContentResponseShape
): { base64: string; mimeType: string } | null {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  return null;
}
