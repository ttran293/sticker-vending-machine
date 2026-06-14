"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Sticker } from "@/data/stickers";
import { createDieCutTexture } from "@/lib/stickerTexture";
import { BASE_SCALE, STICKER_SIZE } from "@/lib/sticker3dConstants";

const HOVER_SCALE = 1.18;
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
  }, [sticker.image]);

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

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfoChange(infoActive ? null : sticker);
  };

  const handleStickerClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    punch.current = 0.12;
    onSelect(sticker);
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime + seed;

    hoverT.current = THREE.MathUtils.lerp(hoverT.current, hovered ? 1 : 0, delta * 10);

    const bob = Math.sin(t * 1.1) * 0.01 * (1 - hoverT.current * 0.8);
    group.current.position.y = position[1] + bob;

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

  const infoCorner: [number, number, number] = [
    STICKER_SIZE * 0.5,
    -STICKER_SIZE * 0.5,
    0.06,
  ];

  return (
    <group ref={group} position={position}>
      {!material && (
        <mesh scale={BASE_SCALE}>
          <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
          <meshBasicMaterial color="#cccccc" wireframe transparent opacity={0.35} />
        </mesh>
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

      {selectedCount > 0 && (
        <Html
          center
          position={[STICKER_SIZE * 0.38, STICKER_SIZE * 0.38, 0.02]}
          distanceFactor={13}
          zIndexRange={[20, 0]}
          pointerEvents="none"
        >
          <span className="cart-dot">{selectedCount}</span>
        </Html>
      )}

      {sticker.saleLabel && (
        <Html
          center
          position={[0, -STICKER_SIZE * 0.54, 0.03]}
          distanceFactor={13}
          zIndexRange={[30, 0]}
          pointerEvents="none"
        >
          <span className="sticker-sale-label">{sticker.saleLabel}</span>
        </Html>
      )}

      <Html
        position={infoCorner}
        distanceFactor={13}
        zIndexRange={[40, 0]}
        occlude={false}
        style={{
          transform: "translate(calc(-100% + 3px), calc(-100% + 3px))",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          className={`sticker-btn sticker-btn--info${infoActive ? " is-active" : ""}`}
          style={{ pointerEvents: "auto" }}
          onClick={handleInfoClick}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={infoActive ? "Close info" : `Info for ${sticker.name}`}
          title={infoActive ? "Close" : "Info"}
        >
          {infoActive ? "×" : "i"}
        </button>
      </Html>
    </group>
  );
}
