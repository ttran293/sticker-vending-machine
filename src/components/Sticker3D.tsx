"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Sticker } from "@/data/stickers";
import { createDieCutTexture } from "@/lib/stickerTexture";
import { BASE_SCALE, HOVER_SCALE, SLOT_LABEL_OFFSET, STICKER_HALF, STICKER_SIZE } from "@/lib/sticker3dConstants";

const HOVER_Z = 0.5;
const DIM_SCALE = 0.88;

type Props = {
  sticker: Sticker;
  position: [number, number, number];
  seed: number;
  selectedCount: number;
  infoActive: boolean;
  dimmed: boolean;
  onSelect: (sticker: Sticker) => void;
  onInfoChange: (sticker: Sticker | null) => void;
};

export default function Sticker3D({
  sticker,
  position,
  seed,
  selectedCount,
  infoActive,
  dimmed,
  onSelect,
  onInfoChange,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const punch = useRef(0);
  const hoverT = useRef(0);
  const { gl } = useThree();

  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

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
    if (sticker.placeholder) return;
    punch.current = 0.12;
    onSelect(sticker);
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime + seed;

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
          <Html
            center
            position={[0, 0, 0.04]}
            distanceFactor={htmlDistance}
            zIndexRange={[10, 0]}
            pointerEvents="none"
          >
            <span className="sticker-placeholder-label">coming soon</span>
          </Html>
        )}

        {material && (
          <mesh
            ref={meshRef}
            material={material}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              gl.domElement.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(false);
              gl.domElement.style.cursor = "auto";
            }}
            onClick={handleStickerClick}
          >
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
          </mesh>
        )}

        {!sticker.placeholder && selectedCount > 0 && (
          <Html
            center
            position={[STICKER_SIZE * 0.38, STICKER_SIZE * 0.38, 0.02]}
            distanceFactor={htmlDistance}
            zIndexRange={[20, 0]}
            pointerEvents="none"
          >
            <span className="cart-dot">{selectedCount}</span>
          </Html>
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

      <Html
        center
        position={[0, slotLabelY, 0.06]}
        distanceFactor={htmlDistance}
        zIndexRange={[40, 0]}
        occlude={false}
        pointerEvents={sticker.placeholder ? "none" : "auto"}
      >
        {sticker.placeholder ? (
          <span className="sticker-slot-label is-placeholder">[{sticker.slotCode}]</span>
        ) : (
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
        )}
      </Html>

    </group>
  );
}
