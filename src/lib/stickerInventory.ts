import { readdirSync, statSync } from "fs";
import path from "path";
import {
  catalogMetadataByImage,
  type CatalogEntry,
} from "@/data/stickers";
import { fallbackCatalogEntry } from "@/lib/stickerMetadata";

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

/** Every sticker image under public/stickers, merged with known metadata when available */
export function getAllAvailableStickers(): CatalogEntry[] {
  if (!statSync(STICKER_ROOT, { throwIfNoEntry: false })?.isDirectory()) {
    return Object.values(catalogMetadataByImage);
  }

  const images = walkStickerImages(STICKER_ROOT).sort((a, b) => a.localeCompare(b));

  return images.map((image) => catalogMetadataByImage[image] ?? fallbackCatalogEntry(image));
}
