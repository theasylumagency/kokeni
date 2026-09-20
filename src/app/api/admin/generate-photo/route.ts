import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { photoAuth, photoError } from "@/lib/photos/http";
import { assetPath, mutateWorkflow, writeWorkflow } from "@/lib/photos/store";
import { editProductPhoto } from "@/lib/photos/provider";
import { PhotoError } from "@/lib/photos/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    await photoAuth(request);
    const body = await request.json();
    const result = await mutateWorkflow(body.workflowId, body.revision, async workflow => {
      if (!workflow.planApproved) throw new PhotoError("გენერაციამდე დაამტკიცეთ გეგმა.");
      const output = workflow.outputs.find(output => output.id === body.outputId);
      if (!output) throw new PhotoError("კადრი ვერ მოიძებნა.", 404);
      const correction = body.correction ?? "";
      if (typeof correction !== "string" || correction.length > 1500) throw new PhotoError("შესწორება მაქსიმუმ 1500 სიმბოლო უნდა იყოს.");
      output.attempts += 1;
      output.error = undefined;
      try {
        const generated = await editProductPhoto(workflow, output, correction);
        const filename = `${randomUUID()}.png`;
        const buffer = await sharp(generated.buffer, { limitInputPixels: 60_000_000 }).png().toBuffer();
        await fs.writeFile(assetPath(workflow.id, filename), buffer);
        output.draft = { filename, approved: false, provenance: generated.provenance };
        workflow.history = [...(workflow.history || []), { outputId: output.id, at: generated.provenance.generatedAt, attempt: output.attempts, correction, filename, provenance: generated.provenance }];
        workflow.savedAt = undefined;
        await writeWorkflow(workflow);
        return { workflow };
      } catch (error) {
        output.error = error instanceof PhotoError ? error.message : "კადრის შექმნა ვერ დასრულდა.";
        workflow.history = [...(workflow.history || []), { outputId: output.id, at: new Date().toISOString(), attempt: output.attempts, correction, error: output.error }];
        await writeWorkflow(workflow);
        return { workflow, error: output.error };
      }
    });
    return NextResponse.json(result, { status: result.error ? 502 : 200 });
  } catch (error) { return photoError(error); }
}
