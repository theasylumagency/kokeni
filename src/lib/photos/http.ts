import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../admin/auth";
import { CatalogMutationError } from "../catalog/data";
import { PhotoError } from "./types";

export async function photoAuth(request: Request) {
  if (!(await isAdminAuthenticated())) throw new PhotoError("გთხოვთ შეხვიდეთ ადმინისტრატორის ანგარიშით.", 401);
  const origin = request.headers.get("origin");
  console.error("PHOTO_ORIGIN_DEBUG", {
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    requestUrl: request.url,
  });
  if (origin) {
    const forwardedProto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

    const forwardedHost =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

    const host = forwardedHost || request.headers.get("host");

    const protocol =
      forwardedProto || new URL(request.url).protocol.replace(":", "");

    const expectedOrigin = host
      ? `${protocol}://${host}`
      : new URL(request.url).origin;

    if (origin !== expectedOrigin) {
      throw new PhotoError("მოთხოვნა უარყოფილია.", 403);
    }
  }
}
export function photoError(error: unknown) {
  if (error instanceof PhotoError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof CatalogMutationError) return NextResponse.json({ error: error.message }, { status: error.code === "conflict" ? 409 : 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "არასწორი მოთხოვნა." }, { status: 400 });
  console.error("Photo workflow failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "ოპერაცია ვერ დასრულდა. შენახული მასალა დაცულია; ხელახლა სცადეთ." }, { status: 500 });
}
