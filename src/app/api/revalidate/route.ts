import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Optional: Add a simple secret check to prevent abuse.
    // If you haven't set a REVALIDATION_SECRET, this skips the check, 
    // but in production you should use ?secret=YOUR_TOKEN.
    if (process.env.REVALIDATION_SECRET && secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Purge the entire Next.js router cache layout
    revalidatePath("/", "layout");
    
    return NextResponse.json({
      revalidated: true,
      message: "Global cache revalidated successfully.",
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
