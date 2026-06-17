"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Sticker } from "@/data/stickers";

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
};

function StickerPopOutHero({ sticker }: HeroProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [artFrame, setArtFrame] = useState<ArtFrame | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const isActive = useMotionValue(0);

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
  const shineOpacity = useSpring(useTransform(isActive, [0, 1], [0, 0.42]), {
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

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
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
      }`}
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
            isActive.set(1);
            updatePointer(e.clientX, e.clientY);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (e.pointerType === "touch") resetTilt();
          }}
        >
          <div ref={surfaceRef} className="sticker-popout-hero-surface">
            <Image
              src={sticker.image}
              alt={sticker.name}
              fill
              sizes="(max-width: 640px) 88vw, 340px"
              className="sticker-popout-hero-img"
              priority
              draggable={false}
              onLoadingComplete={handleImageLoad}
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
                  className="sticker-popout-hero-shine"
                  aria-hidden="true"
                  style={{
                    opacity: shineOpacity,
                    backgroundPosition: shinePosition,
                    WebkitMaskImage: `url(${sticker.image})`,
                    maskImage: `url(${sticker.image})`,
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
  selectedCount: number;
  onClose: () => void;
  onAddToCart: () => void;
};

export default function StickerPopOut({ sticker, selectedCount, onClose, onAddToCart }: Props) {
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
          <StickerPopOutHero sticker={sticker} />

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
            <div className="sticker-info-footer">
              <span className="sticker-info-price">${sticker.price.toFixed(2)}</span>
              <button
                type="button"
                className="sticker-btn sticker-popout-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
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
