import path from "path";
import {
  clearStickerAssetModeCache,
  deleteStickerObject,
  isS3Configured,
  isStickerPath,
  normalizeStickerPath,
  stickerObjectExistsInS3,
  uploadStickerObject,
} from "@/lib/s3/stickerAssets";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function sanitizeStickerFolder(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Folder name is required.");
  }

  return slug;
}

export function sanitizeStickerFileName(value: string) {
  const base = path.basename(value.trim());
  const ext = path.extname(base).toLowerCase();

  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Only PNG, JPG, WEBP, and GIF files are supported.");
  }

  const stem = path
    .basename(base, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!stem) {
    throw new Error("File name is required.");
  }

  return `${stem}${ext}`;
}

/** Uploads go to S3 only. public/stickers stays a read-only demo fallback. */
export async function saveStickerFile(
  folder: string,
  fileName: string,
  body: Buffer,
  contentType: string,
  options?: { replace?: boolean },
) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Set AWS env vars in .env.local to upload stickers.");
  }

  if (body.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  const safeFolder = sanitizeStickerFolder(folder);
  const safeFileName = sanitizeStickerFileName(fileName);
  const imagePath = normalizeStickerPath(`/stickers/${safeFolder}/${safeFileName}`);

  if (!isStickerPath(imagePath)) {
    throw new Error("Invalid sticker path.");
  }

  if (!options?.replace && (await stickerObjectExistsInS3(imagePath))) {
    throw new Error("A sticker with this name already exists in that folder.");
  }

  await uploadStickerObject(imagePath, body, contentType);
  clearStickerAssetModeCache();

  return imagePath;
}

/** Deletes from S3 only — never modifies public/stickers demo backup. */
export async function deleteStickerFile(imagePath: string) {
  const normalized = normalizeStickerPath(imagePath);

  if (!isStickerPath(normalized)) {
    throw new Error("Invalid sticker path.");
  }

  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Cannot delete remote stickers.");
  }

  await deleteStickerObject(normalized);
  clearStickerAssetModeCache();
}

export function getAllowedStickerMimeTypes() {
  return new Set(Object.values(MIME_BY_EXT));
}

export function getContentTypeForFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function validateUploadContentType(fileName: string, contentType: string) {
  const expected = getContentTypeForFileName(fileName);
  if (contentType && contentType !== "application/octet-stream" && contentType !== expected) {
    throw new Error("File type does not match its extension.");
  }
}
