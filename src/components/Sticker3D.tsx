"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Sticker } from "@/data/stickers";
import { createDieCutTexture } from "@/lib/stickerTexture";
import {
  BASE_SCALE,
  BOTTOM_ROW_POINTER_Y,
  HOVER_SCALE,
  SLOT_LABEL_HEIGHT,
  SLOT_LABEL_OFFSET,
  STICKER_HALF,
  STICKER_SIZE,
  STICKER_WIDTH,
} from "@/lib/sticker3dConstants";
import { useRackHover } from "./StickerRackHoverContext";

const HOVER_Z = 0.5;
const DIM_SCALE = 0.88;
const STALE_POINTER_DELTA = 0.1;

/** Full slot cell — sticker area + label below (blocks stray raycasts from row above). */
const PLACEHOLDER_CELL_W = STICKER_WIDTH * 1.06;
const PLACEHOLDER_CELL_H = STICKER_HALF + SLOT_LABEL_OFFSET + SLOT_LABEL_HEIGHT + 0.18;
const PLACEHOLDER_CELL_Y = -(SLOT_LABEL_OFFSET + SLOT_LABEL_HEIGHT) * 0.42;

function blockPointer(e: { stopPropagation: () => void; preventDefault?: () => void }) {
  e.stopPropagation();
  e.preventDefault?.();
}

type Props = {
  sticker: Sticker;
  position: [number, number, number];
  seed: number;
  infoActive: boolean;
  dimmed: boolean;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

export default function Sticker3D({
  sticker,
  position,
  seed,
  infoActive,
  dimmed,
  onSelect,
  onInfoChange,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const punch = useRef(0);
  const hoverT = useRef(0);
  const hoveredRef = useRef(false);
  const { gl, pointer } = useThree();
  const rackHover = useRackHover();

  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  const clearHover = useCallback(() => {
    hoveredRef.current = false;
    hoverT.current = 0;
    if (group.current) {
      const dimFactor = dimmed ? DIM_SCALE : 1;
      const infoBoost = infoActive ? 1.06 : 1;
      group.current.scale.setScalar(BASE_SCALE * infoBoost * dimFactor);
      group.current.position.x = 0;
      group.current.position.y = 0;
      group.current.position.z = infoActive ? 0.15 : 0;
      group.current.rotation.x = 0;
      group.current.rotation.y = 0;
    }
    gl.domElement.style.cursor = "auto";
  }, [gl, infoActive, dimmed]);

  useEffect(() => {
    if (!rackHover || sticker.placeholder) return;
    return rackHover.register(clearHover);
  }, [rackHover, clearHover, sticker.placeholder]);

  const handlePlaceholderPointer = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    rackHover?.clearAll();
    gl.domElement.style.cursor = "default";
  };

  useEffect(() => {
    if (sticker.placeholder) {
      setTexture(null);
      return;
    }

    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      sticker.image,
      (loaded) => {
        if (!active) {
          loaded.dispose();
          return;
        }
        const img = loaded.image as HTMLImageElement;
        if (img?.naturalWidth > 0) setTexture(createDieCutTexture(img));
        loaded.dispose();
      },
      undefined,
      () => {
        if (active) setTexture(null);
      },
    );
    return () => {
      active = false;
    };
  }, [sticker.image, sticker.placeholder]);

  const material = useMemo(() => {
    if (!texture) return null;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
  }, [texture]);

  /** Unit vector toward rack center — used to shift position on hover only. */
  const growInward = useMemo((): [number, number] => {
    const [gx, gy] = position;
    const len = Math.hypot(gx, gy);
    if (len < 0.001) return [0, 0];
    return [-gx / len, -gy / len];
  }, [position]);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sticker.placeholder) return;
    onInfoChange(infoActive ? null : sticker);
  };

  const handleStickerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (sticker.placeholder || rackHover?.isHoverLocked()) return;
    if (pointer.y < BOTTOM_ROW_POINTER_Y) return;
    if (Math.abs(e.pointer.y - pointer.y) > STALE_POINTER_DELTA) return;
    if (e.intersections[0]?.object !== e.object) return;
    punch.current = 0.12;
    onSelect(sticker);
  };

  useFrame((state, delta) => {
    if (!group.current || sticker.placeholder) return;
    const t = state.clock.elapsedTime + seed;
    const hovered = hoveredRef.current;

    hoverT.current = THREE.MathUtils.lerp(hoverT.current, hovered ? 1 : 0, delta * 10);

    const bob = Math.sin(t * 1.1) * 0.01 * (1 - hoverT.current * 0.8);
    const hoverGrow = hoverT.current * (HOVER_SCALE - 1);
    const inwardShift = STICKER_HALF * hoverGrow;
    group.current.position.x = growInward[0] * inwardShift;
    group.current.position.y = bob + growInward[1] * inwardShift;

    const dimFactor = dimmed ? DIM_SCALE : 1;
    const infoBoost = infoActive ? 1.06 : 1;
    const targetScale =
      BASE_SCALE * infoBoost * (1 + hoverT.current * (HOVER_SCALE - 1)) * dimFactor + punch.current;
    group.current.scale.setScalar(
      THREE.MathUtils.lerp(group.current.scale.x, targetScale, delta * 12),
    );

    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z,
      hoverT.current * HOVER_Z + (infoActive ? 0.15 : 0),
      delta * 10,
    );

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      Math.sin(t * 0.7) * 0.04 * (1 - hoverT.current * 0.7),
      delta * 8,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -hoverT.current * 0.03,
      delta * 8,
    );

    const mat = meshRef.current?.material;
    if (mat instanceof THREE.MeshBasicMaterial) {
      const targetOpacity = dimmed ? 0.55 : 1;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 10);
    }

    if (meshRef.current) {
      meshRef.current.renderOrder = hovered || infoActive ? 20 : 5;
    }

    punch.current = THREE.MathUtils.lerp(punch.current, 0, delta * 7);
  });

  const slotLabelY = -SLOT_LABEL_OFFSET;
  const htmlDistance = 11.8;

  return (
    <group position={position}>
      <group ref={group}>
        {!material && !sticker.placeholder && (
          <mesh scale={BASE_SCALE}>
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
            <meshBasicMaterial color="#DCCCAC" wireframe transparent opacity={0.5} />
          </mesh>
        )}

        {sticker.placeholder && (
          <>
            <mesh
              position={[0, PLACEHOLDER_CELL_Y, 0.18]}
              renderOrder={30}
              userData={{ slotCode: sticker.slotCode, kind: "placeholder-blocker" }}
              onPointerOver={handlePlaceholderPointer}
              onPointerOut={() => {
                gl.domElement.style.cursor = "auto";
              }}
              onPointerDown={blockPointer}
              onClick={blockPointer}
            >
              <planeGeometry args={[PLACEHOLDER_CELL_W, PLACEHOLDER_CELL_H]} />
              <meshBasicMaterial transparent opacity={0.001} depthWrite depthTest />
            </mesh>
            <Html
              center
              position={[0, PLACEHOLDER_CELL_Y, 0.1]}
              distanceFactor={htmlDistance}
              zIndexRange={[10, 0]}
              pointerEvents="none"
              as="div"
            >
              <div className="sticker-placeholder-hit">
                <div className="sticker-placeholder-shape" aria-hidden="true" />
                <span className="sticker-slot-tag is-placeholder">[{sticker.slotCode}]</span>
              </div>
            </Html>
          </>
        )}

        {material && (
          <mesh
            ref={meshRef}
            material={material}
            userData={{ slotCode: sticker.slotCode, kind: "sticker" }}
            onPointerOver={(e) => {
              e.stopPropagation();
              const stale = Math.abs(e.pointer.y - pointer.y) > STALE_POINTER_DELTA;
              if (rackHover?.isHoverLocked() || pointer.y < BOTTOM_ROW_POINTER_Y || stale) return;
              if (e.intersections[0]?.object !== e.object) return;
              rackHover?.clearAll();
              hoveredRef.current = true;
              gl.domElement.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              clearHover();
            }}
            onClick={handleStickerClick}
          >
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
          </mesh>
        )}

        {!sticker.placeholder && sticker.saleLabel && (
          <Html
            center
            position={[0, -STICKER_SIZE * 0.54, 0.03]}
            distanceFactor={htmlDistance}
            zIndexRange={[30, 0]}
            pointerEvents="none"
          >
            <span className="sticker-sale-label">{sticker.saleLabel}</span>
          </Html>
        )}
      </group>

      {!sticker.placeholder && (
        <Html
          center
          position={[0, slotLabelY, 0.06]}
          distanceFactor={htmlDistance}
          zIndexRange={[40, 0]}
          occlude={false}
          pointerEvents="auto"
        >
          <button
            type="button"
            className="sticker-slot-label"
            onClick={handleInfoClick}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Open details for ${sticker.name}`}
            title={sticker.name}
          >
            [{sticker.slotCode}]
          </button>
        </Html>
      )}
    </group>
  );
}
