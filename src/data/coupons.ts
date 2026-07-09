export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  enabled?: boolean;
};

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
