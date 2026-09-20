import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createProductRecord, getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { createWorkflow, listWorkflows, storeReference, writeWorkflow } from "@/lib/photos/store";
import { photoAuth, photoError } from "@/lib/photos/http";
import { PhotoError } from "@/lib/photos/types";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await photoAuth(request);
    const workflows = await listWorkflows(new URL(request.url).searchParams.get("productId") || undefined);
    return NextResponse.json({ workflows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return photoError(error); }
}
export async function POST(request: Request) {
  try {
    await photoAuth(request);
    const body = await request.json();
    const catalog = await getAdminCatalogSnapshot();
    let product = catalog.products.find(product => product.id === body.productId);
    if (!product) {
      if (body.productId) throw new PhotoError("პროდუქტი ვერ მოიძებნა.", 404);
      if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 200 || !catalog.categories.some(category => category.id === body.categoryId)) throw new PhotoError("აირჩიეთ კატეგორია და მიუთითეთ სახელი.");
      product = await createProductRecord({ categoryId: body.categoryId, nameKa: body.name.trim(), shortDescriptionKa: body.name.trim(), priceMode: "contact", isPublished: false, imagesJson: "[]" });
      revalidatePath("/", "layout");
    }
    const workflow = await createWorkflow(product.id);
    if (body.importOriginals === true) {
      for (const original of (product.originalImages || []).slice(0, 10)) {
        if (!/^\/uploads\/products\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/.test(original.src)) continue;
        try {
          const buffer = await fs.readFile(path.join(process.cwd(), "public", original.src));
          const ref = await storeReference(workflow, buffer, path.basename(original.src));
          if (ref) workflow.references.push(ref);
        } catch { workflow.warnings.push("ერთი ძველი ორიგინალი ვერ ჩაიტვირთა. საჭიროების შემთხვევაში ხელახლა ატვირთეთ."); }
      }
      await writeWorkflow(workflow);
    }
    return NextResponse.json({ workflow, product }, { status: 201 });
  } catch (error) { return photoError(error); }
}
