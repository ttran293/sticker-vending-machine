export type SitePanelId = "about" | "faq";

type FaqItem = {
  q: string;
  a: string;
};

type SitePanel = {
  title: string;
  intro?: string;
  paragraphs?: string[];
  faq?: FaqItem[];
};

export const SITE_PANELS: Record<SitePanelId, SitePanel> = {
  about: {
    title: "ABOUT",
    intro: "Sticker Machine · est. 2026",
    paragraphs: [
      "A tiny random sticker machine on the web. Browse the glass cabinet, tap to vend, and collect peelable pups at the chute below.",
      "Built with Next.js, React Three Fiber, and Framer Motion. The neocities energy is intentional — hard borders, monospace type, and zero gradient guilt.",
      "Every sticker in the rack is a hand-made die-cut illustration. This demo checkout is simulated — no real charges, just good boys sliding down the slot.",
    ],
  },
  faq: {
    title: "FAQ",
    faq: [
      {
        q: "How do I add a sticker?",
        a: "Tap any sticker in the 3D rack, or press + on a row in your cart.",
      },
      {
        q: "How do I read sticker details?",
        a: "Click the i button on the bottom-right corner of any sticker.",
      },
      {
        q: "How do I remove stickers?",
        a: "Use − to drop one copy, or × on a cart row to clear that sticker entirely.",
      },
      {
        q: "Where do selected stickers go?",
        a: "They drop into the black tray under the glass — your digital chute.",
      },
      {
        q: "Is checkout real?",
        a: "Nope. PAY is a simulated dispense for fun. No payment info is collected.",
      },
      {
        q: "Do coupons work?",
        a: "Try PEEL10, DOG5, or RANDOM in the cart coupon field before checkout.",
      },
      {
        q: "Why dogs?",
        a: "Because every sticker machine is better with fluffy pop-culture pups.",
      },
    ],
  },
};
