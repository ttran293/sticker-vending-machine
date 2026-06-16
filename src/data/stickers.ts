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
    detail: "Bowie tribute · hand-painted lightning bolt · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/music_album/001_aladdin_sane_dog.png",
  },
  {
    slug: "thriller",
    name: "THRILLER",
    note: "bow-tie good boy",
    detail: "MJ-era portrait · pink backdrop · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/music_album/02_thriller_dog.png",
  },
  {
    slug: "weezer",
    name: "WEEZER",
    note: "the blue album",
    detail: "Band lineup · green studio wall · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/music_album/03_weezer_dog.png",
  },
  {
    slug: "igor",
    name: "IGOR",
    note: "pink-suited pup",
    detail: "Tyler tribute · bold suit portrait · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/music_album/004_igor_dog.png",
  },
  {
    slug: "blonde",
    name: "BLONDE",
    note: "shower-fresh",
    detail: "Frank Ocean homage · shower tiles · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/music_album/08_blonde_dog.png",
  },
] as const;

const CAT_CLIMB_CATALOG = [
  {
    slug: "cat-climb-v0",
    name: "CAT CLIMB V0",
    note: "first leap",
    detail: "Cat climb series · v0 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb/v0.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v2",
    name: "CAT CLIMB V2",
    note: "upward stretch",
    detail: "Cat climb series · v2 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb/v2.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v3",
    name: "CAT CLIMB V3",
    note: "hold steady",
    detail: "Cat climb series · v3 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb/v3.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v5",
    name: "CAT CLIMB V5",
    note: "tiny mountaineer",
    detail: "Cat climb series · v5 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb/v5.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v7",
    name: "CAT CLIMB V7",
    note: "top shelf cat",
    detail: "Cat climb series · v7 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb/v7.png",
    transparent: true,
  },
] as const;

const CAT_CLIMB_EXP_CATALOG = [
  {
    slug: "cat-climb-exp-p2-1",
    name: "CAT EXP P2-1",
    note: "test pull",
    detail: "Cat climb experiment · p2-1 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb_exp/p2-1.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-2",
    name: "CAT EXP P2-2",
    note: "second beta",
    detail: "Cat climb experiment · p2-2 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb_exp/p2-2.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-3",
    name: "CAT EXP P2-3",
    note: "third beta",
    detail: "Cat climb experiment · p2-3 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb_exp/p2-3.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-4",
    name: "CAT EXP P2-4",
    note: "fourth beta",
    detail: "Cat climb experiment · p2-4 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb_exp/p2-4.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-5",
    name: "CAT EXP P2-5",
    note: "fifth beta",
    detail: "Cat climb experiment · p2-5 pose · about 2″ laminated vinyl",
    price: 1.5,
    image: "/stickers/cat_climb_exp/p2-5.png",
    transparent: true,
  },
] as const;

const CATEGORY_ROWS = [
  MUSIC_ALBUM_CATALOG,
  CAT_CLIMB_CATALOG,
  CAT_CLIMB_EXP_CATALOG,
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
