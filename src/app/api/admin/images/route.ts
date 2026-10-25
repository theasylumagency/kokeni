import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { photoAuth, photoError } from "@/lib/photos/http";
import { PhotoError } from "@/lib/photos/types";

const PRODUCT_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    await photoAuth(request);
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

    const mainBuffer = Buffer.from(await file1600.arrayBuffer());
    const mobileBuffer = file800
      ? Buffer.from(await file800.arrayBuffer())
      : Buffer.from(mainBuffer);

    if (
      !mainBuffer.length ||
      mainBuffer.length > MAX_UPLOAD_BYTES ||
      !mobileBuffer.length ||
      mobileBuffer.length > MAX_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        { error: "Invalid image size (max 20 MB)." },
        { status: 400 }
      );
    }

    const mainMeta = await sharp(mainBuffer, { limitInputPixels: 60_000_000 }).metadata().catch(() => null);
    const mobileMeta = await sharp(mobileBuffer, { limitInputPixels: 60_000_000 }).metadata().catch(() => null);

    if (
      !mainMeta?.format ||
      !ALLOWED_FORMATS.has(mainMeta.format) ||
      !mobileMeta?.format ||
      !ALLOWED_FORMATS.has(mobileMeta.format)
    ) {
      return NextResponse.json(
        { error: "Only valid JPG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    const extension = mainMeta.format === "jpeg" ? "jpg" : mainMeta.format;
    const uuid = randomUUID();
    const mainFileName = `${uuid}.${extension}`;
    const mobileFileName = `${uuid}-mobile.${extension}`;

    const mainPath = path.join(PRODUCT_UPLOAD_DIRECTORY, mainFileName);
    const mobilePath = path.join(PRODUCT_UPLOAD_DIRECTORY, mobileFileName);

    await fs.writeFile(mainPath, mainBuffer);
    await fs.writeFile(mobilePath, mobileBuffer);

    return NextResponse.json({
      success: true,
      image: `/uploads/products/${mainFileName}`,
    });
  } catch (error) {
    if (error instanceof PhotoError) {
      return photoError(error);
    }
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
  } catch {
    // Ignore error if directory exists
  }
}
