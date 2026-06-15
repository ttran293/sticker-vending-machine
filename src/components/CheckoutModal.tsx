"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Coupon } from "@/data/coupons";
import type { Sticker } from "@/data/stickers";

export type CartLine = { sticker: Sticker; count: number };

const ORDER_EMAIL = "thanhnamtran997@gmail.com";
const PAYMENT_METHODS = ["Cash", "Venmo"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

type Props = {
  open: boolean;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  onClose: () => void;
  onConfirm: () => void;
  confirmed: boolean;
};

export default function CheckoutModal({
  open,
  lines,
  subtotal,
  discount,
  total,
  appliedCoupon,
  onClose,
  onConfirm,
  confirmed,
}: Props) {
  const [paymentOptionsOpen, setPaymentOptionsOpen] = useState(false);
  const itemCount = lines.reduce((n, l) => n + l.count, 0);

  useEffect(() => {
    if (!open || confirmed) setPaymentOptionsOpen(false);
  }, [open, confirmed]);

  const handlePaymentSelect = (method: PaymentMethod) => {
    const orderLines = lines
      .map(
        (line) =>
          `- ${line.sticker.name} x${line.count} · $${line.sticker.price.toFixed(2)} each = $${(
            line.sticker.price * line.count
          ).toFixed(2)}`,
      )
      .join("\n");

    const body = [
      "Hi Nam,",
      "",
      "I would like to place a sticker order.",
      "",
      "Stickers:",
      orderLines,
      "",
      "Payment:",
      `- Method: ${method}`,
      `- Total: $${total.toFixed(2)}`,
      "",
      "Customer info:",
      "- Name:",
      "- Pickup / delivery:",
      method === "Venmo" ? "- Venmo username:" : "- Cash payment note:",
      "",
      "Thanks!",
    ].join("\n");

    window.location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
      "Sticker Order",
    )}&body=${encodeURIComponent(body)}`;
    onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-card"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {confirmed ? (
              <div className="confirm-wrap">
                <motion.pre
                  className="confirm-ascii"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                >{`*  *  *
\\ |  | /
 ORDER!
/ |  | \\
*  *  *`}</motion.pre>
                <h2>ORDER DISPENSED</h2>
                <p>
                  {itemCount} sticker{itemCount === 1 ? "" : "s"} are sliding down the chute. Peel
                  responsibly.
                </p>
                <button className="btn-primary" onClick={onClose}>
                  GRAB ANOTHER
                </button>
              </div>
            ) : (
              <>
                <h2 className="modal-title">{"// YOUR ORDER"}</h2>
                <ul className="checkout-list">
                  {lines.map((line) => (
                    <li key={line.sticker.id}>
                      <span className="checkout-thumb">
                        <Image src={line.sticker.image} alt={line.sticker.name} width={44} height={44} />
                      </span>
                      <span className="checkout-name">
                        {line.sticker.name}
                        <small>
                          {line.sticker.note} · ${line.sticker.price.toFixed(2)}
                        </small>
                      </span>
                      <span className="checkout-qty">x{line.count}</span>
                      <span className="checkout-line-total">
                        ${(line.sticker.price * line.count).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                {appliedCoupon && discount > 0 && (
                  <>
                    <div className="checkout-total-row checkout-total-row--sub">
                      <span>SUBTOTAL</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="checkout-total-row checkout-total-row--discount">
                      <span>
                        COUPON · {appliedCoupon.code}
                      </span>
                      <span>&minus;${discount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="checkout-total-row">
                  <span>TOTAL</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <AnimatePresence initial={false}>
                  {paymentOptionsOpen && (
                    <motion.div
                      className="payment-options"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.16 }}
                    >
                      <span className="payment-options-label">PAYMENT METHOD</span>
                      <div className="payment-methods">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            className="btn-ghost payment-method"
                            onClick={() => handlePaymentSelect(method)}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={onClose}>
                    KEEP SHOPPING
                  </button>
                  <button className="btn-primary" onClick={() => setPaymentOptionsOpen(true)}>
                    PAY ${total.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
