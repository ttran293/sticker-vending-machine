export type LaminateId = "clear" | "sandy-glitter" | "laser-rainbow";

export type Laminate = {
  id: LaminateId;
  label: string;
  shortLabel: string;
  description: string;
  priceAdjustment: number;
};

export const DEFAULT_LAMINATE_ID: LaminateId = "clear";

export const LAMINATES: Record<LaminateId, Laminate> = {
  clear: {
    id: "clear",
    label: "Clear Gloss",
    shortLabel: "Gloss",
    description: "Bright color with a smooth reflective clear finish.",
    priceAdjustment: 0,
  },
  "sandy-glitter": {
    id: "sandy-glitter",
    label: "Sandy Glitter",
    shortLabel: "Sandy",
    description: "Silver-gray glitter on a fine sandy texture.",
    priceAdjustment: 0,
  },
  "laser-rainbow": {
    id: "laser-rainbow",
    label: "Laser Rainbow",
    shortLabel: "Rainbow",
    description: "Pastel holographic sheen that shifts as the sticker moves.",
    priceAdjustment: 0,
  },
};

export const LAMINATE_IDS = Object.keys(LAMINATES) as LaminateId[];

export function getVariantKey(stickerId: string, laminateId: LaminateId) {
  return `${stickerId}:${laminateId}`;
}

export function getVariantPrice(basePrice: number, laminateId: LaminateId) {
  return basePrice + LAMINATES[laminateId].priceAdjustment;
}
