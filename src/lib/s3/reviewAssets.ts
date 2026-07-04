import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/s3/client";
import { getS3Config, isS3Configured } from "@/lib/s3/config";

export const REVIEW_S3_PREFIX = "reviews/";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export type ReviewAssetMode = "s3" | "local";

let cachedReviewAssetMode: { mode: ReviewAssetMode; expires: number } | null = null;
const ASSET_MODE_TTL_MS = 60_000;

function getExtension(value: string) {
  const dot = value.lastIndexOf(".");
  return dot === -1 ? "" : value.slice(dot).toLowerCase();
}

/** Canonical app path, e.g. /reviews/photo.jpg */
export function normalizeReviewPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, "");
      if (path.startsWith("reviews/")) return `/${path}`;
    } catch {
      return trimmed;
    }
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash.startsWith("/reviews/")) return withLeadingSlash;
  if (withLeadingSlash.startsWith("/")) return `/reviews${withLeadingSlash}`;
  return `/reviews/${trimmed}`;
}

export function reviewPathToS3Key(imagePath: string) {
  return normalizeReviewPath(imagePath).replace(/^\//, "");
}

export function s3KeyToReviewPath(key: string) {
  const normalized = key.replace(/^\/+/, "");
  return normalized.startsWith("reviews/") ? `/${normalized}` : `/reviews/${normalized}`;
}

export function isReviewPath(value: string) {
  const normalized = normalizeReviewPath(value);
  return normalized.startsWith("/reviews/") && IMAGE_EXTENSIONS.has(getExtension(normalized));
}

export function resolveReviewImageUrl(imagePath: string, mode: ReviewAssetMode = "local") {
  if (!imagePath) return imagePath;

  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const path = normalizeReviewPath(imagePath);

  if (mode === "local") {
    // Local demo fallback lives under /img_review/
    const fileName = path.replace(/^\/reviews\//, "");
    return `/img_review/${fileName}`;
  }

  const base = process.env.NEXT_PUBLIC_STICKER_ASSET_BASE_URL?.replace(/\/$/, "");
  if (!base) return path;

  return `${base}/${reviewPathToS3Key(path)}`;
}

export async function getReviewAssetMode(): Promise<ReviewAssetMode> {
  if (!isS3Configured()) return "local";

  const now = Date.now();
  if (cachedReviewAssetMode && cachedReviewAssetMode.expires > now) {
    return cachedReviewAssetMode.mode;
  }

  try {
    const paths = await listReviewPathsFromS3();
    const mode: ReviewAssetMode = paths.length > 0 ? "s3" : "local";
    cachedReviewAssetMode = { mode, expires: now + ASSET_MODE_TTL_MS };
    return mode;
  } catch (error) {
    console.warn("[reviews] S3 unavailable, using local img_review backup:", error);
    cachedReviewAssetMode = { mode: "local", expires: now + ASSET_MODE_TTL_MS };
    return "local";
  }
}

export function clearReviewAssetModeCache() {
  cachedReviewAssetMode = null;
}

export async function listReviewPathsFromS3(): Promise<string[]> {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return [];

  const paths: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: REVIEW_S3_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key) continue;
      if (!IMAGE_EXTENSIONS.has(getExtension(object.Key))) continue;
      paths.push(s3KeyToReviewPath(object.Key));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return paths.sort((a, b) => a.localeCompare(b));
}

export async function reviewObjectExistsInS3(imagePath: string): Promise<boolean> {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return false;

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: reviewPathToS3Key(imagePath),
      }),
    );
    return true;
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "NotFound" || name === "NoSuchKey") return false;
    throw error;
  }
}

export async function uploadReviewObject(
  imagePath: string,
  body: PutObjectCommandInput["Body"],
  contentType: string,
) {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) {
    throw new Error("S3 is not configured. Set AWS env vars in .env.local.");
  }

  const key = reviewPathToS3Key(imagePath);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    path: normalizeReviewPath(imagePath),
    url: resolveReviewImageUrl(imagePath, "s3"),
  };
}

export async function deleteReviewObject(imagePath: string) {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return false;

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: reviewPathToS3Key(imagePath),
    }),
  );

  return true;
}
