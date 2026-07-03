"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Sticker } from "@/data/stickers";
import {
  LAMINATES,
  LAMINATE_IDS,
  type LaminateId,
} from "@/data/laminates";
import { LaminateSwatch } from "./LaminateFinish";
import { useStickerImageWithFallback } from "@/components/StickerAssetProvider";

const MAX_TILT_Y = 22;
const MAX_TILT_X = 16;
const MAX_LIFT = 16;

type ArtFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function getContainFrame(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
): ArtFrame {
  const containerRatio = containerW / containerH;
  const imageRatio = imageW / imageH;

  if (imageRatio > containerRatio) {
    const width = containerW;
    const height = containerW / imageRatio;
    return { left: 0, top: (containerH - height) / 2, width, height };
  }

  const height = containerH;
  const width = containerH * imageRatio;
  return { left: (containerW - width) / 2, top: 0, width, height };
}

type HeroProps = {
  sticker: Sticker;
  laminateId: LaminateId;
};

function StickerPopOutHero({ sticker, laminateId }: HeroProps) {
  const { src: imageUrl, onError: onImageError } = useStickerImageWithFallback(sticker.image);
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [artFrame, setArtFrame] = useState<ArtFrame | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const isActive = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-MAX_TILT_Y, MAX_TILT_Y]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [MAX_TILT_X, -MAX_TILT_X]), {
    stiffness: 260,
    damping: 24,
  });
  const liftZ = useSpring(useTransform(isActive, [0, 1], [0, MAX_LIFT]), {
    stiffness: 280,
    damping: 26,
  });
  const overlayOpacity =
    laminateId === "laser-rainbow"
      ? [0.34, 0.72]
      : laminateId === "matte"
        ? [0.1, 0.2]
        : [0.05, 0.42];
  const shineOpacity = useSpring(useTransform(isActive, [0, 1], overlayOpacity), {
    stiffness: 300,
    damping: 30,
  });
  const shineX = useTransform(rotateY, (v) => `${50 + v * 1.4}%`);
  const shineY = useTransform(rotateX, (v) => `${50 - v * 1.2}%`);
  const shinePosition = useTransform([shineX, shineY], ([x, y]) => `${x} ${y}`);

  const measureArtFrame = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface || !naturalSize) return;
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    if (!width || !height) return;
    setArtFrame(getContainFrame(width, height, naturalSize.w, naturalSize.h));
  }, [naturalSize]);

  useEffect(() => {
    setNaturalSize(null);
    setArtFrame(null);
  }, [sticker.id, sticker.image]);

  useEffect(() => {
    measureArtFrame();
    const surface = surfaceRef.current;
    if (!surface) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measureArtFrame);
    });
    observer.observe(surface);
    return () => observer.disconnect();
  }, [measureArtFrame]);

  useEffect(() => {
    if (!naturalSize) return;
    requestAnimationFrame(measureArtFrame);
  }, [naturalSize, measureArtFrame]);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerX.set((clientX - rect.left) / rect.width - 0.5);
    pointerY.set((clientY - rect.top) / rect.height - 0.5);
  }, [pointerX, pointerY]);

  const resetTilt = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    isActive.set(0);
  }, [pointerX, pointerY, isActive]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    isActive.set(1);
    updatePointer(e.clientX, e.clientY);
  };

  const handlePointerLeave = () => {
    resetTilt();
  };

  return (
    <div
      className={`sticker-popout-hero sticker-popout-panel${
        sticker.transparent ? " sticker-popout-hero--transparent" : ""
      } sticker-popout-hero--${laminateId}`}
    >
      <motion.div
        key={sticker.id}
        className="sticker-popout-hero-entrance"
        initial={{ opacity: 0.7, scale: 0.78, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.12 }}
      >
        <motion.div
          ref={stageRef}
          className="sticker-popout-hero-stage"
          style={{ rotateX, rotateY, z: liftZ }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={(e) => {
            if (reducedMotion) return;
            isActive.set(1);
            updatePointer(e.clientX, e.clientY);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            if (e.pointerType === "touch") resetTilt();
          }}
        >
          <div
            ref={surfaceRef}
            className={`sticker-popout-hero-surface laminate-surface--${laminateId}`}
          >
            <Image
              src={imageUrl}
              alt={sticker.name}
              fill
              sizes="(max-width: 640px) 88vw, 340px"
              className="sticker-popout-hero-img"
              priority
              draggable={false}
              onLoad={handleImageLoad}
              onError={onImageError}
            />
            {artFrame && (
              <div
                className="sticker-popout-hero-shine-wrap"
                style={{
                  left: artFrame.left,
                  top: artFrame.top,
                  width: artFrame.width,
                  height: artFrame.height,
                }}
              >
                <motion.span
                  className={`sticker-popout-hero-shine sticker-popout-hero-shine--${laminateId}`}
                  aria-hidden="true"
                  style={{
                    opacity: shineOpacity,
                    backgroundPosition: shinePosition,
                    WebkitMaskImage: `url(${imageUrl})`,
                    maskImage: `url(${imageUrl})`,
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

type Props = {
  sticker: Sticker;
  laminateId: LaminateId;
  selectedCount: number;
  onClose: () => void;
  onLaminateChange: (laminateId: LaminateId) => void;
  onAddToCart: (laminateId: LaminateId) => void;
};

export default function StickerPopOut({
  sticker,
  laminateId,
  selectedCount,
  onClose,
  onLaminateChange,
  onAddToCart,
}: Props) {
  return (
    <motion.div
      className="sticker-popout-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="sticker-popout"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticker-popout-body">
          <StickerPopOutHero sticker={sticker} laminateId={laminateId} />

          <div className="sticker-info-card sticker-popout-panel">
            <div className="sticker-info-head">
              {selectedCount > 0 && (
                <span className="sticker-info-qty">in cart ×{selectedCount}</span>
              )}
              <button
                type="button"
                className="sticker-btn sticker-btn--icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <h3 className="sticker-info-name">{sticker.name}</h3>
            <p className="sticker-info-note">{sticker.note}</p>
            <p className="sticker-info-detail">{sticker.detail}</p>
            <fieldset className="laminate-picker">
              <legend>Laminate finish</legend>
              <div className="laminate-options">
                {LAMINATE_IDS.map((id) => {
                  const laminate = LAMINATES[id];
                  const selected = laminateId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`laminate-option${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => onLaminateChange(id)}
                    >
                      <LaminateSwatch laminateId={id} />
                      <span>{laminate.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
              <p className="laminate-description">
                {LAMINATES[laminateId].description}
              </p>
            </fieldset>
            <div className="sticker-info-footer">
              <span className="sticker-info-price">${sticker.price.toFixed(2)}</span>
              <button
                type="button"
                className="sticker-btn sticker-popout-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(laminateId);
                }}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
