"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { stickers, type Sticker } from "@/data/stickers";
import { applyCoupon, resolveCoupon, type Coupon } from "@/data/coupons";
import CheckoutModal, { type CartLine } from "./CheckoutModal";
import StickerPopOut from "./StickerPopOut";
import SidebarPanel from "./SidebarPanel";
import MusicPlayer from "./MusicPlayer";
import type { SitePanelId } from "@/data/sitePanels";
import { getRackViewportAspect } from "@/lib/sticker3dConstants";
import { getVisitorCount } from "@/lib/visitorCount";
import {
  DEFAULT_LAMINATE_ID,
  LAMINATES,
  LAMINATE_IDS,
  getVariantKey,
  getVariantPrice,
  type LaminateId,
} from "@/data/laminates";
import { LaminateOverlay, LaminateSwatch } from "./LaminateFinish";

// R3F relies on browser APIs (WebGL), so render it client-side only.
const StickerCanvas = dynamic(() => import("./StickerCanvas"), {
  ssr: false,
  loading: () => <div className="canvas-loading">loading rack&hellip;</div>,
});

type DispensedItem = {
  key: string;
  sticker: Sticker;
  laminateId: LaminateId;
};

export default function VendingMachine() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dispensedItems, setDispensedItems] = useState<DispensedItem[]>([]);
  const [lastPicked, setLastPicked] = useState<Sticker | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [infoSticker, setInfoSticker] = useState<Sticker | null>(null);
  const [sidebarPanel, setSidebarPanel] = useState<SitePanelId | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [selectedFinishes, setSelectedFinishes] = useState<
    Record<string, LaminateId>
  >({});
  const dispenseSeq = useRef(0);

  useEffect(() => {
    let active = true;

    getVisitorCount().then((count) => {
      if (active && count !== null) setVisitorCount(count);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!infoSticker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoSticker(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [infoSticker]);

  useEffect(() => {
    if (!sidebarPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarPanel]);

  const getSelectedFinish = (stickerId: string) =>
    selectedFinishes[stickerId] ?? DEFAULT_LAMINATE_ID;

  const selectFinish = (sticker: Sticker, laminateId: LaminateId) => {
    setSelectedFinishes((current) => ({
      ...current,
      [sticker.id]: laminateId,
    }));
  };

  const add = (
    sticker: Sticker,
    laminateId: LaminateId = getSelectedFinish(sticker.id),
  ) => {
    if (sticker.placeholder) return;
    const variantKey = getVariantKey(sticker.id, laminateId);
    const dispensedItem = {
      key: `${variantKey}-${dispenseSeq.current++}`,
      sticker,
      laminateId,
    };
    setDispensedItems((items) => [dispensedItem, ...items]);
    setCounts((c) => ({ ...c, [variantKey]: (c[variantKey] ?? 0) + 1 }));
    selectFinish(sticker, laminateId);
    setLastPicked(sticker);
  };

  const decrement = (line: CartLine) => {
    setDispensedItems((items) => {
      const next = items.slice();
      for (let i = 0; i < next.length; i += 1) {
        if (
          next[i].sticker.id === line.sticker.id &&
          next[i].laminateId === line.laminateId
        ) {
          next.splice(i, 1);
          break;
        }
      }
      return next;
    });
    setCounts((c) => {
      const next = { ...c };
      const v = (next[line.key] ?? 0) - 1;
      if (v <= 0) delete next[line.key];
      else next[line.key] = v;
      return next;
    });
  };

  const removeLine = (line: CartLine) => {
    setDispensedItems((items) =>
      items.filter(
        (item) =>
          item.sticker.id !== line.sticker.id ||
          item.laminateId !== line.laminateId,
      ),
    );
    setCounts((c) => {
      const next = { ...c };
      delete next[line.key];
      return next;
    });
    setLastPicked((prev) => (prev?.id === line.sticker.id ? null : prev));
  };

  const lines: CartLine[] = useMemo(
    () =>
      stickers
        .filter((sticker) => !sticker.placeholder)
        .flatMap((sticker) =>
          LAMINATE_IDS.flatMap((laminateId) => {
            const key = getVariantKey(sticker.id, laminateId);
            const count = counts[key] ?? 0;
            return count > 0
              ? [{ key, sticker, laminateId, count }]
              : [];
          }),
        ),
    [counts],
  );

  const totalItems = lines.reduce((n, l) => n + l.count, 0);
  const totalPrice = lines.reduce(
    (sum, line) =>
      sum +
      getVariantPrice(line.sticker.price, line.laminateId) * line.count,
    0,
  );
  const { discount, total: checkoutTotal } = useMemo(
    () => applyCoupon(totalPrice, appliedCoupon),
    [totalPrice, appliedCoupon],
  );

  useEffect(() => {
    if (totalItems === 0) {
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError(null);
    }
  }, [totalItems]);

  const handleApplyCoupon = () => {
    const coupon = resolveCoupon(couponInput);
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponError("invalid code");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponError(null);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const closeModal = () => {
    setCheckoutOpen(false);
    if (confirmed) {
      setCounts({});
      setDispensedItems([]);
      dispenseSeq.current = 0;
      setLastPicked(null);
      setConfirmed(false);
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError(null);
    }
  };

  return (
    <div className="machine-stage">
      <div className="machine">
        <div className="machine-frame" aria-hidden />

        <div className="machine-header">
          <div className="marquee" aria-hidden>
            <div className="marquee-track">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i}>
                  ✶ HANDMADE STICKERS ✶ CASH OR VENMO ✶ ✶ HANDMADE STICKERS ✶
                  CASH OR VENMO ✶ ✶ HANDMADE STICKERS ✶ CASH OR VENMO ✶ ✶
                  HANDMADE STICKERS ✶ CASH OR VENMO ✶&nbsp;
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="machine-body">
          {/* Glass display cabinet with the 3D rack */}
          <div className="glass-cabinet">
            <div className="glass-interior">
              <div
                className={`glass-viewport${infoSticker ? " is-info-open" : ""}`}
              >
                <div
                  className="glass-viewport-canvas"
                  style={{ aspectRatio: getRackViewportAspect() }}
                >
                  <StickerCanvas
                    infoOpenId={infoSticker?.id ?? null}
                    laminateBySticker={selectedFinishes}
                    onSelect={add}
                    onInfoChange={setInfoSticker}
                  />
                </div>
              </div>
            </div>

            {/* Dispenser tray */}
            <div className="dispenser">
              <div className="dispenser-flap">
                <AnimatePresence mode="popLayout" initial={false}>
                  {dispensedItems.map((item, index) => (
                    <motion.div
                      key={item.key}
                      className="dispensed-sticker"
                      layout
                      initial={{ y: -72, opacity: 0, rotate: -16, scale: 0.35 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        rotate: (index % 5) * 3 - 6,
                        scale: 1,
                      }}
                      exit={{ y: 18, opacity: 0, scale: 0.4, rotate: 12 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <span className="dispensed-sticker-art">
                        <Image
                          src={item.sticker.image}
                          alt={item.sticker.name}
                          width={48}
                          height={48}
                        />
                        <LaminateOverlay
                          laminateId={item.laminateId}
                          image={item.sticker.image}
                        />
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <span className="dispenser-label">
                &gt;&gt; PUSH / COLLECT HERE &lt;&lt;
              </span>
            </div>
          </div>

          {/* Control panel */}
          <div className="control-panel">
            <div className="control-info-card">
              <p className="neo-counter">
                you are visitor #{" "}
                <span className="neo-counter-num">
                  {visitorCount === null ? "---" : String(visitorCount).padStart(3, "0")}
                </span>
              </p>
              <MusicPlayer />
            </div>

            <div className="digital-display">
              <span className="display-label">SELECTED</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={lastPicked?.id ?? "none"}
                  className="display-code"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                >
                  {lastPicked ? lastPicked.slotCode : "--"}
                </motion.span>
              </AnimatePresence>
              <span className="display-name">
                {lastPicked ? lastPicked.name : "pick a sticker"}
              </span>
            </div>

            <div className="cart">
              <div className="cart-head">
                <span>YOUR CART</span>
              </div>

              <ul className="cart-list">
                <AnimatePresence initial={false}>
                  {lines.length === 0 && (
                    <motion.li
                      key="empty"
                      className="cart-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      empty &mdash; tap a sticker to add!
                    </motion.li>
                  )}
                  {lines.map((line) => (
                    <motion.li
                      key={line.key}
                      className="cart-item"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    >
                      <span className="cart-item-thumb">
                        <Image
                          src={line.sticker.image}
                          alt={line.sticker.name}
                          width={40}
                          height={40}
                        />
                        <LaminateOverlay
                          laminateId={line.laminateId}
                          image={line.sticker.image}
                        />
                      </span>
                      <span className="cart-item-info">
                        <strong>{line.sticker.name}</strong>
                        <small>
                          <span className="cart-item-finish">
                            <LaminateSwatch laminateId={line.laminateId} />
                            {LAMINATES[line.laminateId].label}
                          </span>
                          <span className="cart-item-unit-price">
                            $
                            {getVariantPrice(
                              line.sticker.price,
                              line.laminateId,
                            ).toFixed(2)}{" "}
                            ea.
                          </span>
                        </small>
                      </span>
                      <span className="qty-controls">
                        <button
                          onClick={() => decrement(line)}
                          aria-label="remove one"
                        >
                          &minus;
                        </button>
                        <span>{line.count}</span>
                        <button
                          onClick={() => add(line.sticker, line.laminateId)}
                          aria-label="add one"
                        >
                          +
                        </button>
                      </span>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => removeLine(line)}
                        aria-label={`Remove all ${line.sticker.name} in ${LAMINATES[line.laminateId].label} from cart`}
                        title="Remove row"
                      >
                        &times;
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <div className="cart-footer">
                <div className="coupon-field">
                  <label className="coupon-label" htmlFor="cart-coupon">
                    COUPON
                  </label>
                  <div className="coupon-row">
                    <input
                      id="cart-coupon"
                      type="text"
                      className="coupon-input"
                      placeholder="ENTER CODE"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyCoupon();
                      }}
                    />
                    <button
                      type="button"
                      className="coupon-apply"
                      onClick={handleApplyCoupon}
                    >
                      APPLY
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="coupon-applied">
                      <span>
                        {appliedCoupon.code} · {appliedCoupon.label}
                      </span>
                      <button
                        type="button"
                        className="coupon-remove"
                        onClick={handleRemoveCoupon}
                      >
                        remove
                      </button>
                    </div>
                  )}
                  {couponError && <p className="coupon-error">{couponError}</p>}
                </div>

                {appliedCoupon && discount > 0 && (
                  <>
                    <div className="cart-total cart-total--sub">
                      <span>SUBTOTAL</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="cart-total cart-total--discount">
                      <span>DISCOUNT</span>
                      <span>&minus;${discount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="cart-total">
                  <span>TOTAL</span>
                  <motion.span
                    key={checkoutTotal}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                  >
                    ${checkoutTotal.toFixed(2)}
                  </motion.span>
                </div>
                <motion.button
                  className="checkout-btn"
                  disabled={totalItems === 0}
                  whileHover={totalItems > 0 ? { scale: 1.02 } : undefined}
                  whileTap={totalItems > 0 ? { scale: 0.98 } : undefined}
                  onClick={() => {
                    setConfirmed(false);
                    setCheckoutOpen(true);
                  }}
                >
                  CHECKOUT &rarr;
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <footer className="machine-footer">
          <span className="machine-footer-content">
            made by{" "}
            <a
              href="https://thanhnam.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Nam
            </a>
            <button
              type="button"
              className="footer-link"
              onClick={() => setSidebarPanel("about")}
            >
              About
            </button>
            <button
              type="button"
              className="footer-link"
              onClick={() => setSidebarPanel("faq")}
            >
              FAQ
            </button>
          </span>
        </footer>
      </div>

      <AnimatePresence>
        {infoSticker && (
          <>
            <motion.button
              type="button"
              key="info-backdrop"
              className="info-backdrop"
              aria-label="Close info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setInfoSticker(null)}
            />
            <StickerPopOut
              key={infoSticker.id}
              sticker={infoSticker}
              laminateId={getSelectedFinish(infoSticker.id)}
              selectedCount={
                counts[
                  getVariantKey(
                    infoSticker.id,
                    getSelectedFinish(infoSticker.id),
                  )
                ] ?? 0
              }
              onLaminateChange={(laminateId) =>
                selectFinish(infoSticker, laminateId)
              }
              onClose={() => setInfoSticker(null)}
              onAddToCart={(laminateId) => add(infoSticker, laminateId)}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarPanel && (
          <SidebarPanel
            key={sidebarPanel}
            panel={sidebarPanel}
            onClose={() => setSidebarPanel(null)}
          />
        )}
      </AnimatePresence>

      <CheckoutModal
        open={checkoutOpen}
        lines={lines}
        subtotal={totalPrice}
        discount={discount}
        total={checkoutTotal}
        appliedCoupon={appliedCoupon}
        confirmed={confirmed}
        onClose={closeModal}
        onConfirm={() => setConfirmed(true)}
      />
    </div>
  );
}
