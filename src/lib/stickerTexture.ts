import * as THREE from "three";

/**
 * Composites a square artwork into a die-cut sticker look: a thin white border
 * with rounded corners on a transparent background.
 * Returns a Three.js texture ready to map onto a plane. Browser-only (Canvas 2D).
 */
export function createDieCutTexture(img: HTMLImageElement): THREE.CanvasTexture {
  const size = 640;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const pad = 28;
  const x = pad;
  const y = pad;
  const w = size - pad * 2;
  const h = size - pad * 2;
  const radius = 78;
  const border = 26; // thin white die-cut margin

  // White die-cut backing (no soft shadow)
  roundRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Artwork clipped inside a slightly smaller rounded rect (leaves the white edge)
  ctx.save();
  roundRect(ctx, x + border, y + border, w - border * 2, h - border * 2, radius - border * 0.6);
  ctx.clip();
  drawCover(ctx, img, x + border, y + border, w - border * 2, h - border * 2);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws an image to cover the target rect (center-crop), preserving aspect ratio. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
