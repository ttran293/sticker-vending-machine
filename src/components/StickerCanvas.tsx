"use client";

import { Suspense, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stickers, GRID_COLS, GRID_ROWS, type Sticker } from "@/data/stickers";
import {
  GAP_X,
  GAP_Y,
  getRackBounds,
  RACK_FIT_PADDING,
  RACK_Y_OFFSET,
} from "@/lib/sticker3dConstants";
import Sticker3D from "./Sticker3D";

const CAMERA_FOV = 34;

/** Only framing system — distance from getRackBounds() × RACK_FIT_PADDING. */
function FitCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const { halfW, halfH } = getRackBounds();
    const vFovRad = THREE.MathUtils.degToRad(camera.fov);
    const aspect = size.width / Math.max(size.height, 1);
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

    const distForHeight = (halfH / Math.tan(vFovRad / 2)) * RACK_FIT_PADDING;
    const distForWidth = (halfW / Math.tan(hFovRad / 2)) * RACK_FIT_PADDING;

    camera.position.set(0, 0, Math.max(distForHeight, distForWidth));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

type Props = {
  counts: Record<string, number>;
  infoOpenId: string | null;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

function StickerRack({
  counts,
  infoOpenId,
  onSelect,
  onInfoChange,
}: {
  counts: Record<string, number>;
  infoOpenId: string | null;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
}) {
  return (
    <group>
      {stickers.map((sticker, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = (col - (GRID_COLS - 1) / 2) * GAP_X;
        const y = ((GRID_ROWS - 1) / 2 - row) * GAP_Y;
        return (
          <Sticker3D
            key={sticker.id}
            sticker={sticker}
            position={[x, y, 0]}
            seed={i * 1.7}
            selectedCount={counts[sticker.id] ?? 0}
            infoActive={infoOpenId === sticker.id}
            dimmed={infoOpenId !== null && infoOpenId !== sticker.id}
            onInfoChange={onInfoChange}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

export default function StickerCanvas({ counts, infoOpenId, onSelect, onInfoChange }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: CAMERA_FOV }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <FitCamera />
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <group position={[0, RACK_Y_OFFSET, 0]}>
          <StickerRack
            counts={counts}
            infoOpenId={infoOpenId}
            onSelect={onSelect}
            onInfoChange={onInfoChange}
          />
        </group>
      </Suspense>
    </Canvas>
  );
}
