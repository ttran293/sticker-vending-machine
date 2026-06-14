"use client";

import { motion } from "framer-motion";
import { SITE_PANELS, type SitePanelId } from "@/data/sitePanels";

type Props = {
  panel: SitePanelId;
  onClose: () => void;
};

export default function SidebarPanel({ panel, onClose }: Props) {
  const content = SITE_PANELS[panel];

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
        className="sidebar-panel"
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
        </div>
      </motion.aside>
    </>
  );
}
