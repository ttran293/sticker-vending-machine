import type { Coupon } from "@/data/coupons";
import {
  getSupabaseAnonConfig,
  getSupabaseServiceConfig,
  supabaseHeaders,
  supabaseRest,
} from "@/lib/supabase/rest";

export const DEFAULT_COUPONS: Coupon[] = [
  { code: "FREE100", label: "100% off", type: "percent", value: 100, enabled: true },
  { code: "HALF50", label: "50% off", type: "percent", value: 50, enabled: true },
  { code: "SAVE20", label: "20% off", type: "percent", value: 20, enabled: true },
];

type CouponRow = {
  code: string;
  label: string;
  percent_off: number;
  enabled: boolean;
  updated_at?: string;
};

function rowToCoupon(row: CouponRow): Coupon {
  return {
    code: row.code.trim().toUpperCase(),
    label: row.label.trim(),
    type: "percent",
    value: Number(row.percent_off),
    enabled: row.enabled,
  };
}

function couponToRow(coupon: Coupon): CouponRow {
  return {
    code: coupon.code.trim().toUpperCase(),
    label: coupon.label.trim(),
    percent_off: coupon.value,
    enabled: coupon.enabled !== false,
  };
}

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

export function isValidCouponCode(value: string) {
  const code = normalizeCouponCode(value);
  return code.length >= 2 && code.length <= 24;
}

export function isValidPercentOff(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 100;
}

export function buildCouponLookup(coupons: Coupon[]): Record<string, Coupon> {
  const lookup: Record<string, Coupon> = {};
  for (const coupon of coupons) {
    if (coupon.enabled === false) continue;
    const code = normalizeCouponCode(coupon.code);
    if (!code) continue;
    lookup[code] = { ...coupon, code };
  }
  return lookup;
}

export function resolveCoupon(code: string, lookup: Record<string, Coupon>): Coupon | null {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  return lookup[normalized] ?? null;
}

async function readCouponRowsFromSupabase(): Promise<CouponRow[] | null> {
  const config = getSupabaseAnonConfig();
  if (!config) return null;

  try {
    return await supabaseRest<CouponRow[]>(
      config,
      "coupons?select=code,label,percent_off,enabled&order=code.asc",
      { headers: supabaseHeaders(config.apiKey), cache: "no-store" },
    );
  } catch {
    return null;
  }
}

async function readAllCouponRowsFromSupabase(): Promise<CouponRow[] | null> {
  const config = getSupabaseServiceConfig();
  if (!config) return null;

  try {
    return await supabaseRest<CouponRow[]>(
      config,
      "coupons?select=code,label,percent_off,enabled&order=code.asc",
      { headers: supabaseHeaders(config.apiKey), cache: "no-store" },
    );
  } catch {
    return null;
  }
}

/** Active coupons for checkout (enabled only). */
export async function getCoupons(): Promise<Coupon[]> {
  const rows = await readCouponRowsFromSupabase();
  if (!rows?.length) return DEFAULT_COUPONS.filter((coupon) => coupon.enabled !== false);
  return rows.filter((row) => row.enabled).map(rowToCoupon);
}

/** All coupons for admin dashboard. */
export async function getAdminCoupons(): Promise<Coupon[]> {
  const rows = await readAllCouponRowsFromSupabase();
  if (!rows?.length) return [...DEFAULT_COUPONS];
  return rows.map(rowToCoupon);
}

export async function createCoupon(coupon: Coupon) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const row = couponToRow(coupon);

  await supabaseRest(
    config,
    "coupons",
    {
      method: "POST",
      headers: supabaseHeaders(config.apiKey, { Prefer: "return=minimal" }),
      body: JSON.stringify(row),
    },
  );
}

export type CouponUpdates = {
  new_code?: string;
  label?: string;
  value?: number;
  enabled?: boolean;
};

export async function updateCoupon(code: string, updates: CouponUpdates) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const normalized = normalizeCouponCode(code);
  const body: Partial<CouponRow> & { code?: string } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.new_code === "string") {
    const nextCode = normalizeCouponCode(updates.new_code);
    if (!isValidCouponCode(nextCode)) {
      throw new Error("Code must be 2–24 letters, numbers, dashes, or underscores.");
    }
    if (nextCode !== normalized) body.code = nextCode;
  }

  if (typeof updates.label === "string") body.label = updates.label.trim();
  if (typeof updates.value === "number") body.percent_off = updates.value;
  if (typeof updates.enabled === "boolean") body.enabled = updates.enabled;

  await supabaseRest(
    config,
    `coupons?code=eq.${encodeURIComponent(normalized)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders(config.apiKey, { Prefer: "return=minimal" }),
      body: JSON.stringify(body),
    },
  );
}

export async function deleteCoupon(code: string) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const normalized = normalizeCouponCode(code);

  await supabaseRest(
    config,
    `coupons?code=eq.${encodeURIComponent(normalized)}`,
    {
      method: "DELETE",
      headers: supabaseHeaders(config.apiKey),
    },
  );
}
