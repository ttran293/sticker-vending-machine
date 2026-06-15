"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Sticker } from "@/data/stickers";

type Props = {
  sticker: Sticker;
  selectedCount: number;
  onClose: () => void;
};

export default function StickerPopOut({ sticker, selectedCount, onClose }: Props) {
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
          <div
            className={`sticker-popout-hero sticker-popout-panel${
              sticker.transparent ? " sticker-popout-hero--transparent" : ""
            }`}
          >
            <Image
              src={sticker.image}
              alt={sticker.name}
              fill
              sizes="(max-width: 640px) 88vw, 340px"
              className="sticker-popout-hero-img"
              priority
            />
          </div>

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
              <span className="sticker-info-hint">tap sticker to add</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
