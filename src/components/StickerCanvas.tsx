"use client";

import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { RackHoverProvider, useRackHover } from "./StickerRackHoverContext";

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
  infoOpenId: string | null;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

function StickerRack({
  infoOpenId,
  onSelect,
  onInfoChange,
}: {
  infoOpenId: string | null;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
}) {
  return (
    <group>
      {[...stickers]
        .sort((a, b) => Number(a.placeholder ?? false) - Number(b.placeholder ?? false))
        .map((sticker) => {
          const index = stickers.indexOf(sticker);
          const col = index % GRID_COLS;
          const row = Math.floor(index / GRID_COLS);
          const x = (col - (GRID_COLS - 1) / 2) * GAP_X;
          const y = ((GRID_ROWS - 1) / 2 - row) * GAP_Y;
          return (
            <Sticker3D
              key={sticker.id}
              sticker={sticker}
              position={[x, y, 0]}
              seed={index * 1.7}
              infoActive={infoOpenId === sticker.id}
              dimmed={infoOpenId !== null && infoOpenId !== sticker.id}
              onInfoChange={onInfoChange}
              onSelect={(sticker) => {
                if (sticker.placeholder) return;
                onSelect(sticker);
              }}
            />
          );
        })}
    </group>
  );
}

export default function StickerCanvas({ infoOpenId, onSelect, onInfoChange }: Props) {
  const clearAllRef = useRef<(() => void) | null>(null);

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: CAMERA_FOV }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
      onPointerMissed={() => clearAllRef.current?.()}
    >
      <RackHoverProvider clearAllRef={clearAllRef}>
        <RackPointerBridge />
        <FitCamera />
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <group position={[0, RACK_Y_OFFSET, 0]}>
            <StickerRack
              infoOpenId={infoOpenId}
              onSelect={onSelect}
              onInfoChange={onInfoChange}
            />
          </group>
        </Suspense>
      </RackHoverProvider>
    </Canvas>
  );
}

function RackPointerBridge() {
  const rackHover = useRackHover();
  const { gl, pointer } = useThree();

  useFrame(() => {
    rackHover?.syncBottomRow(pointer.y);
  });

  useLayoutEffect(() => {
    if (!rackHover) return;
    const clear = () => rackHover.clearAll();
    const canvas = gl.domElement;
    canvas.addEventListener("pointerleave", clear);
    return () => canvas.removeEventListener("pointerleave", clear);
  }, [rackHover, gl]);

  return null;
}
