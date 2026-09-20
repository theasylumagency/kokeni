import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getAdminCatalogSnapshot, saveWorkflowGallery } from "@/lib/catalog/data";
import type { ProductImage } from "@/lib/catalog/types";
import { assetPath, mutateWorkflow, readWorkflow, storeReference, writeWorkflow } from "@/lib/photos/store";
import { analyzeReferences } from "@/lib/photos/provider";
import { photoAuth, photoError } from "@/lib/photos/http";
import { PhotoError, validatePlan } from "@/lib/photos/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await photoAuth(request);
    const workflow = await readWorkflow((await context.params).id);
    const catalog = await getAdminCatalogSnapshot();
    const product = catalog.products.find(product => product.id === workflow.productId);
    return NextResponse.json({ workflow, product }, { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return photoError(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    await photoAuth(request);
    const { id } = await context.params;
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if (Number(request.headers.get("content-length")) > 21 * 1024 * 1024) throw new PhotoError("ატვირთვა მაქსიმუმ 20 MB უნდა იყოს.", 413);
      const form = await request.formData();
      const result = await mutateWorkflow(id, Number(form.get("revision")), async workflow => {
        if (workflow.outputs.length) throw new PhotoError("ახალი ფოტოებისათვის შექმენით ახალი სესია.");
        const file = form.get("file");
        if (!(file instanceof File)) throw new PhotoError("აირჩიეთ ფოტო.");
        if (workflow.references.length >= 10) throw new PhotoError("მაქსიმუმ 10 საწყისი ფოტოა დაშვებული.");
        const reference = await storeReference(workflow, Buffer.from(await file.arrayBuffer()), file.name);
        if (reference) { workflow.references.push(reference); await writeWorkflow(workflow); }
        return { workflow, duplicate: !reference };
      });
      return NextResponse.json(result);
    }
    const body = await request.json();
    const result = await mutateWorkflow(id, body.revision, async workflow => {
      if (body.action === "references") {
        if (workflow.outputs.length) throw new PhotoError("გეგმის შექმნის შემდეგ საწყისი ფოტოები უცვლელია. ახალი ნაკრებისთვის შექმენით ახალი სესია.");
        if (!Array.isArray(body.referenceIds) || body.referenceIds.length > 10 || new Set(body.referenceIds).size !== body.referenceIds.length || body.referenceIds.some((id: unknown) => !workflow.references.some(ref => ref.id === id))) throw new PhotoError("ფოტოების სია არასწორია.");
        workflow.references = body.referenceIds.map((id: string) => workflow.references.find(ref => ref.id === id)!);
      } else if (body.action === "analyze") {
        if (workflow.outputs.some(output => output.draft)) throw new PhotoError("ხელახალი ანალიზისთვის შექმენით ახალი სესია. მიმდინარე შედეგები შენარჩუნდება.");
        const catalog = await getAdminCatalogSnapshot();
        const product = catalog.products.find(product => product.id === workflow.productId);
        if (!product) throw new PhotoError("პროდუქტი ვერ მოიძებნა.", 404);
        Object.assign(workflow, await analyzeReferences(workflow, product.name.ka));
        workflow.planApproved = false;
      } else if (body.action === "plan") {
        if (workflow.references.length < 2) throw new PhotoError("საჭიროა მინიმუმ 2 საწყისი ფოტო.");
        const outputs = validatePlan(body.outputs, workflow.references);
        workflow.outputs = outputs.map(output => {
          const previous = workflow.outputs.find(item => item.id === output.id);
          const unchanged = previous && ["role", "title", "baseReferenceId", "supportingReferenceIds", "instruction"].every(key => JSON.stringify(previous[key as keyof typeof previous]) === JSON.stringify(output[key as keyof typeof output]));
          return { ...output, attempts: previous?.attempts || 0, draft: unchanged ? previous.draft : undefined };
        });
        workflow.planApproved = body.approve === true;
        workflow.savedAt = undefined;
      } else if (body.action === "review") {
        const output = workflow.outputs.find(output => output.id === body.outputId);
        if (!output?.draft || typeof body.approved !== "boolean") throw new PhotoError("ჯერ შექმენით კადრი.");
        output.draft.approved = body.approved;
        workflow.savedAt = undefined;
      } else if (body.action === "save") {
        if (!workflow.planApproved) throw new PhotoError("ჯერ დაამტკიცეთ გეგმა.");
        const approved = workflow.outputs.filter(output => output.draft?.approved);
        if (!approved.some(output => output.role === "main")) throw new PhotoError("შენახვამდე დაამტკიცეთ მთავარი კადრი.");
        if (!["append", "replace"].includes(body.mode) || typeof body.expectedUpdatedAt !== "string") throw new PhotoError("აირჩიეთ შენახვის რეჟიმი.");
        const directory = path.join(process.cwd(), "public", "uploads", "products");
        await fs.mkdir(directory, { recursive: true });
        const ordered = [...approved.filter(output => output.role === "main"), ...approved.filter(output => output.role !== "main")];
        const images: ProductImage[] = await Promise.all(ordered.map(async (output, index) => {
          const draft = output.draft!;
          const imageId = path.parse(draft.filename).name;
          const buffer = await fs.readFile(assetPath(workflow.id, draft.filename));
          await Promise.all([1600,800].map(async size => {
            const destination = path.join(directory, `${imageId}${size === 800 ? "-mobile" : ""}.webp`);
            try { await fs.access(destination); return; } catch { /* A draft UUID is an immutable asset. */ }
            const bytes = await sharp(buffer).resize(size, size, { fit: "contain", background: "#fafafa" }).webp({ quality: 92 }).toBuffer();
            await fs.writeFile(destination, bytes);
          }));
          return { id: imageId, src: `/uploads/products/${imageId}.webp`, order: index + 1, role: output.role, label: output.title, provenance: draft.provenance };
        }));
        const product = await saveWorkflowGallery(workflow.productId, images, body.mode, body.expectedUpdatedAt);
        workflow.savedAt = new Date().toISOString();
        await writeWorkflow(workflow);
        revalidatePath("/", "layout");
        return { workflow, product };
      } else throw new PhotoError("უცნობი ოპერაცია.");
      await writeWorkflow(workflow);
      return { workflow };
    });
    return NextResponse.json(result);
  } catch (error) { return photoError(error); }
}
