import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminReviewImages } from "@/lib/reviewImages";
import {
  deleteReviewFile,
  getAllowedReviewMimeTypes,
  getReviewContentTypeForFileName,
  saveReviewFile,
  validateReviewUploadContentType,
} from "@/lib/reviewStorage";
import { isReviewPath, normalizeReviewPath } from "@/lib/s3/reviewAssets";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ images: await getAdminReviewImages() });
}

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
  const replace = formData.get("replace") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file to upload." }, { status: 400 });
  }

  const allowedMimeTypes = getAllowedReviewMimeTypes();
  const contentType = file.type || getReviewContentTypeForFileName(file.name);

  if (!allowedMimeTypes.has(contentType)) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP, and GIF files are supported." },
      { status: 400 },
    );
  }

  try {
    validateReviewUploadContentType(file.name, contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid file type.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const imagePath = await saveReviewFile(file.name, buffer, contentType, { replace });

    revalidatePath("/");
    revalidatePath("/dashboard");

    const images = await getAdminReviewImages();
    const uploaded = images.find((image) => image.path === imagePath);

    return NextResponse.json({ ok: true, image_path: imagePath, image: uploaded });
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
  if (typeof imagePath !== "string" || !isReviewPath(imagePath)) {
    return NextResponse.json({ error: "Invalid review image path." }, { status: 400 });
  }

  const normalized = normalizeReviewPath(imagePath);

  try {
    await deleteReviewFile(normalized);

    revalidatePath("/");
    revalidatePath("/dashboard");

    return NextResponse.json({ ok: true, image_path: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
