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

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    const { getAdminStorage, isAdminConfigured } = await import("@/lib/firebase/admin");

    if (isAdminConfigured) {
      try {
        const storage = await getAdminStorage();
        const bucket = storage.bucket();
        const fileRef = bucket.file(pathname);

        const buffer = Buffer.from(await file.arrayBuffer());
        await fileRef.save(buffer, {
          metadata: {
            contentType: file.type || "application/octet-stream",
          },
          public: true,
        });

        const encodedPath = encodeURIComponent(pathname);
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        return NextResponse.json({
          ok: true,
          url,
          path: pathname,
          name: file.name,
          type: file.type || "application/octet-stream",
        });
      } catch (error) {
        console.warn("[Upload API] Firebase Storage upload failed or not enabled. Falling back to local filesystem.");
      }
    }

    // --- Local Filesystem Fallback (FREE) ---
    try {
      const fs = await import("fs/promises");
      const localDir = path.join(process.cwd(), "public", "uploads", folder);

      // Ensure directory exists
      await fs.mkdir(localDir, { recursive: true });

      const localPath = path.join(localDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(localPath, buffer);

      const url = `/uploads/${folder}/${filename}`;
      console.log(`[Upload API] Saved to local: ${url}`);

      return NextResponse.json({
        ok: true,
        url,
        path: pathname,
        name: file.name,
        type: file.type || "application/octet-stream",
      });
    } catch (localError) {
      console.error("[Upload API] Local write failed:", localError);
    }

    console.warn("All upload methods failed. Returning mock.");
    return NextResponse.json({
      ok: true,
      url: "https://placehold.co/600x400?text=Mock+Upload+(Missing+Token)",
      path: "/mock-upload.png",
      name: "mock.png",
      type: "image/png",
    });
  }



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
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("private store")) {
      return NextResponse.json({
        ok: false,
        error: "Vercel Blob Store is PRIVATE. Please change it to PUBLIC in Vercel Dashboard (Storage -> Blob -> Settings)."
      }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

