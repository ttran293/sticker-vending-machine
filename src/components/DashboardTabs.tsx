"use client";

import { useId, useState } from "react";
import StickerCatalogGrid from "@/components/StickerCatalogGrid";
import ReviewImagesSection from "@/components/ReviewImagesSection";
import StickerUploadPanel from "@/components/StickerUploadPanel";
import type { CatalogEntry } from "@/data/stickers";
import type { MachineLayout } from "@/lib/machineLayoutShared";
import type { ReviewImage } from "@/lib/reviewImages";
import styles from "./DashboardTabs.module.css";

type DashboardTab = "stickers" | "reviews";

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
          onClick={() => setActiveTab("stickers")}
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
          onClick={() => setActiveTab("reviews")}
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
