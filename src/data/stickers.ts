export type Sticker = {
  id: string;
  name: string;
  note: string;
  detail: string;
  price: number;
  image: string;
  saleLabel?: string;
};

export const GRID_COLS = 4;
export const GRID_ROWS = 5;

const CATALOG = [
  {
    slug: "aladdin",
    name: "ALADDIN SANE",
    note: "glam-rock pup",
    detail: "Bowie tribute · hand-painted lightning bolt · 3″ matte vinyl",
    price: 6.0,
    image: "/stickers/001_aladdin_sane_dog.png",
  },
  {
    slug: "thriller",
    name: "THRILLER",
    note: "bow-tie good boy",
    detail: "MJ-era portrait · pink backdrop · 3″ glossy vinyl",
    price: 5.5,
    image: "/stickers/02_thriller_dog.png",
  },
  {
    slug: "weezer",
    name: "WEEZER",
    note: "the blue album",
    detail: "Band lineup · green studio wall · 3″ matte vinyl",
    price: 5.0,
    image: "/stickers/03_weezer_dog.png",
  },
  {
    slug: "blonde",
    name: "BLONDE",
    note: "shower-fresh",
    detail: "Frank Ocean homage · shower tiles · 3″ matte vinyl",
    price: 6.5,
    image: "/stickers/08_blonde_dog.png",
  },
] as const;

/** 4×5 shelf grid — cycles the four album dogs across 20 slots */
export const stickers: Sticker[] = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
  const row = Math.floor(i / GRID_COLS);
  const col = i % GRID_COLS;
  const base = CATALOG[i % CATALOG.length];

  return {
    id: `${base.slug}-${row}-${col}`,
    name: base.name,
    note: base.note,
    detail: base.detail,
    price: base.price,
    image: base.image,
    saleLabel: [0, 3, 6, 11, 14, 17].includes(i) ? "-10%" : undefined,
  };
});
