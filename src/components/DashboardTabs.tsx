"use client";

import { useId, useSyncExternalStore } from "react";
import CouponsSection from "@/components/CouponsSection";
import StickerCatalogGrid from "@/components/StickerCatalogGrid";
import ReviewImagesSection from "@/components/ReviewImagesSection";
import StickerUploadPanel from "@/components/StickerUploadPanel";
import type { Coupon } from "@/data/coupons";
import type { CatalogEntry } from "@/data/stickers";
import type { MachineLayout } from "@/lib/machineLayoutShared";
import type { ReviewImage } from "@/lib/reviewImages";
import { buildStickerFolderOptions } from "@/lib/stickerMetadata";
import styles from "./DashboardTabs.module.css";

type DashboardTab = "stickers" | "reviews" | "coupons";

const DASHBOARD_TAB_STORAGE_KEY = "dashboard-active-tab";
const DASHBOARD_TAB_CHANGE_EVENT = "dashboard-tab-change";

function readStoredTab(): DashboardTab {
  if (typeof window === "undefined") return "stickers";

  const saved = window.localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY);
  if (saved === "reviews" || saved === "coupons") return saved;
  return "stickers";
}

function subscribeToStoredTab(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DASHBOARD_TAB_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DASHBOARD_TAB_CHANGE_EVENT, onStoreChange);
  };
}

type Props = {
  entries: CatalogEntry[];
  initialLayout: MachineLayout;
  reviewImages: ReviewImage[];
  initialCoupons: Coupon[];
};

export default function DashboardTabs({
  entries,
  initialLayout,
  reviewImages,
  initialCoupons,
}: Props) {
  const baseId = useId();
  const stickersPanelId = `${baseId}-stickers-panel`;
  const reviewsPanelId = `${baseId}-reviews-panel`;
  const couponsPanelId = `${baseId}-coupons-panel`;
  const folderOptions = buildStickerFolderOptions(entries);
  const activeTab = useSyncExternalStore(subscribeToStoredTab, readStoredTab, () => "stickers");

  function selectTab(tab: DashboardTab) {
    window.localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, tab);
    window.dispatchEvent(new Event(DASHBOARD_TAB_CHANGE_EVENT));
  }

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          id={`${baseId}-stickers-tab`}
          aria-selected={activeTab === "stickers"}
          aria-controls={stickersPanelId}
          className={`${styles.tab}${activeTab === "stickers" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => selectTab("stickers")}
        >
          Stickers
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-reviews-tab`}
          aria-selected={activeTab === "reviews"}
          aria-controls={reviewsPanelId}
          className={`${styles.tab}${activeTab === "reviews" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => selectTab("reviews")}
        >
          Review images
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-coupons-tab`}
          aria-selected={activeTab === "coupons"}
          aria-controls={couponsPanelId}
          className={`${styles.tab}${activeTab === "coupons" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => selectTab("coupons")}
        >
          Coupons
        </button>
      </div>

      <div
        id={stickersPanelId}
        role="tabpanel"
        aria-labelledby={`${baseId}-stickers-tab`}
        hidden={activeTab !== "stickers"}
        className={`${styles.panel}${activeTab !== "stickers" ? ` ${styles.panelHidden}` : ""}`}
      >
        <StickerUploadPanel folderOptions={folderOptions} />
        <StickerCatalogGrid entries={entries} initialLayout={initialLayout} />
      </div>

      <div
        id={reviewsPanelId}
        role="tabpanel"
        aria-labelledby={`${baseId}-reviews-tab`}
        hidden={activeTab !== "reviews"}
        className={`${styles.panel}${activeTab !== "reviews" ? ` ${styles.panelHidden}` : ""}`}
      >
        <ReviewImagesSection initialImages={reviewImages} />
      </div>

      <div
        id={couponsPanelId}
        role="tabpanel"
        aria-labelledby={`${baseId}-coupons-tab`}
        hidden={activeTab !== "coupons"}
        className={`${styles.panel}${activeTab !== "coupons" ? ` ${styles.panelHidden}` : ""}`}
      >
        <CouponsSection initialCoupons={initialCoupons} />
      </div>
    </>
  );
}
