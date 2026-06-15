export type Sticker = {
  id: string;
  name: string;
  note: string;
  detail: string;
  price: number;
  image: string;
  slotCode: string;
  transparent?: boolean;
  placeholder?: boolean;
  saleLabel?: string;
};

export const GRID_COLS = 5;
export const GRID_ROWS = 4;

const MUSIC_ALBUM_CATALOG = [
  {
    slug: "aladdin",
    name: "ALADDIN SANE",
    note: "glam-rock pup",
    detail: "Bowie tribute · hand-painted lightning bolt · 3″ matte vinyl",
    price: 6.0,
    image: "/stickers/music_album/001_aladdin_sane_dog.png",
  },
  {
    slug: "thriller",
    name: "THRILLER",
    note: "bow-tie good boy",
    detail: "MJ-era portrait · pink backdrop · 3″ glossy vinyl",
    price: 5.5,
    image: "/stickers/music_album/02_thriller_dog.png",
  },
  {
    slug: "weezer",
    name: "WEEZER",
    note: "the blue album",
    detail: "Band lineup · green studio wall · 3″ matte vinyl",
    price: 5.0,
    image: "/stickers/music_album/03_weezer_dog.png",
  },
  {
    slug: "blonde",
    name: "BLONDE",
    note: "shower-fresh",
    detail: "Frank Ocean homage · shower tiles · 3″ matte vinyl",
    price: 6.5,
    image: "/stickers/music_album/08_blonde_dog.png",
  },
] as const;

const CAT_CLIMB_CATALOG = [
  {
    slug: "cat-climb-v0",
    name: "CAT CLIMB V0",
    note: "first leap",
    detail: "Cat climb series · v0 pose · 3″ matte vinyl",
    price: 5.5,
    image: "/stickers/cat_climb/v0.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v2",
    name: "CAT CLIMB V2",
    note: "upward stretch",
    detail: "Cat climb series · v2 pose · 3″ matte vinyl",
    price: 5.5,
    image: "/stickers/cat_climb/v2.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v5",
    name: "CAT CLIMB V5",
    note: "tiny mountaineer",
    detail: "Cat climb series · v5 pose · 3″ matte vinyl",
    price: 5.5,
    image: "/stickers/cat_climb/v5.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v7",
    name: "CAT CLIMB V7",
    note: "top shelf cat",
    detail: "Cat climb series · v7 pose · 3″ matte vinyl",
    price: 5.5,
    image: "/stickers/cat_climb/v7.png",
    transparent: true,
  },
] as const;

const CATEGORY_ROWS = [
  MUSIC_ALBUM_CATALOG,
  CAT_CLIMB_CATALOG,
] as const;

const SALE_SLOTS: number[] = [];

/** 5×4 shelf grid — keeps each category on its own row */
export const stickers: Sticker[] = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
  const row = Math.floor(i / GRID_COLS);
  const col = i % GRID_COLS;
  const category = CATEGORY_ROWS[row];
  const base = category?.[col];
  const slotCode = `${String.fromCharCode(65 + row)}${col + 1}`;

  if (!base) {
    return {
      id: `placeholder-${row}-${col}`,
      name: "COMING SOON",
      note: "empty slot",
      detail: "More stickers are on the way.",
      price: 0,
      image: "",
      slotCode,
      placeholder: true,
    };
  }

  return {
    id: `${base.slug}-${row}-${col}`,
    name: base.name,
    note: base.note,
    detail: base.detail,
    price: base.price,
    image: base.image,
    slotCode,
    transparent: "transparent" in base ? base.transparent : undefined,
    saleLabel: SALE_SLOTS.includes(i) ? "-10%" : undefined,
  };
});
