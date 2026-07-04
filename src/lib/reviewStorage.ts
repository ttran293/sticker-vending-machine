import path from "path";
import {
  clearReviewAssetModeCache,
  deleteReviewObject,
  isReviewPath,
  normalizeReviewPath,
  reviewObjectExistsInS3,
  uploadReviewObject,
} from "@/lib/s3/reviewAssets";
import { isS3Configured } from "@/lib/s3/config";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function sanitizeReviewFileName(value: string) {
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

export async function saveReviewFile(
  fileName: string,
  body: Buffer,
  contentType: string,
  options?: { replace?: boolean },
) {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Set AWS env vars in .env.local to upload review images.");
  }

  const safeFileName = sanitizeReviewFileName(fileName);
  const imagePath = normalizeReviewPath(`/reviews/${safeFileName}`);

  if (!isReviewPath(imagePath)) {
    throw new Error("Invalid review image path.");
  }

  if (!options?.replace && (await reviewObjectExistsInS3(imagePath))) {
    throw new Error("A review image with this name already exists.");
  }

  await uploadReviewObject(imagePath, body, contentType);
  clearReviewAssetModeCache();

  return imagePath;
}

export async function deleteReviewFile(imagePath: string) {
  const normalized = normalizeReviewPath(imagePath);

  if (!isReviewPath(normalized)) {
    throw new Error("Invalid review image path.");
  }

  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Cannot delete review images.");
  }

  await deleteReviewObject(normalized);
  clearReviewAssetModeCache();
}

export function getAllowedReviewMimeTypes() {
  return new Set(Object.values(MIME_BY_EXT));
}

export function getReviewContentTypeForFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function validateReviewUploadContentType(fileName: string, contentType: string) {
  const expected = getReviewContentTypeForFileName(fileName);
  if (contentType && contentType !== "application/octet-stream" && contentType !== expected) {
    throw new Error("File type does not match its extension.");
  }
}
