import { redirect } from "next/navigation";
import DashboardActions from "@/components/DashboardActions";
import DashboardTabs from "@/components/DashboardTabs";
import { StickerAssetProvider } from "@/components/StickerAssetProvider";
import { isAdminAuthenticated } from "@/lib/auth";
import { readMachineLayout } from "@/lib/machineSlots";
import { getAdminReviewImages } from "@/lib/reviewImages";
import { getAllAvailableStickers } from "@/lib/stickerInventory";
import { getAdminCoupons } from "@/lib/couponStore";
import { getStickerAssetMode } from "@/lib/s3/stickerAssets";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const [entries, layout, assetMode, reviewImages, coupons] = await Promise.all([
    getAllAvailableStickers(),
    readMachineLayout(),
    getStickerAssetMode(),
    getAdminReviewImages(),
    getAdminCoupons(),
  ]);

  return (
    <StickerAssetProvider mode={assetMode}>
      <main className="dashboard-page">
        <div className="dashboard-shell">
          <header className="dashboard-header">
            <div>
              <h1 className="admin-title">Dashboard</h1>
              <p className="admin-subtitle">Manage your sticker backlog and machine inventory.</p>
            </div>
          <DashboardActions />
        </header>

        <DashboardTabs
          entries={entries}
          initialLayout={layout}
          reviewImages={reviewImages}
          initialCoupons={coupons}
        />
        </div>
      </main>
    </StickerAssetProvider>
  );
}
