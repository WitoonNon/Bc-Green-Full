import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_FOLDERS = new Set(["tickets", "repairs", "promotions", "avatars", "vehicles"]);

function toSafeFolder(value: string) {
  const trimmed = value.trim().toLowerCase();
  return ALLOWED_FOLDERS.has(trimmed) ? trimmed : "tickets";
}

function toSafeFilename(name: string) {
  const ext = path.extname(name);
  const base = path.basename(name, ext).replace(/[^a-z0-9-_]+/gi, "");
  const safeBase = base.length ? base : "file";
  return `${Date.now()}-${safeBase}-${randomUUID()}${ext}`;
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.warn("Vercel Blob read/write token is missing. Uploads will be mocked.");
    return NextResponse.json({
      ok: true,
      url: "https://placehold.co/600x400?text=Mock+Upload+(Missing+Token)",
      path: "/mock-upload.png",
      name: "mock.png",
      type: "image/png",
    });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  const folderValue = formData.get("folder");
  const folder = toSafeFolder(typeof folderValue === "string" ? folderValue : "");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Missing file." },
      { status: 400 },
    );
  }

  const filename = toSafeFilename(file.name);
  const pathname = path.posix.join("uploads", folder, filename);

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      path: blob.pathname,
      name: file.name,
      type: file.type || "application/octet-stream",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
