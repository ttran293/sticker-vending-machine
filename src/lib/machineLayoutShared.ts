import { GRID_COLS, GRID_ROWS } from "@/data/stickers";

export type MachineLayout = (string | null)[];

export const SLOT_COUNT = GRID_COLS * GRID_ROWS;

export const DEFAULT_LAYOUT: MachineLayout = [
  "/stickers/hat-dog/bucket-hat.png",
  "/stickers/hat-dog/hat-angry.png",
  "/stickers/hat-dog/hat-and-smie.png",
  "/stickers/hat-dog/hat-cute.png",
  "/stickers/hat-dog/jelly-with-hat.png",
  "/stickers/cat_climb/v0.png",
  "/stickers/cat_climb/v2.png",
  "/stickers/cat_climb/v3.png",
  "/stickers/cat_climb/v5.png",
  "/stickers/cat_climb/v7.png",
  "/stickers/cat_climb_exp/p2-1.png",
  "/stickers/cat_climb_exp/p2-2.png",
  "/stickers/cat_climb_exp/p2-3.png",
  "/stickers/cat_climb_exp/p2-4.png",
  "/stickers/cat_climb_exp/p2-5.png",
  "/stickers/buttercup/bad-hair-day.png",
  "/stickers/buttercup/costume.png",
  "/stickers/buttercup/hello-phone.png",
  "/stickers/buttercup/proud.png",
  "/stickers/buttercup/wide-eyes.png",
];

export function normalizeLayout(raw: unknown): MachineLayout | null {
  const slots = Array.isArray(raw) ? raw : null;
  if (!slots || slots.length !== SLOT_COUNT) return null;

  return slots.map((value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || !value.startsWith("/stickers/")) return null;
    return value;
  });
}

export function sanitizeLayout(layout: MachineLayout): MachineLayout {
  if (layout.length !== SLOT_COUNT) {
    throw new Error(`Layout must have exactly ${SLOT_COUNT} slots.`);
  }

  return layout.map((value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value !== "string" || !value.startsWith("/stickers/")) {
      throw new Error(`Invalid sticker path: ${String(value)}`);
    }
    return value;
  });
}

export function getSlotCode(index: number) {
  const row = Math.floor(index / GRID_COLS);
  const col = index % GRID_COLS;
  return `${String.fromCharCode(65 + row)}${col + 1}`;
}

export function getMachineSlotByImageFromLayout(layout: MachineLayout) {
  const slotByImage = new Map<string, string>();
  layout.forEach((image, index) => {
    if (image) slotByImage.set(image, getSlotCode(index));
  });
  return slotByImage;
}
