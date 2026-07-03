import { getMachineStickers } from "@/lib/machineSlots";
import VendingMachine from "@/components/VendingMachine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stickers = await getMachineStickers();

  return (
    <main className="page">
      <VendingMachine stickers={stickers} />
    </main>
  );
}
