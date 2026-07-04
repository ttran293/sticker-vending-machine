import { getMachineStickers } from "@/lib/machineSlots";
import { getReviewImages } from "@/lib/reviewImages";
import { getStickerAssetMode } from "@/lib/s3/stickerAssets";
import { StickerAssetProvider } from "@/components/StickerAssetProvider";
import VendingMachine from "@/components/VendingMachine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stickers, assetMode, reviewPhotos] = await Promise.all([
    getMachineStickers(),
    getStickerAssetMode(),
    getReviewImages(),
  ]);

  return (
    <StickerAssetProvider mode={assetMode}>
      <main className="page">
        <VendingMachine stickers={stickers} reviewPhotos={reviewPhotos} />
      </main>
    </StickerAssetProvider>
  );
}
