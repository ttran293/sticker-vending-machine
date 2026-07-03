import {
  GRID_COLS,
  catalogMetadataByImage,
  type Sticker,
} from "@/data/stickers";
import { fallbackCatalogEntry } from "@/lib/stickerMetadata";
import { resolveStickerImageUrl, getStickerAssetMode, type StickerAssetMode } from "@/lib/s3/stickerAssets";
import {
  DEFAULT_LAYOUT,
  getSlotCode,
  sanitizeLayout,
  SLOT_COUNT,
  type MachineLayout,
} from "@/lib/machineLayoutShared";
import {
  getSupabaseAnonConfig,
  getSupabaseServiceConfig,
  supabaseHeaders,
  supabaseRest,
} from "@/lib/supabase/rest";

export type { MachineLayout } from "@/lib/machineLayoutShared";
export {
  DEFAULT_LAYOUT,
  getMachineSlotByImageFromLayout,
  getSlotCode,
} from "@/lib/machineLayoutShared";

type MachineSlotRow = {
  slot_index: number;
  image_path: string | null;
};

function rowsToLayout(rows: MachineSlotRow[]): MachineLayout {
  const layout: MachineLayout = Array.from({ length: SLOT_COUNT }, () => null);

  for (const row of rows) {
    if (row.slot_index < 0 || row.slot_index >= SLOT_COUNT) continue;
    layout[row.slot_index] = row.image_path?.trim() ? row.image_path : null;
  }

  return layout;
}

async function readMachineLayoutFromSupabase(): Promise<MachineLayout | null> {
  const config = getSupabaseAnonConfig();
  if (!config) return null;

  try {
    const rows = await supabaseRest<MachineSlotRow[]>(
      config,
      "machine_slots?select=slot_index,image_path&order=slot_index.asc",
      { headers: supabaseHeaders(config.apiKey), cache: "no-store" },
    );

    if (!rows?.length) return null;
    return rowsToLayout(rows);
  } catch {
    return null;
  }
}

async function writeMachineLayoutToSupabase(layout: MachineLayout) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  const sanitized = sanitizeLayout(layout);
  const rows = sanitized.map((image_path, slot_index) => ({
    slot_index,
    image_path,
    updated_at: new Date().toISOString(),
  }));

  await supabaseRest(
    config,
    "machine_slots",
    {
      method: "POST",
      headers: supabaseHeaders(config.apiKey, {
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(rows),
    },
  );
}

export async function readMachineLayout(): Promise<MachineLayout> {
  const fromSupabase = await readMachineLayoutFromSupabase();
  if (fromSupabase) return fromSupabase;
  return [...DEFAULT_LAYOUT];
}

export async function writeMachineLayout(layout: MachineLayout) {
  await writeMachineLayoutToSupabase(layout);
}

export function applySlotAssignment(
  layout: MachineLayout,
  slotIndex: number,
  imagePath: string | null,
): MachineLayout {
  const next = [...layout];

  if (imagePath) {
    const previousIndex = next.indexOf(imagePath);
    if (previousIndex !== -1) next[previousIndex] = null;
  }

  next[slotIndex] = imagePath;
  return next;
}

export function buildMachineStickers(
  layout: MachineLayout,
  assetMode: StickerAssetMode = "local",
): Sticker[] {
  return layout.map((image, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    const slotCode = getSlotCode(index);

    if (!image) {
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

    const meta = catalogMetadataByImage[image] ?? fallbackCatalogEntry(image);

    return {
      id: `${meta.slug}-${row}-${col}`,
      name: meta.name,
      note: meta.note,
      detail: meta.detail,
      price: meta.price,
      image: resolveStickerImageUrl(image, assetMode),
      slotCode,
      transparent: meta.transparent,
    };
  });
}

export async function getMachineStickers() {
  const [layout, assetMode] = await Promise.all([
    readMachineLayout(),
    getStickerAssetMode(),
  ]);
  return buildMachineStickers(layout, assetMode);
}
