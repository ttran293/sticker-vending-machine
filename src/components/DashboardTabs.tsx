"use client";

import { useEffect, useId, useState } from "react";
import StickerCatalogGrid from "@/components/StickerCatalogGrid";
import ReviewImagesSection from "@/components/ReviewImagesSection";
import StickerUploadPanel from "@/components/StickerUploadPanel";
import type { CatalogEntry } from "@/data/stickers";
import type { MachineLayout } from "@/lib/machineLayoutShared";
import type { ReviewImage } from "@/lib/reviewImages";
import styles from "./DashboardTabs.module.css";

type DashboardTab = "stickers" | "reviews";

const DASHBOARD_TAB_STORAGE_KEY = "dashboard-active-tab";

function readStoredTab(): DashboardTab {
  if (typeof window === "undefined") return "stickers";

  const saved = window.localStorage.getItem(DASHBOARD_TAB_STORAGE_KEY);
  return saved === "reviews" ? "reviews" : "stickers";
}

type Props = {
  entries: CatalogEntry[];
  initialLayout: MachineLayout;
  reviewImages: ReviewImage[];
};

export default function DashboardTabs({ entries, initialLayout, reviewImages }: Props) {
  const baseId = useId();
  const stickersPanelId = `${baseId}-stickers-panel`;
  const reviewsPanelId = `${baseId}-reviews-panel`;
  const [activeTab, setActiveTab] = useState<DashboardTab>("stickers");

  useEffect(() => {
    setActiveTab(readStoredTab());
  }, []);

  function selectTab(tab: DashboardTab) {
    setActiveTab(tab);
    window.localStorage.setItem(DASHBOARD_TAB_STORAGE_KEY, tab);
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
      </div>

      <div
        id={stickersPanelId}
        role="tabpanel"
        aria-labelledby={`${baseId}-stickers-tab`}
        hidden={activeTab !== "stickers"}
        className={`${styles.panel}${activeTab !== "stickers" ? ` ${styles.panelHidden}` : ""}`}
      >
        <StickerUploadPanel />
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
    </>
  );
}
