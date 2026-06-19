"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Sticker } from "@/data/stickers";
import { createDieCutTexture } from "@/lib/stickerTexture";
import {
  BASE_SCALE,
  HOVER_SCALE,
  PLACEHOLDER_CELL_H,
  PLACEHOLDER_CELL_W,
  PLACEHOLDER_CELL_Y,
  SLOT_LABEL_OFFSET,
  STICKER_HALF,
  STICKER_SIZE,
} from "@/lib/sticker3dConstants";
import { useRackHover } from "./StickerRackHoverContext";
import type { LaminateId } from "@/data/laminates";

const HOVER_Z = 0.5;
const DIM_SCALE = 0.88;

/** Meshes are visual only — pointer/hover is in rackPointer.ts */
const noopRaycast = () => null;

type Props = {
  sticker: Sticker;
  row: number;
  position: [number, number, number];
  seed: number;
  laminateId: LaminateId;
  infoActive: boolean;
  dimmed: boolean;
  onInfoChange: (sticker: Sticker | null) => void;
};

export default function Sticker3D({
  sticker,
  row,
  position,
  seed,
  laminateId,
  infoActive,
  dimmed,
  onInfoChange,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const finishMeshRef = useRef<THREE.Mesh>(null);
  const punch = useRef(0);
  const hoverT = useRef(0);
  const rackHover = useRackHover();

  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(query.matches);
    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, []);

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
      color: laminateId === "matte" ? "#e8e2d6" : "#ffffff",
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
  }, [laminateId, texture]);

  const finishMaterial = useMemo(() => {
    if (!texture || laminateId === "matte") return null;

    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        time: { value: 0 },
        mode: { value: laminateId === "laser-rainbow" ? 1 : 0 },
        finishOpacity: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float time;
        uniform float mode;
        uniform float finishOpacity;
        varying vec2 vUv;

        void main() {
          float artAlpha = texture2D(map, vUv).a;
          if (artAlpha < 0.02) discard;

          float diagonal = vUv.x + vUv.y;
          if (mode < 0.5) {
            float band = 1.0 - smoothstep(0.0, 0.18, abs(fract(diagonal + time * 0.055) - 0.5));
            gl_FragColor = vec4(vec3(1.0), band * 0.12 * artAlpha * finishOpacity);
          } else {
            float phase = diagonal * 5.4 + time * 0.35;
            vec3 rainbow = 0.58 + 0.42 * cos(phase + vec3(0.0, 2.094, 4.188));
            float sheen = 0.34 + 0.18 * sin((vUv.x - vUv.y) * 9.0 - time * 0.28);
            gl_FragColor = vec4(rainbow, sheen * artAlpha * finishOpacity);
          }
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
  }, [laminateId, texture]);

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

  useFrame((state, delta) => {
    if (!group.current || sticker.placeholder) return;

    // Browsers throttle inactive tabs. Clamp the first frame after returning so
    // lerp factors cannot overshoot and fling the stickers around.
    const frameDelta = Math.min(delta, 1 / 30);
    const hovered = rackHover?.getHoveredId() === sticker.id;
    if (rackHover?.consumePunch(sticker.id)) {
      punch.current = 0.12;
    }

    hoverT.current = THREE.MathUtils.lerp(
      hoverT.current,
      hovered ? 1 : 0,
      frameDelta * 10,
    );

    const t = state.clock.elapsedTime + seed;
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
      THREE.MathUtils.lerp(group.current.scale.x, targetScale, frameDelta * 12),
    );

    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z,
      hoverT.current * HOVER_Z + (infoActive ? 0.15 : 0),
      frameDelta * 10,
    );

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      Math.sin(t * 0.7) * 0.04 * (1 - hoverT.current * 0.7),
      frameDelta * 8,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -hoverT.current * 0.03,
      frameDelta * 8,
    );

    const mat = meshRef.current?.material;
    if (mat instanceof THREE.MeshBasicMaterial) {
      const finishOpacity = laminateId === "matte" ? 0.9 : 1;
      const targetOpacity = (dimmed ? 0.55 : 1) * finishOpacity;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, frameDelta * 10);
    }

    const finishMat = finishMeshRef.current?.material;
    if (finishMat instanceof THREE.ShaderMaterial) {
      finishMat.uniforms.time.value = reducedMotion ? seed : t;
      finishMat.uniforms.finishOpacity.value = dimmed ? 0.35 : 1;
    }

    if (meshRef.current) {
      meshRef.current.renderOrder = hovered || infoActive ? 20 : 5;
    }

    punch.current = THREE.MathUtils.lerp(punch.current, 0, frameDelta * 7);
  });

  const slotLabelY = -SLOT_LABEL_OFFSET;
  const htmlDistance = 11.8;
  const rowZ = (3 - row) * 0.012;

  return (
    <group position={[position[0], position[1], rowZ]}>
      <group ref={group}>
        {!material && !sticker.placeholder && (
          <mesh scale={BASE_SCALE} raycast={noopRaycast}>
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
            <meshBasicMaterial color="#DCCCAC" wireframe transparent opacity={0.5} />
          </mesh>
        )}

        {sticker.placeholder && (
          <>
            <mesh
              position={[0, PLACEHOLDER_CELL_Y, 0.18]}
              renderOrder={30}
              raycast={noopRaycast}
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
          <mesh ref={meshRef} material={material} raycast={noopRaycast}>
            <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
          </mesh>
        )}

        {finishMaterial && (
          <mesh
            ref={finishMeshRef}
            material={finishMaterial}
            position={[0, 0, 0.012]}
            renderOrder={10}
            raycast={noopRaycast}
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
