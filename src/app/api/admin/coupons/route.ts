import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { Coupon } from "@/data/coupons";
import { requireAdmin } from "@/lib/auth";
import {
  createCoupon,
  deleteCoupon,
  getAdminCoupons,
  isValidCouponCode,
  isValidPercentOff,
  normalizeCouponCode,
  updateCoupon,
  type CouponUpdates,
} from "@/lib/couponStore";

function parseCouponBody(body: unknown): { ok: true; coupon: Coupon } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request." };
  }

  const record = body as Record<string, unknown>;
  const code = typeof record.code === "string" ? normalizeCouponCode(record.code) : "";
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const value = typeof record.percent_off === "number"
    ? record.percent_off
    : typeof record.value === "number"
      ? record.value
      : NaN;
  const enabled = record.enabled !== false;

  if (!isValidCouponCode(code)) {
    return { ok: false, error: "Code must be 2–24 letters, numbers, dashes, or underscores." };
  }

  if (!label) {
    return { ok: false, error: "Display text is required." };
  }

  if (!isValidPercentOff(value)) {
    return { ok: false, error: "Percent off must be between 1 and 100." };
  }

  return {
    ok: true,
    coupon: {
      code,
      label,
      type: "percent",
      value,
      enabled,
    },
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ coupons: await getAdminCoupons() });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseCouponBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await createCoupon(parsed.coupon);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, coupon: parsed.coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon.";
    const status = message.includes("duplicate") || message.includes("23505") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = (body as { code?: unknown }).code;
  if (typeof code !== "string" || !isValidCouponCode(code)) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const updates: CouponUpdates = {};

  if (typeof record.new_code === "string") {
    const newCode = normalizeCouponCode(record.new_code);
    if (!isValidCouponCode(newCode)) {
      return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
    }
    updates.new_code = newCode;
  }

  if (typeof record.label === "string") {
    const label = record.label.trim();
    if (!label) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    updates.label = label;
  }

  const percent =
    typeof record.percent_off === "number"
      ? record.percent_off
      : typeof record.value === "number"
        ? record.value
        : undefined;

  if (percent !== undefined) {
    if (!isValidPercentOff(percent)) {
      return NextResponse.json({ error: "Percent off must be between 1 and 100." }, { status: 400 });
    }
    updates.value = percent;
  }

  if (typeof record.enabled === "boolean") {
    updates.enabled = record.enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    await updateCoupon(code, updates);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = (body as { code?: unknown }).code;
  if (typeof code !== "string" || !isValidCouponCode(code)) {
    return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
  }

  try {
    await deleteCoupon(code);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
