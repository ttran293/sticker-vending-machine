import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applySlotAssignment, readMachineLayout, writeMachineLayout } from "@/lib/machineSlots";
import { SLOT_COUNT } from "@/lib/machineLayoutShared";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ slots: await readMachineLayout() });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slots = (body as { slots?: unknown }).slots;
  if (!Array.isArray(slots) || slots.length !== SLOT_COUNT) {
    return NextResponse.json(
      { error: `Layout must include exactly ${SLOT_COUNT} slots.` },
      { status: 400 },
    );
  }

  try {
    await writeMachineLayout(
      slots.map((value) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value !== "string") {
          throw new Error("Invalid slot value.");
        }
        return value;
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save layout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, slots: await readMachineLayout() });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slotIndex = (body as { slot_index?: unknown }).slot_index;
  const imagePath = (body as { image_path?: unknown }).image_path;

  if (typeof slotIndex !== "number" || slotIndex < 0 || slotIndex >= SLOT_COUNT) {
    return NextResponse.json({ error: "Invalid slot index." }, { status: 400 });
  }

  if (
    imagePath !== null &&
    imagePath !== undefined &&
    imagePath !== "" &&
    (typeof imagePath !== "string" || !imagePath.startsWith("/stickers/"))
  ) {
    return NextResponse.json({ error: "Invalid sticker path." }, { status: 400 });
  }

  const normalizedImage =
    imagePath === null || imagePath === undefined || imagePath === ""
      ? null
      : imagePath;

  try {
    const layout = await readMachineLayout();
    const next = applySlotAssignment(layout, slotIndex, normalizedImage);
    await writeMachineLayout(next);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign slot.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, slots: await readMachineLayout() });
}
