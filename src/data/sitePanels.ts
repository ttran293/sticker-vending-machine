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
    paragraphs: [
      "This is a small side hustle and hobby project. Mostly, I just want to make fun stickers for my friends and build a little vending machine around them.",
      "A lot of the ideas start from animal images I find online. I edit and remix them with AI tools until they feel cute, weird, or funny enough to become a sticker.",
      "The physical stickers are made by me with a Cricut machine, so each design goes from digital edit to something I can cut, peel, and share.",
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
        a: "Click the sticker code under an item, like [A1], to open its details.",
      },
      {
        q: "How do I remove stickers?",
        a: "Use − to drop one copy, or × on a cart row to clear that sticker entirely.",
      },
      {
        q: "What material are the stickers?",
        a: "They are about 2 inches, printed on white vinyl sticker paper, and finished with a clear laminate.",
      },
      {
        q: "Is checkout real?",
        a: "Payments are handled with Stripe at checkout.",
      },
    ],
  },
};
