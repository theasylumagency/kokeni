import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { requireAdminAuth } from "@/lib/admin/auth";

const PRODUCT_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminAuth();
    await ensureStorage();

    const files = await fs.readdir(PRODUCT_UPLOAD_DIRECTORY);
    const images = files
      .filter((file) => {
        const lower = file.toLowerCase();
        // Only return webp or standard images. We filter out the "-mobile" versions 
        // to avoid cluttering the gallery with duplicates.
        return (
          (lower.endsWith(".webp") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".png")) &&
          !lower.includes("-mobile.")
        );
      })
      .map((file) => `/uploads/products/${file}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to read images:", error);
    return NextResponse.json(
      { error: "Failed to read images" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
    await ensureStorage();

    const formData = await request.formData();
    const file1600 = formData.get("file1600") as File | null;
    const file800 = formData.get("file800") as File | null;

    if (!file1600) {
      return NextResponse.json(
        { error: "Missing required file" },
        { status: 400 }
      );
    }

    const extension = getImageExtension(file1600);
    const uuid = randomUUID();
    const mainFileName = `${uuid}.${extension}`;
    const mobileFileName = `${uuid}-mobile.${extension}`;

    const mainPath = path.join(PRODUCT_UPLOAD_DIRECTORY, mainFileName);
    const mobilePath = path.join(PRODUCT_UPLOAD_DIRECTORY, mobileFileName);

    const mainBuffer = Buffer.from(await file1600.arrayBuffer());
    const mobileBuffer = file800
      ? Buffer.from(await file800.arrayBuffer())
      : Buffer.from(mainBuffer);

    await fs.writeFile(mainPath, mainBuffer);
    await fs.writeFile(mobilePath, mobileBuffer);

    return NextResponse.json({
      success: true,
      image: `/uploads/products/${mainFileName}`,
    });
  } catch (error) {
    console.error("Failed to save images:", error);
    return NextResponse.json(
      { error: "Failed to save images" },
      { status: 500 }
    );
  }
}

async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(PRODUCT_UPLOAD_DIRECTORY, { recursive: true });
  } catch (e) {
    // Ignore error if directory exists
  }
}

function getImageExtension(file: File): string {
  const mimeType = file.type.toLowerCase();

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return "jpg";
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".png")) {
    return "png";
  }

  if (fileName.endsWith(".webp")) {
    return "webp";
  }

  return "jpg";
}
