/**
 * Single source of truth for rack pointer/hover.
 * StickerCanvas drives this every frame; Sticker3D meshes do not raycast.
 */
import * as THREE from "three";
import { GRID_COLS, type Sticker } from "@/data/stickers";
import {
  getColCenterLocalX,
  getRowCenterLocalY,
  PLACEHOLDER_CELL_H,
  PLACEHOLDER_CELL_W,
  PLACEHOLDER_CELL_Y,
  RACK_Y_OFFSET,
  SLOT_LABEL_HEIGHT,
  SLOT_LABEL_HIT_SCALE,
  SLOT_LABEL_OFFSET,
  STICKER_HALF,
} from "@/lib/sticker3dConstants";

export type SlotPointerZone = "none" | "sticker" | "gap" | "label" | "placeholder";

export type SlotPointerHit = {
  zone: SlotPointerZone;
  sticker: Sticker | null;
  index: number;
};

type ProjectedRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type ProjectedSlot = {
  index: number;
  sticker: Sticker;
  stickerBody: ProjectedRect;
  gap: ProjectedRect | null;
  label: ProjectedRect;
  placeholder: ProjectedRect | null;
};

const projectPoint = new THREE.Vector3();
const LABEL_HALF_W = STICKER_HALF * 0.72 * SLOT_LABEL_HIT_SCALE;
const LABEL_HALF_H = SLOT_LABEL_HEIGHT * 0.55 * SLOT_LABEL_HIT_SCALE;

function worldY(localY: number) {
  return localY + RACK_Y_OFFSET;
}

function projectRect(
  camera: THREE.Camera,
  centerX: number,
  centerY: number,
  halfW: number,
  halfH: number,
): ProjectedRect {
  const corners: [number, number][] = [
    [centerX - halfW, centerY + halfH],
    [centerX + halfW, centerY + halfH],
    [centerX - halfW, centerY - halfH],
    [centerX + halfW, centerY - halfH],
  ];

  let left = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  let bottom = Infinity;

  for (const [x, y] of corners) {
    projectPoint.set(x, worldY(y), 0).project(camera);
    left = Math.min(left, projectPoint.x);
    right = Math.max(right, projectPoint.x);
    top = Math.max(top, projectPoint.y);
    bottom = Math.min(bottom, projectPoint.y);
  }

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) * 0.5,
    centerY: (top + bottom) * 0.5,
  };
}

function inRect(x: number, y: number, rect: ProjectedRect) {
  return x >= rect.left && x <= rect.right && y >= rect.bottom && y <= rect.top;
}

function distSq(x: number, y: number, rect: ProjectedRect) {
  const dx = x - rect.centerX;
  const dy = y - rect.centerY;
  return dx * dx + dy * dy;
}

export function buildProjectedSlots(
  camera: THREE.Camera,
  machineStickers: Sticker[],
): ProjectedSlot[] {
  return machineStickers.map((sticker, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    const cx = getColCenterLocalX(col);
    const cy = getRowCenterLocalY(row);

    const stickerBody = projectRect(camera, cx, cy, STICKER_HALF, STICKER_HALF);

    const labelCenterY = cy - SLOT_LABEL_OFFSET;
    const label = projectRect(camera, cx, labelCenterY, LABEL_HALF_W, LABEL_HALF_H);

    const gapTop = Math.max(stickerBody.bottom, label.top);
    const gapBottom = Math.min(stickerBody.bottom, label.top);
    const gap: ProjectedRect | null =
      gapTop - gapBottom > 0.002
        ? {
            left: stickerBody.left,
            right: stickerBody.right,
            top: gapTop,
            bottom: gapBottom,
            centerX: stickerBody.centerX,
            centerY: (gapTop + gapBottom) * 0.5,
          }
        : null;

    let placeholder: ProjectedRect | null = null;
    if (sticker.placeholder) {
      const py = cy + PLACEHOLDER_CELL_Y;
      placeholder = projectRect(
        camera,
        cx,
        py,
        PLACEHOLDER_CELL_W * 0.5,
        PLACEHOLDER_CELL_H * 0.5,
      );
    }

    return { index, sticker, stickerBody, gap, label, placeholder };
  });
}

/** placeholder → label → gap → sticker (closest center wins ties). */
export function resolvePointerHit(
  pointerX: number,
  pointerY: number,
  slots: ProjectedSlot[],
): SlotPointerHit {
  let placeholderHit: SlotPointerHit | null = null;
  let placeholderDist = Infinity;
  let labelHit: SlotPointerHit | null = null;
  let labelDist = Infinity;
  let gapHit: SlotPointerHit | null = null;
  let gapDist = Infinity;

  for (const slot of slots) {
    if (slot.placeholder && inRect(pointerX, pointerY, slot.placeholder)) {
      const d = distSq(pointerX, pointerY, slot.placeholder);
      if (d < placeholderDist) {
        placeholderDist = d;
        placeholderHit = { zone: "placeholder", sticker: slot.sticker, index: slot.index };
      }
    }

    if (inRect(pointerX, pointerY, slot.label)) {
      const d = distSq(pointerX, pointerY, slot.label);
      if (d < labelDist) {
        labelDist = d;
        labelHit = { zone: "label", sticker: null, index: slot.index };
      }
    }

    if (slot.gap && inRect(pointerX, pointerY, slot.gap)) {
      const d = distSq(pointerX, pointerY, slot.gap);
      if (d < gapDist) {
        gapDist = d;
        gapHit = { zone: "gap", sticker: null, index: slot.index };
      }
    }
  }

  if (placeholderHit) return placeholderHit;
  if (labelHit) return labelHit;
  if (gapHit) return gapHit;

  let stickerHit: SlotPointerHit | null = null;
  let stickerDist = Infinity;

  for (const slot of slots) {
    if (slot.sticker.placeholder) continue;
    if (!inRect(pointerX, pointerY, slot.stickerBody)) continue;

    const d = distSq(pointerX, pointerY, slot.stickerBody);
    if (d < stickerDist) {
      stickerDist = d;
      stickerHit = { zone: "sticker", sticker: slot.sticker, index: slot.index };
    }
  }

  if (stickerHit) return stickerHit;
  return { zone: "none", sticker: null, index: -1 };
}

export function pointerEventToNdc(event: PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  };
}

export function isInsideCanvas(event: PointerEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}
