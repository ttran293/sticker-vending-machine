"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { stickers, GRID_COLS, GRID_ROWS, type Sticker } from "@/data/stickers";
import {
  GAP_X,
  GAP_Y,
  STICKER_HALF,
  STICKER_WIDTH,
} from "@/lib/sticker3dConstants";
import Sticker3D from "./Sticker3D";

const GRID_WIDTH = (GRID_COLS - 1) * GAP_X + STICKER_WIDTH;
const SHELF_DROP = STICKER_HALF + 0.52;
const SHELF_THICKNESS = 0.016;

type Props = {
  counts: Record<string, number>;
  infoOpenId: string | null;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

function Shelves() {
  return (
    <>
      {Array.from({ length: GRID_ROWS }, (_, row) => {
        const stickerY = ((GRID_ROWS - 1) / 2 - row) * GAP_Y;
        const y = stickerY - SHELF_DROP;
        return (
          <mesh key={row} position={[0, y, -0.35]} renderOrder={0}>
            <boxGeometry args={[GRID_WIDTH, SHELF_THICKNESS, 0.01]} />
            <meshBasicMaterial color="#d8d5cc" depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

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
      <Shelves />
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
      camera={{ position: [0, 0, 18.8], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <StickerRack
          counts={counts}
          infoOpenId={infoOpenId}
          onSelect={onSelect}
          onInfoChange={onInfoChange}
        />
      </Suspense>
    </Canvas>
  );
}
