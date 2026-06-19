"use client";

import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stickers, GRID_COLS, type Sticker } from "@/data/stickers";
import {
  getColCenterLocalX,
  getRackBounds,
  getRowCenterLocalY,
  RACK_FIT_PADDING,
  RACK_Y_OFFSET,
} from "@/lib/sticker3dConstants";
import {
  buildProjectedSlots,
  isInsideCanvas,
  pointerEventToNdc,
  resolvePointerHit,
} from "@/lib/rackPointer";
import Sticker3D from "./Sticker3D";
import { RackHoverProvider, useRackHover } from "./StickerRackHoverContext";
import {
  DEFAULT_LAMINATE_ID,
  type LaminateId,
} from "@/data/laminates";

const CAMERA_FOV = 34;

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
  laminateBySticker: Record<string, LaminateId>;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

function StickerRack({
  infoOpenId,
  laminateBySticker,
  onInfoChange,
}: {
  infoOpenId: string | null;
  laminateBySticker: Record<string, LaminateId>;
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
          const x = getColCenterLocalX(col);
          const y = getRowCenterLocalY(row);
          return (
            <Sticker3D
              key={sticker.id}
              sticker={sticker}
              row={row}
              position={[x, y, 0]}
              seed={index * 1.7}
              laminateId={
                laminateBySticker[sticker.id] ?? DEFAULT_LAMINATE_ID
              }
              infoActive={infoOpenId === sticker.id}
              dimmed={infoOpenId !== null && infoOpenId !== sticker.id}
              onInfoChange={onInfoChange}
            />
          );
        })}
    </group>
  );
}

export default function StickerCanvas({
  infoOpenId,
  laminateBySticker,
  onSelect,
  onInfoChange,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: CAMERA_FOV }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <RackHoverProvider>
        <RackPointerBridge onSelect={onSelect} infoOpenId={infoOpenId} />
        <FitCamera />
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <group position={[0, RACK_Y_OFFSET, 0]}>
            <StickerRack
              infoOpenId={infoOpenId}
              laminateBySticker={laminateBySticker}
              onSelect={onSelect}
              onInfoChange={onInfoChange}
            />
          </group>
        </Suspense>
      </RackHoverProvider>
    </Canvas>
  );
}

function RackPointerBridge({
  onSelect,
  infoOpenId,
}: {
  onSelect: (sticker: Sticker) => void;
  infoOpenId: string | null;
}) {
  const rackHover = useRackHover();
  const { gl, camera } = useThree();
  const pointerNdc = useRef({ x: 0, y: 0 });
  const pointerInside = useRef(false);
  const slotsRef = useRef(buildProjectedSlots(camera));

  useFrame(() => {
    if (!rackHover) return;

    slotsRef.current = buildProjectedSlots(camera);

    if (!pointerInside.current) {
      rackHover.clearHover();
      gl.domElement.style.cursor = "auto";
      return;
    }

    const hit = resolvePointerHit(pointerNdc.current.x, pointerNdc.current.y, slotsRef.current);
    rackHover.applyPointerHit(hit);

    if (hit.zone === "sticker" || hit.zone === "label") {
      gl.domElement.style.cursor = "pointer";
    } else if (hit.zone === "placeholder") {
      gl.domElement.style.cursor = "default";
    } else {
      gl.domElement.style.cursor = "auto";
    }
  });

  useLayoutEffect(() => {
    if (!rackHover) return;
    const canvas = gl.domElement;

    const updatePointer = (event: PointerEvent) => {
      pointerInside.current = isInsideCanvas(event, canvas);
      if (!pointerInside.current) {
        rackHover.clearHover();
        return;
      }
      const ndc = pointerEventToNdc(event, canvas);
      pointerNdc.current = ndc;
    };

    const onDown = (event: PointerEvent) => {
      if (infoOpenId) return;
      if (!isInsideCanvas(event, canvas)) return;
      const ndc = pointerEventToNdc(event, canvas);
      const hit = resolvePointerHit(ndc.x, ndc.y, buildProjectedSlots(camera));

      if (hit.zone === "sticker" && hit.sticker && !hit.sticker.placeholder) {
        rackHover.triggerPunch(hit.sticker.id);
        onSelect(hit.sticker);
      }
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerleave", () => {
      pointerInside.current = false;
      rackHover.clearHover();
    });

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [rackHover, gl, camera, onSelect, infoOpenId]);

  return null;
}
