import { readdirSync, statSync } from "fs";
import path from "path";
import {
  catalogMetadataByImage,
  type CatalogEntry,
} from "@/data/stickers";
import { fallbackCatalogEntry } from "@/lib/stickerMetadata";
import { listStickerPathsFromS3, getStickerAssetMode } from "@/lib/s3/stickerAssets";

const STICKER_ROOT = path.join(process.cwd(), "public", "stickers");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function walkStickerImages(dir: string, relativeDir = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const images: string[] = [];

  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      images.push(...walkStickerImages(fullPath, relativePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    images.push(`/stickers/${relativePath.replace(/\\/g, "/")}`);
  }

  return images;
}

function listStickerPathsFromLocal(): string[] {
  if (!statSync(STICKER_ROOT, { throwIfNoEntry: false })?.isDirectory()) {
    return Object.keys(catalogMetadataByImage);
  }

  return walkStickerImages(STICKER_ROOT).sort((a, b) => a.localeCompare(b));
}

async function listStickerPaths(): Promise<string[]> {
  const mode = await getStickerAssetMode();

  if (mode === "s3") {
    try {
      return await listStickerPathsFromS3();
    } catch (error) {
      console.error("[stickers] S3 listing failed, falling back to local files:", error);
    }
  }

  return listStickerPathsFromLocal();
}

/** Every sticker image in S3 (when configured) or public/stickers, merged with known metadata */
export async function getAllAvailableStickers(): Promise<CatalogEntry[]> {
  const images = await listStickerPaths();

  return images.map((image) => catalogMetadataByImage[image] ?? fallbackCatalogEntry(image));
}
