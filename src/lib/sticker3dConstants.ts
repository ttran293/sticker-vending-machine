import { GRID_COLS, GRID_ROWS } from "@/data/stickers";

/** Shared 3D rack layout — keep in sync with Sticker3D mesh sizing */
export const STICKER_SIZE = 2.85;
export const BASE_SCALE = 1.08;

export const STICKER_WIDTH = STICKER_SIZE * BASE_SCALE;
export const STICKER_HALF = STICKER_WIDTH * 0.5;
export const SLOT_LABEL_OFFSET = STICKER_SIZE * BASE_SCALE * 0.52;
/** Html `[D1]` tag extent below slot center — keep in sync with FitCamera. */
export const SLOT_LABEL_HEIGHT = 0.62;
export const HOVER_SCALE = 1.18;

/** Min center-to-center gap so full hover scale never overlaps neighbors. */
const HOVER_HALF = STICKER_HALF * HOVER_SCALE;
/** Inward hover lets columns sit near sticker width apart (not 2× hover diameter). */
const HOVER_CLEARANCE_X = 0.06;
const HOVER_CLEARANCE_Y = 0.42;
export const GAP_X = STICKER_WIDTH + HOVER_CLEARANCE_X;
export const GAP_Y = 2 * HOVER_HALF + HOVER_CLEARANCE_Y + 0.12;

/**
 * FitCamera pulls back when bounds grow — raising BASE_SCALE alone barely changes
 * on-screen size. Lower padding zooms in; keep viewport aspect synced via
 * getRackViewportAspect() on .glass-viewport-canvas.
 */
export const RACK_FIT_PADDING = 0.94;

/** Nudge rack up so bottom-row slot labels fit above the green label strip. */
export const RACK_Y_OFFSET = 0.16;

/** Visible rack extent from center — includes hover scale and slot labels. */
export function getRackBounds() {
  const rowSpan = ((GRID_ROWS - 1) / 2) * GAP_Y;
  const halfW = ((GRID_COLS - 1) / 2) * GAP_X + STICKER_HALF * HOVER_SCALE;
  const halfH = Math.max(
    rowSpan + RACK_Y_OFFSET + STICKER_HALF * HOVER_SCALE,
    rowSpan - RACK_Y_OFFSET + SLOT_LABEL_OFFSET + SLOT_LABEL_HEIGHT,
  );
  return { halfW, halfH };
}

/** Use on .glass-viewport-canvas style.aspectRatio. */
export function getRackViewportAspect() {
  const { halfW, halfH } = getRackBounds();
  return halfW / halfH;
}
