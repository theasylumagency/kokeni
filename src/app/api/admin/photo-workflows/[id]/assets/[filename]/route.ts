import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { photoAuth, photoError } from "@/lib/photos/http";
import { assetPath } from "@/lib/photos/store";
import { PhotoError } from "@/lib/photos/types";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string; filename: string }> }) {
  try {
    await photoAuth(request);
    const { id, filename } = await params;
    let buffer;
    try { buffer = await fs.readFile(assetPath(id, filename)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new PhotoError("ფოტო ვერ მოიძებნა.", 404); throw error; }
    return new NextResponse(buffer, { headers: { "Content-Type": filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return photoError(error); }
}
