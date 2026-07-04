import { type CatalogEntry } from "@/data/stickers";

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
