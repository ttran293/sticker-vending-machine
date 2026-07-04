import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/s3/client";
import { getS3Config, STICKER_S3_PREFIX, isS3Configured } from "@/lib/s3/config";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export type StickerAssetMode = "s3" | "local";

let cachedAssetMode: { mode: StickerAssetMode; expires: number } | null = null;
const ASSET_MODE_TTL_MS = 60_000;

/** Prefer S3 when configured and reachable; otherwise fall back to public/stickers */
export async function getStickerAssetMode(): Promise<StickerAssetMode> {
  if (!isS3Configured()) return "local";

  const now = Date.now();
  if (cachedAssetMode && cachedAssetMode.expires > now) {
    return cachedAssetMode.mode;
  }

  try {
    const paths = await listStickerPathsFromS3();
    const mode: StickerAssetMode = paths.length > 0 ? "s3" : "local";
    cachedAssetMode = { mode, expires: now + ASSET_MODE_TTL_MS };
    return mode;
  } catch (error) {
    console.warn("[stickers] S3 unavailable, using local public/stickers backup:", error);
    cachedAssetMode = { mode: "local", expires: now + ASSET_MODE_TTL_MS };
    return "local";
  }
}

export function clearStickerAssetModeCache() {
  cachedAssetMode = null;
}

/** Canonical app path, e.g. /stickers/hat-dog/bucket-hat.png */
export function normalizeStickerPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, "");
      if (path.startsWith("stickers/")) return `/${path}`;
    } catch {
      return trimmed;
    }
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash.startsWith("/stickers/")) return withLeadingSlash;
  if (withLeadingSlash.startsWith("/")) return `/stickers${withLeadingSlash}`;
  return `/stickers/${trimmed}`;
}

export function stickerPathToS3Key(imagePath: string) {
  const normalized = normalizeStickerPath(imagePath);
  return normalized.replace(/^\//, "");
}

export function s3KeyToStickerPath(key: string) {
  const normalized = key.replace(/^\/+/, "");
  return normalized.startsWith("stickers/") ? `/${normalized}` : `/stickers/${normalized}`;
}

export function isStickerPath(value: string) {
  const normalized = normalizeStickerPath(value);
  return normalized.startsWith("/stickers/") && IMAGE_EXTENSIONS.has(getExtension(normalized));
}

function getExtension(value: string) {
  const dot = value.lastIndexOf(".");
  return dot === -1 ? "" : value.slice(dot).toLowerCase();
}

/** URL for img/Image/Three.js — S3 when mode is s3, else local /stickers/ path */
export function resolveStickerImageUrl(
  imagePath: string,
  mode: StickerAssetMode = "local",
) {
  if (!imagePath) return imagePath;

  const path = normalizeStickerPath(
    /^https?:\/\//i.test(imagePath) ? imagePath : imagePath,
  );

  if (mode === "local") return path;

  const base = process.env.NEXT_PUBLIC_STICKER_ASSET_BASE_URL?.replace(/\/$/, "");
  if (!base) return path;

  return `${base}/${stickerPathToS3Key(path)}`;
}

export async function usesRemoteStickerAssets() {
  return (await getStickerAssetMode()) === "s3";
}

export async function listStickerPathsFromS3(): Promise<string[]> {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return [];

  const paths: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: STICKER_S3_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key) continue;
      if (!IMAGE_EXTENSIONS.has(getExtension(object.Key))) continue;
      paths.push(s3KeyToStickerPath(object.Key));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return paths.sort((a, b) => a.localeCompare(b));
}

export async function stickerObjectExistsInS3(imagePath: string): Promise<boolean> {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return false;

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: stickerPathToS3Key(imagePath),
      }),
    );
    return true;
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "NotFound" || name === "NoSuchKey") return false;
    throw error;
  }
}

export async function uploadStickerObject(
  imagePath: string,
  body: PutObjectCommandInput["Body"],
  contentType: string,
) {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) {
    throw new Error("S3 is not configured. Set AWS env vars in .env.local.");
  }

  const key = stickerPathToS3Key(imagePath);

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
    path: normalizeStickerPath(imagePath),
    url: resolveStickerImageUrl(imagePath, "s3"),
  };
}

export async function deleteStickerObject(imagePath: string) {
  const client = getS3Client();
  const config = getS3Config();
  if (!client || !config) return false;

  const key = stickerPathToS3Key(imagePath);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );

  return true;
}

export { isS3Configured };
