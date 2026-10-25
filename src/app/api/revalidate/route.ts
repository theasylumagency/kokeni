import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.REVALIDATION_SECRET;

    const validSecret = Boolean(expectedSecret && secret && secret === expectedSecret);
    const validAdmin = validSecret ? true : await isAdminAuthenticated();

    if (!validSecret && !validAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Purge the entire Next.js router cache layout
    revalidatePath("/", "layout");
    
    return NextResponse.json({
      revalidated: true,
      message: "Global cache revalidated successfully.",
      now: Date.now(),
    });
  } catch {
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
