"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { GRID_COLS, type CatalogEntry } from "@/data/stickers";
import {
  getMachineSlotByImageFromLayout,
  getSlotCode,
  SLOT_COUNT,
  type MachineLayout,
} from "@/lib/machineLayoutShared";

type AssignTarget = {
  entry: CatalogEntry;
  currentSlotCode: string | null;
};

function StickerCatalogCard({
  entry,
  slotCode,
  onAssign,
  priorityLoad = false,
}: {
  entry: CatalogEntry;
  slotCode: string | null;
  onAssign: () => void;
  priorityLoad?: boolean;
}) {
  const inMachine = slotCode !== null;

  return (
    <article className="catalog-card">
      <div
        className={`catalog-card-art${entry.transparent ? " catalog-card-art--transparent" : ""}`}
      >
        <Image
          src={entry.image}
          alt={entry.name}
          fill
          sizes="(max-width: 640px) 42vw, 180px"
          className="catalog-card-img"
          priority={priorityLoad}
          loading={priorityLoad ? "eager" : "lazy"}
        />
      </div>
      <div className="catalog-card-body">
        <div className="catalog-card-head">
          <h3 className="catalog-card-name">{entry.name}</h3>
          <span
            className={`catalog-card-badge${inMachine ? " catalog-card-badge--live" : ""}`}
          >
            {inMachine ? slotCode : "Backlog"}
          </span>
        </div>
        <p className="catalog-card-note">{entry.note}</p>
        <p className="catalog-card-meta">
          <span>{entry.category}</span>
          <span>${entry.price.toFixed(2)}</span>
        </p>
      </div>
      <div className="catalog-card-actions">
        <button
          type="button"
          className={`catalog-assign-btn${inMachine ? " catalog-assign-btn--assigned" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onAssign();
          }}
        >
          {inMachine ? (
            <>
              <span className="catalog-assign-btn-label">Change slot</span>
              <span className="catalog-assign-btn-slot">{slotCode}</span>
            </>
          ) : (
            <span className="catalog-assign-btn-label">Add to machine</span>
          )}
        </button>
      </div>
    </article>
  );
}

type PendingReplace = {
  slotIndex: number;
  slotCode: string;
  displacedName: string;
};

function AssignSlotDialog({
  target,
  layout,
  catalogByImage,
  savingSlot,
  error,
  pendingReplace,
  onClose,
  onSlotClick,
  onConfirmReplace,
  onCancelReplace,
  onRemove,
}: {
  target: AssignTarget;
  layout: MachineLayout;
  catalogByImage: Map<string, CatalogEntry>;
  savingSlot: number | null;
  error: string | null;
  pendingReplace: PendingReplace | null;
  onClose: () => void;
  onSlotClick: (slotIndex: number) => void;
  onConfirmReplace: () => void;
  onCancelReplace: () => void;
  onRemove: () => void;
}) {
  const rows = GRID_COLS === 5 ? 4 : Math.ceil(SLOT_COUNT / GRID_COLS);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (pendingReplace) onCancelReplace();
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onCancelReplace, pendingReplace]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="assign-slot-overlay">
      <button
        type="button"
        className="assign-slot-backdrop"
        aria-label="Close assign dialog"
        onClick={onClose}
      />
      <div
        className="assign-slot-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-slot-title"
      >
        <header className="assign-slot-dialog-head">
          <div>
            <p className="assign-slot-dialog-eyebrow">Pick a rack slot</p>
            <h3 id="assign-slot-title" className="assign-slot-dialog-title">
              {target.entry.name}
            </h3>
            <p className="assign-slot-dialog-subtitle">
              {target.currentSlotCode
                ? `Currently in ${target.currentSlotCode}. Tap a slot to move or replace.`
                : "Tap a slot to assign this sticker."}
            </p>
          </div>
          <button type="button" className="assign-slot-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {error && <p className="assign-slot-error">{error}</p>}

        <div className="assign-slot-grid-wrap">
          <div className="assign-slot-grid assign-slot-grid--header" aria-hidden="true">
            <span className="assign-slot-corner" />
            {Array.from({ length: GRID_COLS }, (_, col) => (
              <span key={col} className="assign-slot-col-label">
                {col + 1}
              </span>
            ))}
          </div>

          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="assign-slot-grid">
              <span className="assign-slot-row-label">{String.fromCharCode(65 + row)}</span>
              {Array.from({ length: GRID_COLS }, (_, col) => {
                const slotIndex = row * GRID_COLS + col;
                const slotCode = getSlotCode(slotIndex);
                const occupiedImage = layout[slotIndex];
                const occupiedEntry = occupiedImage
                  ? catalogByImage.get(occupiedImage)
                  : null;
                const isOccupied = Boolean(occupiedImage);
                const isCurrent = target.entry.image === occupiedImage;
                const isPending = pendingReplace?.slotIndex === slotIndex;
                const isSaving = savingSlot === slotIndex;
                const isBusy = savingSlot !== null;

                return (
                  <button
                    key={slotCode}
                    type="button"
                    className={`assign-slot-cell${isCurrent ? " assign-slot-cell--current" : ""}${isOccupied && !isCurrent ? " assign-slot-cell--occupied" : ""}${!isOccupied ? " assign-slot-cell--empty" : ""}${isPending ? " assign-slot-cell--pending" : ""}`}
                    onClick={() => onSlotClick(slotIndex)}
                    disabled={isBusy}
                    aria-label={
                      isOccupied && !isCurrent
                        ? `Slot ${slotCode} occupied by ${occupiedEntry?.name ?? "another sticker"}`
                        : `Assign to slot ${slotCode}`
                    }
                    title={
                      isOccupied && !isCurrent
                        ? occupiedEntry?.name ?? "Occupied"
                        : undefined
                    }
                  >
                    {slotCode}
                    {isSaving && <span className="assign-slot-cell-saving">…</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <footer className="assign-slot-dialog-foot">
          {target.currentSlotCode ? (
            <button
              type="button"
              className="assign-slot-remove"
              onClick={onRemove}
              disabled={savingSlot !== null}
            >
              Remove from machine
            </button>
          ) : (
            <p className="assign-slot-foot-note">Empty slots show as placeholders on the rack.</p>
          )}
        </footer>

        {pendingReplace && (
          <div className="assign-slot-confirm" role="alertdialog" aria-labelledby="assign-slot-confirm-title">
            <h4 id="assign-slot-confirm-title" className="assign-slot-confirm-title">
              Replace slot {pendingReplace.slotCode}?
            </h4>
            <p className="assign-slot-confirm-body">
              <strong>{pendingReplace.displacedName}</strong> is in this slot. Replace it with{" "}
              <strong>{target.entry.name}</strong>? The displaced sticker returns to backlog.
            </p>
            <div className="assign-slot-confirm-actions">
              <button
                type="button"
                className="btn-ghost assign-slot-confirm-btn"
                onClick={onCancelReplace}
                disabled={savingSlot !== null}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn-primary assign-slot-confirm-btn"
                onClick={onConfirmReplace}
                disabled={savingSlot !== null}
              >
                {savingSlot !== null ? "Saving…" : "Replace"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

type Props = {
  entries: CatalogEntry[];
  initialLayout: MachineLayout;
};

export default function StickerCatalogGrid({ entries, initialLayout }: Props) {
  const router = useRouter();
  const [layout, setLayout] = useState(initialLayout);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  const catalogByImage = useMemo(
    () => new Map(entries.map((entry) => [entry.image, entry])),
    [entries],
  );

  const slotByImage = getMachineSlotByImageFromLayout(layout);
  const inMachineCount = entries.filter((entry) => slotByImage.has(entry.image)).length;

  const grouped = entries.reduce<Record<string, CatalogEntry[]>>((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  let visibleCardIndex = 0;

  const closeDialog = useCallback(() => {
    setAssignTarget(null);
    setPendingReplace(null);
    setError(null);
  }, []);

  async function patchSlot(slotIndex: number, imagePath: string | null) {
    setSavingSlot(slotIndex);
    setError(null);

    try {
      const response = await fetch("/api/admin/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_index: slotIndex,
          image_path: imagePath,
        }),
      });

      let data: { error?: string; slots?: MachineLayout } = {};
      try {
        const raw = await response.text();
        if (raw.trim()) data = JSON.parse(raw) as typeof data;
      } catch {
        if (response.ok) {
          throw new Error("Server returned an invalid response.");
        }
      }

      if (!response.ok) {
        const message =
          data.error ??
          (response.status === 401
            ? "You are not logged in. Refresh and sign in again."
            : response.status === 503
              ? "Server is not configured. Check Supabase env vars."
              : `Could not update slot (${response.status}).`);
        setError(message);
        return false;
      }

      if (!data.slots) {
        setError("Slot saved but the updated layout was not returned.");
        return false;
      }

      setLayout(data.slots);
      setPendingReplace(null);
      closeDialog();
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update slot.");
      return false;
    } finally {
      setSavingSlot(null);
    }
  }

  function handleSlotClick(slotIndex: number) {
    if (!assignTarget || savingSlot !== null) return;

    const slotCode = getSlotCode(slotIndex);
    const occupiedImage = layout[slotIndex];

    if (occupiedImage === assignTarget.entry.image) {
      return;
    }

    if (occupiedImage) {
      const displaced = catalogByImage.get(occupiedImage);
      setPendingReplace({
        slotIndex,
        slotCode,
        displacedName: displaced?.name ?? slotCode,
      });
      setError(null);
      return;
    }

    void patchSlot(slotIndex, assignTarget.entry.image);
  }

  async function handleConfirmReplace() {
    if (!assignTarget || !pendingReplace) return;
    await patchSlot(pendingReplace.slotIndex, assignTarget.entry.image);
  }

  async function handleRemoveFromMachine() {
    if (!assignTarget?.currentSlotCode) return;

    const slotIndex = layout.findIndex((image) => image === assignTarget.entry.image);
    if (slotIndex === -1) return;

    await patchSlot(slotIndex, null);
  }

  return (
    <>
      <section className="catalog-section">
        <div className="catalog-section-head">
          <h2 className="catalog-section-title">All available stickers</h2>
          <p className="catalog-section-count">
            {entries.length} in folder · {inMachineCount} in machine ·{" "}
            {entries.length - inMachineCount} backlog
          </p>
        </div>

        {sortedGroups.map(([category, categoryEntries]) => (
          <div key={category} className="catalog-group">
            <h3 className="catalog-group-title">{category}</h3>
            <div className="catalog-grid">
              {categoryEntries.map((entry) => {
                const priorityLoad = visibleCardIndex < 6;
                visibleCardIndex += 1;

                return (
                  <StickerCatalogCard
                    key={entry.image}
                    entry={entry}
                    slotCode={slotByImage.get(entry.image) ?? null}
                    priorityLoad={priorityLoad}
                    onAssign={() => {
                      setError(null);
                      setPendingReplace(null);
                      setAssignTarget({
                        entry,
                        currentSlotCode: slotByImage.get(entry.image) ?? null,
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {mounted && assignTarget && (
        <AssignSlotDialog
          target={assignTarget}
          layout={layout}
          catalogByImage={catalogByImage}
          savingSlot={savingSlot}
          error={error}
          pendingReplace={pendingReplace}
          onClose={closeDialog}
          onSlotClick={handleSlotClick}
          onConfirmReplace={handleConfirmReplace}
          onCancelReplace={() => setPendingReplace(null)}
          onRemove={handleRemoveFromMachine}
        />
      )}
    </>
  );
}
