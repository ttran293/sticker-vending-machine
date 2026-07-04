import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { catalogMetadataByImage } from "@/data/stickers";
import { requireAdmin } from "@/lib/auth";
import { removeImageFromAllSlots } from "@/lib/machineSlots";
import { fallbackCatalogEntry } from "@/lib/stickerMetadata";
import {
  deleteStickerFile,
  getAllowedStickerMimeTypes,
  getContentTypeForFileName,
  saveStickerFile,
  validateUploadContentType,
} from "@/lib/stickerStorage";
import { isStickerPath, normalizeStickerPath } from "@/lib/s3/stickerAssets";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = formData.get("folder");
  const replace = formData.get("replace") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  }

  if (typeof folder !== "string" || !folder.trim()) {
    return NextResponse.json({ error: "Choose a folder for this sticker." }, { status: 400 });
  }

  const allowedMimeTypes = getAllowedStickerMimeTypes();
  const contentType = file.type || getContentTypeForFileName(file.name);

  if (!allowedMimeTypes.has(contentType)) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP, and GIF files are supported." },
      { status: 400 },
    );
  }

  try {
    validateUploadContentType(file.name, contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid file type.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const imagePath = await saveStickerFile(folder, file.name, buffer, contentType, { replace });
    const entry = catalogMetadataByImage[imagePath] ?? fallbackCatalogEntry(imagePath);

    revalidatePath("/");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true, image_path: imagePath, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const imagePath = (body as { image_path?: unknown }).image_path;
  if (typeof imagePath !== "string" || !isStickerPath(imagePath)) {
    return NextResponse.json({ error: "Invalid sticker path." }, { status: 400 });
  }

  const normalized = normalizeStickerPath(imagePath);

  try {
    const slots = await removeImageFromAllSlots(normalized);
    await deleteStickerFile(normalized);

    revalidatePath("/");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true, image_path: normalized, slots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
