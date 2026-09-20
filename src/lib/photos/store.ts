import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { writeJsonAtomic, withFileLock } from "../catalog/storage";
import { PhotoError, type PhotoReference, type PhotoWorkflow } from "./types";

const root = path.join(process.cwd(), "data", "photo-workflows");
export function workflowDirectory(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new PhotoError("სესია ვერ მოიძებნა.", 404);
  return path.join(root, id);
}
export function assetPath(id: string, filename: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)) throw new PhotoError("ფოტო ვერ მოიძებნა.", 404);
  return path.join(workflowDirectory(id), filename);
}
export async function readWorkflow(id: string): Promise<PhotoWorkflow> {
  try { return JSON.parse(await fs.readFile(path.join(workflowDirectory(id), "workflow.json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new PhotoError("სესია ვერ მოიძებნა.", 404); throw error; }
}
export async function writeWorkflow(workflow: PhotoWorkflow) {
  workflow.revision += 1;
  workflow.updatedAt = new Date().toISOString();
  await writeJsonAtomic(path.join(workflowDirectory(workflow.id), "workflow.json"), workflow);
}
export async function mutateWorkflow<T>(id: string, revision: unknown, run: (workflow: PhotoWorkflow) => Promise<T>): Promise<T> {
  try {
    return await withFileLock(path.join(workflowDirectory(id), "workflow.json"), async () => {
      const workflow = await readWorkflow(id);
      if (workflow.revision !== revision) throw new PhotoError("სესია შეიცვალა. ხელახლა გახსენით შენახული სესია.", 409);
      return run(workflow);
    }, 0);
  } catch (error) { if (error instanceof Error && error.message === "BUSY") throw new PhotoError("ამ სესიაში უკვე მიმდინარეობს ოპერაცია.", 409); throw error; }
}
export async function listWorkflows(productId?: string) {
  await fs.mkdir(root, { recursive: true });
  const entries = await fs.readdir(root);
  const workflows = await Promise.all(entries.filter(id => /^[0-9a-f-]{36}$/.test(id)).map(async id => {
    try { return await readWorkflow(id); } catch { return null; }
  }));
  return workflows.filter((item): item is PhotoWorkflow => !!item && (!productId || item.productId === productId))
    .sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function createWorkflow(productId: string): Promise<PhotoWorkflow> {
  const now = new Date().toISOString();
  const workflow: PhotoWorkflow = { id: randomUUID(), productId, revision: 0, references: [], outputs: [], summary: "", warnings: [], planApproved: false, createdAt: now, updatedAt: now };
  await writeWorkflow(workflow);
  return workflow;
}
export async function storeReference(workflow: PhotoWorkflow, buffer: Buffer, originalName: string): Promise<PhotoReference | null> {
  if (!buffer.length || buffer.length > 20 * 1024 * 1024) throw new PhotoError("თითო ფოტო მაქსიმუმ 20 MB უნდა იყოს.");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  if (workflow.references.some(ref => ref.sha256 === sha256)) return null;
  let metadata;
  try { metadata = await sharp(buffer, { limitInputPixels: 60_000_000 }).metadata(); }
  catch { throw new PhotoError("ფოტოს წაკითხვა ვერ მოხერხდა. ატვირთეთ JPG, PNG ან WebP."); }
  if (!["jpeg", "png", "webp"].includes(metadata.format || "") || !metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new PhotoError("დასაშვებია მხოლოდ სტატიკური JPG, PNG და WebP.");
  const id = randomUUID();
  const filename = `${id}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`;
  await fs.writeFile(assetPath(workflow.id, filename), buffer);
  const rotated = [5,6,7,8].includes(metadata.orientation || 1);
  return { id, filename, originalName: originalName.slice(0, 200), sha256, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height, bytes: buffer.length };
}
export async function preparedReference(workflow: PhotoWorkflow, id: string, size: number): Promise<Buffer> {
  const ref = workflow.references.find(ref => ref.id === id);
  if (!ref) throw new PhotoError("საწყისი ფოტო ვერ მოიძებნა.");
  return sharp(await fs.readFile(assetPath(workflow.id, ref.filename))).rotate().resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).png().toBuffer();
}
