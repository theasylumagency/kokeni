import type { ProductImage } from "../catalog/types";

export const PHOTO_ROLES = ["main", "informative", "detail", "additional"] as const;
export type PhotoRole = typeof PHOTO_ROLES[number];

export const PRODUCT_GEOMETRIES = ["flat", "volumetric", "uncertain"] as const;
export type ProductGeometry = typeof PRODUCT_GEOMETRIES[number];

export const REFERENCE_STATES = ["closed", "open", "other"] as const;
export type ReferenceState = typeof REFERENCE_STATES[number];

export const REFERENCE_VIEWS = [
  "front",
  "top",
  "three_quarter",
  "side",
  "back",
  "detail",
  "unknown",
] as const;
export type ReferenceView = typeof REFERENCE_VIEWS[number];

export const REFERENCE_STRENGTHS = ["high", "medium", "low"] as const;
export type ReferenceStrength = typeof REFERENCE_STRENGTHS[number];

export type PhotoReference = {
  id: string; filename: string; originalName: string; sha256: string;
  width: number; height: number; bytes: number;
};

export type ReferenceAssessment = {
  referenceId: string;
  state: ReferenceState;
  view: ReferenceView;
  identityStrength: ReferenceStrength;
  informationValue: ReferenceStrength;
  publishable: boolean;
  measurementOnly: boolean;
  brandingVisible: boolean;
  interiorVisible: boolean;
  constructionVisible: boolean;
  notes: string;
};

export type PhotoOutput = {
  id: string; role: PhotoRole; title: string; reason: string;
  baseReferenceId: string; supportingReferenceIds: string[]; instruction: string;
  draft?: { filename: string; approved: boolean; provenance: NonNullable<ProductImage["provenance"]> };
  attempts: number; error?: string;
};

export type PhotoWorkflow = {
  id: string; productId: string; revision: number; references: PhotoReference[];
  summary: string; warnings: string[]; outputs: PhotoOutput[]; planApproved: boolean;
  analysis?: {
    model: string;
    at: string;
    geometry?: ProductGeometry;
    references?: ReferenceAssessment[];
    usage?: Record<string, unknown>;
  };
  history?: Array<{ outputId: string; at: string; attempt: number; correction: string; filename?: string; provenance?: NonNullable<ProductImage["provenance"]>; error?: string }>;
  savedAt?: string; createdAt: string; updatedAt: string;
};

export function referenceUrl(workflowId: string, filename: string) {
  return `/api/admin/photo-workflows/${workflowId}/assets/${filename}`;
}

export class PhotoError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function validatePlan(value: unknown, references: PhotoReference[]): PhotoOutput[] {
  if (!Array.isArray(value) || !value.length || value.length > 8) throw new PhotoError("გეგმაში საჭიროა 1–8 კადრი.");
  const ids = new Set<string>();
  const refs = new Set(references.map(ref => ref.id));
  const outputs = value.map((item): PhotoOutput => {
    if (!item || typeof item !== "object") throw new PhotoError("არასწორი გეგმა.");
    if (typeof item.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) || ids.has(item.id)) throw new PhotoError("კადრის იდენტიფიკატორი არასწორია.");
    ids.add(item.id);
    if (!PHOTO_ROLES.includes(item.role) || typeof item.title !== "string" || !item.title.trim() || item.title.length > 200 || !refs.has(item.baseReferenceId)) throw new PhotoError("შეავსეთ კადრის სახელი, როლი და ძირითადი ფოტო.");
    if (!Array.isArray(item.supportingReferenceIds) || item.supportingReferenceIds.length > 3 || item.supportingReferenceIds.some((id: unknown) => typeof id !== "string" || !refs.has(id) || id === item.baseReferenceId) || new Set(item.supportingReferenceIds).size !== item.supportingReferenceIds.length) throw new PhotoError("აირჩიეთ მაქსიმუმ 3 განსხვავებული დამხმარე ფოტო.");
    if (typeof item.instruction !== "string" || item.instruction.length > 1500 || typeof item.reason !== "string" || item.reason.length > 2000) throw new PhotoError("კადრის ინსტრუქცია ზედმეტად გრძელია.");
    return { id: item.id, role: item.role, title: item.title.trim(), reason: item.reason, baseReferenceId: item.baseReferenceId, supportingReferenceIds: item.supportingReferenceIds, instruction: item.instruction, attempts: 0 };
  });
  if (outputs.filter(output => output.role === "main").length !== 1) throw new PhotoError("გეგმას ზუსტად ერთი მთავარი კადრი უნდა ჰქონდეს.");
  return outputs;
}
