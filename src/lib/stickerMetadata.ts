import { type CatalogEntry } from "@/data/stickers";
import {
  getSupabaseAnonConfig,
  getSupabaseServiceConfig,
  supabaseHeaders,
  supabaseRest,
} from "@/lib/supabase/rest";

const CATEGORY_LABELS: Record<string, string> = {
  "hat-dog": "Hat Dog",
  cat_climb: "Cat Climb",
  cat_climb_exp: "Cat Climb Exp",
  buttercup: "Buttercup",
  music_album: "Music Album",
};

export const STICKER_FOLDER_OPTIONS = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
  id,
  label,
}));

function formatLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugFromImage(image: string) {
  return image
    .replace(/^\/stickers\//, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[/\\]/g, "-")
    .replace(/_/g, "-")
    .toLowerCase();
}

export function fallbackCatalogEntry(image: string): CatalogEntry {
  const parts = image.replace(/^\/stickers\//, "").split("/");
  const folder = parts.length > 1 ? parts[parts.length - 2] : "uncategorized";
  const filename = parts[parts.length - 1]?.replace(/\.[^.]+$/, "") ?? "sticker";
  const category = CATEGORY_LABELS[folder] ?? formatLabel(folder);

  return {
    slug: slugFromImage(image),
    name: formatLabel(filename).toUpperCase(),
    note: "Imported from stickers folder",
    detail: `${category} sticker · about 2″ laminated vinyl`,
    price: 1,
    image,
    category,
    transparent: true,
  };
}

type StickerMetadataRow = {
  image_path: string;
  name: string | null;
};

export function normalizeStickerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function assertValidStickerName(value: string) {
  const name = normalizeStickerName(value);
  if (name.length < 1) {
    throw new Error("Sticker name is required.");
  }
  if (name.length > 80) {
    throw new Error("Sticker name must be 80 characters or fewer.");
  }
  return name;
}

async function readStickerMetadataRows(): Promise<StickerMetadataRow[] | null> {
  const config = getSupabaseAnonConfig();
  if (!config) return null;

  try {
    return await supabaseRest<StickerMetadataRow[]>(
      config,
      "sticker_metadata?select=image_path,name",
      { headers: supabaseHeaders(config.apiKey), cache: "no-store" },
    );
  } catch {
    return null;
  }
}

export async function getStickerNameOverrides() {
  const rows = await readStickerMetadataRows();
  const overrides = new Map<string, string>();

  for (const row of rows ?? []) {
    const name = row.name ? normalizeStickerName(row.name) : "";
    if (row.image_path && name) overrides.set(row.image_path, name);
  }

  return overrides;
}

export function applyStickerNameOverride(entry: CatalogEntry, overrides: Map<string, string>) {
  const name = overrides.get(entry.image);
  return name ? { ...entry, name } : entry;
}

export async function updateStickerName(imagePath: string, name: string) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const nextName = assertValidStickerName(name);

  await supabaseRest(
    config,
    "sticker_metadata",
    {
      method: "POST",
      headers: supabaseHeaders(config.apiKey, {
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({
        image_path: imagePath,
        name: nextName,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  return nextName;
}
