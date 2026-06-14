export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
};

export const COUPONS: Record<string, Coupon> = {
  PEEL10: { code: "PEEL10", label: "10% off", type: "percent", value: 10 },
  DOG5: { code: "DOG5", label: "$5 off", type: "fixed", value: 5 },
  RANDOM: { code: "RANDOM", label: "15% off", type: "percent", value: 15 },
};

export function resolveCoupon(code: string): Coupon | null {
  return COUPONS[code.trim().toUpperCase()] ?? null;
}

export function applyCoupon(subtotal: number, coupon: Coupon | null) {
  if (!coupon || subtotal <= 0) {
    return { discount: 0, total: subtotal };
  }

  let discount =
    coupon.type === "percent" ? subtotal * (coupon.value / 100) : coupon.value;
  discount = Math.min(discount, subtotal);
  discount = Math.round(discount * 100) / 100;

  return {
    discount,
    total: Math.max(0, Math.round((subtotal - discount) * 100) / 100),
  };
}
