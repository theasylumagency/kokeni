import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const PRODUCT_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const filename = params.filename;
    
    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(PRODUCT_UPLOAD_DIRECTORY, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("Image not found", { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);

    // Determine basic content type
    let contentType = "image/jpeg";
    const lower = filename.toLowerCase();
    if (lower.endsWith(".png")) contentType = "image/png";
    else if (lower.endsWith(".webp")) contentType = "image/webp";
    else if (lower.endsWith(".svg")) contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to serve image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
