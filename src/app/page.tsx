import { getMachineStickers } from "@/lib/machineSlots";
import { getReviewImages } from "@/lib/reviewImages";
import { getCoupons } from "@/lib/couponStore";
import { getStickerAssetMode } from "@/lib/s3/stickerAssets";
import { StickerAssetProvider } from "@/components/StickerAssetProvider";
import VendingMachine from "@/components/VendingMachine";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stickers, assetMode, reviewPhotos, coupons] = await Promise.all([
    getMachineStickers(),
    getStickerAssetMode(),
    getReviewImages(),
    getCoupons(),
  ]);

  return (
    <StickerAssetProvider mode={assetMode}>
      <main className="page">
        <VendingMachine stickers={stickers} reviewPhotos={reviewPhotos} coupons={coupons} />
      </main>
    </StickerAssetProvider>
  );
}
