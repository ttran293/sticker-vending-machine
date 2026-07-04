"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SITE_PANELS, type SitePanelId } from "@/data/sitePanels";
import type { ReviewImage } from "@/lib/reviewImages";

type Props = {
  panel: SitePanelId;
  reviewPhotos?: ReviewImage[];
  onClose: () => void;
};

export default function SidebarPanel({ panel, reviewPhotos = [], onClose }: Props) {
  const content = SITE_PANELS[panel];
  const galleryPhotos =
    panel === "offTheRack"
      ? reviewPhotos.map((photo) => ({
          key: photo.path,
          image: photo.image,
          alt: photo.alt,
        }))
      : (content.photos ?? []).map((photo) => ({
          key: photo.image,
          image: photo.image,
          alt: photo.alt,
        }));

  return (
    <>
      <motion.button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.aside
        className={`sidebar-panel${panel === "offTheRack" ? " sidebar-panel--gallery" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-panel-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        <div className="sidebar-head">
          <h2 id="sidebar-panel-title" className="sidebar-title">
            {content.title}
          </h2>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="sidebar-body">
          {content.intro && <p className="sidebar-intro">{content.intro}</p>}

          {content.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="sidebar-text">
              {paragraph}
            </p>
          ))}

          {content.faq?.map((item) => (
            <div key={item.q} className="sidebar-faq-item">
              <h3 className="sidebar-faq-q">{item.q}</h3>
              <p className="sidebar-faq-a">{item.a}</p>
            </div>
          ))}

          {galleryPhotos.length > 0 && (
            <div className="sidebar-photo-grid">
              {galleryPhotos.map((photo) => (
                <figure key={photo.key} className="sidebar-photo-cell">
                  <Image
                    src={photo.image}
                    alt={photo.alt}
                    fill
                    className="sidebar-photo-img"
                    sizes="(max-width: 560px) 44vw, 200px"
                  />
                </figure>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
