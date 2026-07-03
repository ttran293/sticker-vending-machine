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

const HAT_DOG_CATALOG = [
  {
    slug: "hat-dog-bucket-hat",
    name: "BUCKET HAT",
    note: "flat-cap laugh",
    detail: "White pup in a black flat cap · big grin · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/hat-dog/bucket-hat.png",
    transparent: true,
  },
  {
    slug: "hat-dog-angry",
    name: "BACKWARDS CAP",
    note: "stern chihuahua",
    detail: "White chihuahua in a backwards navy cap · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/hat-dog/hat-angry.png",
    transparent: true,
  },
  {
    slug: "hat-dog-smile",
    name: "HAT & SMILE",
    note: "flower cap joy",
    detail: "Happy pup in a denim cap with yellow flowers · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/hat-dog/hat-and-smie.png",
    transparent: true,
  },
  {
    slug: "hat-dog-cute",
    name: "CUTE HAT DOG",
    note: "flower portrait",
    detail: "Fluffy pup in a denim cap holding a yellow flower · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/hat-dog/hat-cute.png",
    transparent: true,
  },
  {
    slug: "hat-dog-jelly",
    name: "ARUBA HAT",
    note: "backwards mustard cap",
    detail: "Fluffy pup in a backwards yellow ARUBA cap · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/hat-dog/jelly-with-hat.png",
    transparent: true,
  },
] as const;

const CAT_CLIMB_CATALOG = [
  {
    slug: "cat-climb-v0",
    name: "CAT CLIMB V0",
    note: "first leap",
    detail: "Cat climb series · v0 pose · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb/v0.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v2",
    name: "CAT CLIMB V2",
    note: "upward stretch",
    detail: "Cat climb series · v2 pose · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb/v2.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v3",
    name: "CAT CLIMB V3",
    note: "hold steady",
    detail: "Cat climb series · v3 pose · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb/v3.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v5",
    name: "CAT CLIMB V5",
    note: "tiny mountaineer",
    detail: "Cat climb series · v5 pose · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb/v5.png",
    transparent: true,
  },
  {
    slug: "cat-climb-v7",
    name: "CAT CLIMB V7",
    note: "top shelf cat",
    detail: "Cat climb series · v7 pose · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb/v7.png",
    transparent: true,
  },
] as const;

const CAT_CLIMB_EXP_CATALOG = [
  {
    slug: "cat-climb-exp-p2-1",
    name: "FALL ON LAST HOLD",
    note: "boulder fail",
    detail: "Last hold slip · falling tabby · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb_exp/p2-1.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-2",
    name: "CLIMBING COUPLE",
    note: "partner send",
    detail: "Matching sends · sunglasses duo · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb_exp/p2-2.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-3",
    name: "WHEN I SEE SLAB",
    note: "slab dread",
    detail: "Slab face reaction · wide-eyed tabby · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb_exp/p2-3.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-4",
    name: "ME WHEN I SEE CRIMPS",
    note: "crimp panic",
    detail: "Tiny hold horror · paws-up scream · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb_exp/p2-4.png",
    transparent: true,
  },
  {
    slug: "cat-climb-exp-p2-5",
    name: "WTF IS A DYNO",
    note: "dyno confused",
    detail: "Bouldering jargon meme · puzzled tabby · about 2″ laminated vinyl",
    price: 1,
    image: "/stickers/cat_climb_exp/p2-5.png",
    transparent: true,
  },
] as const;

const BUTTERCUP_CATALOG = [
  {
    slug: "buttercup-bad-hair-day",
    name: "BAD HAIR DAY",
    note: "morning mood",
    detail: "Sleepy Buttercup - blanket burrito and wild hair - about 2-inch laminated vinyl",
    price: 1,
    image: "/stickers/buttercup/bad-hair-day.png",
    transparent: true,
  },
  {
    slug: "buttercup-costume",
    name: "MONSTER COSTUME",
    note: "tiny dino rage",
    detail: "Buttercup in a toothy green monster costume - about 2-inch laminated vinyl",
    price: 1,
    image: "/stickers/buttercup/costume.png",
    transparent: true,
  },
  {
    slug: "buttercup-hello-phone",
    name: "HELLO, PHONE?",
    note: "hotline hero",
    detail: "Buttercup answering a bright red phone - about 2-inch laminated vinyl",
    price: 1,
    image: "/stickers/buttercup/hello-phone.png",
    transparent: true,
  },
  {
    slug: "buttercup-proud",
    name: "PROUD BUTTERCUP",
    note: "arms-crossed confidence",
    detail: "Buttercup serving a proud side-eye pose - about 2-inch laminated vinyl",
    price: 1,
    image: "/stickers/buttercup/proud.png",
    transparent: true,
  },
  {
    slug: "buttercup-wide-eyes",
    name: "WIDE-EYED BUTTERCUP",
    note: "innocent mode",
    detail: "Buttercup with an extra-wide innocent stare - about 2-inch laminated vinyl",
    price: 1,
    image: "/stickers/buttercup/wide-eyes.png",
    transparent: true,
  },
] as const;

const CATEGORY_ROWS = [
  HAT_DOG_CATALOG,
  CAT_CLIMB_CATALOG,
  CAT_CLIMB_EXP_CATALOG,
  BUTTERCUP_CATALOG,
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
      name: "PLACEHOLDER",
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
