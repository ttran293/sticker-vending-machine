import * as THREE from "three";

/**
 * Composites sticker artwork into the rack texture.
 * Transparent PNGs keep their alpha shape; flat images get the original rounded
 * white backing.
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

  if (hasTransparentPixels(img)) {
    drawContain(ctx, img, x, y, w, h);
  } else {
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
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function hasTransparentPixels(img: HTMLImageElement) {
  const probeSize = 96;
  const probe = document.createElement("canvas");
  probe.width = probeSize;
  probe.height = probeSize;
  const probeCtx = probe.getContext("2d", { willReadFrequently: true })!;
  probeCtx.drawImage(img, 0, 0, probeSize, probeSize);

  const data = probeCtx.getImageData(0, 0, probeSize, probeSize).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
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

/** Draws an image fully inside the target rect, preserving transparent edges. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let w = dw;
  let h = dh;
  if (ir > tr) {
    h = dw / ir;
  } else {
    w = dh * ir;
  }
  ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}
