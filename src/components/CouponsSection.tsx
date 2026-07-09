"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/data/coupons";
import styles from "./CouponsSection.module.css";

type Props = {
  initialCoupons: Coupon[];
};

type Draft = {
  code: string;
  value: string;
  label: string;
  enabled: boolean;
};

const PERCENT_PRESETS = [20, 50, 100] as const;

function draftFromCoupon(coupon: Coupon): Draft {
  return {
    code: coupon.code,
    value: String(coupon.value),
    label: coupon.label,
    enabled: coupon.enabled !== false,
  };
}

function suggestCode(percent: number) {
  if (percent === 100) return "FREE100";
  if (percent === 50) return "HALF50";
  if (percent === 20) return "SAVE20";
  return `SAVE${percent}`;
}

function suggestLabel(percent: number) {
  return `${percent}% off`;
}

export default function CouponsSection({ initialCoupons }: Props) {
  const router = useRouter();

  const [coupons, setCoupons] = useState(initialCoupons);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(initialCoupons.map((coupon) => [coupon.code, draftFromCoupon(coupon)])),
  );
  const [newCode, setNewCode] = useState("SAVE20");
  const [newLabel, setNewLabel] = useState("20% off");
  const [newPercent, setNewPercent] = useState("20");
  const [codeTouched, setCodeTouched] = useState(false);
  const [labelTouched, setLabelTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCoupons(initialCoupons);
    setDrafts(
      Object.fromEntries(initialCoupons.map((coupon) => [coupon.code, draftFromCoupon(coupon)])),
    );
  }, [initialCoupons]);

  function setDraft(originalCode: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [originalCode]: { ...current[originalCode], ...patch },
    }));
  }

  function applyNewPercent(percent: number) {
    setNewPercent(String(percent));
    if (!codeTouched) setNewCode(suggestCode(percent));
    if (!labelTouched) setNewLabel(suggestLabel(percent));
  }

  function handleNewPercentChange(value: string) {
    setNewPercent(value);
    const percent = Number(value);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return;
    if (!codeTouched) setNewCode(suggestCode(percent));
    if (!labelTouched) setNewLabel(suggestLabel(percent));
  }

  function isDirty(originalCode: string, coupon: Coupon) {
    const draft = drafts[originalCode];
    if (!draft) return false;
    return (
      draft.code.trim().toUpperCase() !== coupon.code ||
      Number(draft.value) !== coupon.value ||
      draft.label.trim() !== coupon.label.trim()
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          label: newLabel,
          percent_off: Number(newPercent),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Create failed (${response.status}).`);
        return;
      }

      setSuccess("Added.");
      setNewCode("SAVE20");
      setNewLabel("20% off");
      setNewPercent("20");
      setCodeTouched(false);
      setLabelTouched(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(originalCode: string, coupon: Coupon) {
    const draft = drafts[originalCode];
    if (!draft || !isDirty(originalCode, coupon)) return;

    setSavingCode(originalCode);
    setError(null);
    setSuccess(null);

    const nextCode = draft.code.trim().toUpperCase();

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: originalCode,
          new_code: nextCode !== originalCode ? nextCode : undefined,
          label: draft.label,
          percent_off: Number(draft.value),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Save failed (${response.status}).`);
        return;
      }

      setSuccess("Saved.");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingCode(null);
    }
  }

  async function handleToggle(originalCode: string, enabled: boolean) {
    setDraft(originalCode, { enabled });
    setTogglingCode(originalCode);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: originalCode, enabled }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Update failed (${response.status}).`);
        const coupon = coupons.find((entry) => entry.code === originalCode);
        if (coupon) setDraft(originalCode, draftFromCoupon(coupon));
        return;
      }

      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
      const coupon = coupons.find((entry) => entry.code === originalCode);
      if (coupon) setDraft(originalCode, draftFromCoupon(coupon));
    } finally {
      setTogglingCode(null);
    }
  }

  async function handleDelete(code: string) {
    if (!window.confirm(`Delete ${code}?`)) return;

    setDeletingCode(code);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? `Delete failed (${response.status}).`);
        return;
      }

      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingCode(null);
    }
  }

  const currentPercent = Number(newPercent);

  return (
    <section className={styles.panel} aria-labelledby="coupons-title">
      <header className={styles.head}>
        <h2 id="coupons-title" className={styles.title}>
          Coupons
        </h2>
      </header>

      <div className={styles.body}>
        {error && <p className={`${styles.feedback} ${styles.feedbackError}`}>{error}</p>}
        {success && <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{success}</p>}

        <div className={`${styles.columns} ${styles.createColumns}`}>
          <span className={styles.colLabel}>Code</span>
          <span className={styles.colLabel}>%</span>
          <span className={styles.colLabel}>Message</span>
          <span className={styles.colLabel} aria-hidden="true" />
          <span className={styles.colLabel} aria-hidden="true" />
        </div>

        <form className={`${styles.row} ${styles.createRow}`} onSubmit={handleCreate}>
          <input
            className={styles.input}
            value={newCode}
            onChange={(event) => {
              setCodeTouched(true);
              setNewCode(event.target.value.toUpperCase());
            }}
            placeholder="SAVE20"
            disabled={creating}
            required
          />

          <div className={styles.presets}>
            {PERCENT_PRESETS.map((percent) => (
              <button
                key={percent}
                type="button"
                className={`${styles.preset}${currentPercent === percent ? ` ${styles.presetActive}` : ""}`}
                onClick={() => applyNewPercent(percent)}
                disabled={creating}
              >
                {percent}%
              </button>
            ))}
            <input
              className={styles.percent}
              type="number"
              min={1}
              max={100}
              value={newPercent}
              onChange={(event) => handleNewPercentChange(event.target.value)}
              disabled={creating}
              aria-label="Custom percent off"
            />
          </div>

          <input
            className={styles.input}
            value={newLabel}
            onChange={(event) => {
              setLabelTouched(true);
              setNewLabel(event.target.value);
            }}
            placeholder="20% off"
            disabled={creating}
            required
          />

          <button type="submit" className={styles.addBtn} disabled={creating}>
            {creating ? "…" : "Add"}
          </button>
        </form>

        {coupons.length > 0 && (
          <div className={`${styles.columns} ${styles.listColumns}`}>
            <span className={styles.colLabel}>Code</span>
            <span className={styles.colLabel}>%</span>
            <span className={styles.colLabel}>Message</span>
            <span className={styles.colLabel}>On</span>
            <span className={styles.colLabel} aria-hidden="true" />
          </div>
        )}

        {coupons.length === 0 ? (
          <p className={styles.empty}>No coupons.</p>
        ) : (
          <ul className={styles.list}>
            {coupons.map((coupon) => {
              const draft = drafts[coupon.code] ?? draftFromCoupon(coupon);
              const isBusy =
                savingCode === coupon.code ||
                togglingCode === coupon.code ||
                deletingCode === coupon.code;
              const dirty = isDirty(coupon.code, coupon);

              return (
                <li
                  key={coupon.code}
                  className={`${styles.row} ${styles.listRow}${!draft.enabled ? ` ${styles.rowOff}` : ""}`}
                >
                  <input
                    className={styles.input}
                    value={draft.code}
                    onChange={(event) =>
                      setDraft(coupon.code, { code: event.target.value.toUpperCase() })
                    }
                    disabled={isBusy}
                    aria-label={`Code for ${coupon.code}`}
                  />

                  <input
                    className={`${styles.input} ${styles.percentField}`}
                    type="number"
                    min={1}
                    max={100}
                    value={draft.value}
                    onChange={(event) => setDraft(coupon.code, { value: event.target.value })}
                    disabled={isBusy}
                    aria-label={`Percent for ${coupon.code}`}
                  />

                  <input
                    className={styles.input}
                    value={draft.label}
                    onChange={(event) => setDraft(coupon.code, { label: event.target.value })}
                    disabled={isBusy}
                    aria-label={`Message for ${coupon.code}`}
                  />

                  <label className={styles.on}>
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(event) => handleToggle(coupon.code, event.target.checked)}
                      disabled={isBusy}
                    />
                    <span>on</span>
                  </label>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={() => handleSave(coupon.code, coupon)}
                      disabled={isBusy || !dirty}
                    >
                      {savingCode === coupon.code ? "…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(coupon.code)}
                      disabled={isBusy}
                      aria-label={`Delete ${coupon.code}`}
                    >
                      {deletingCode === coupon.code ? "…" : "×"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
