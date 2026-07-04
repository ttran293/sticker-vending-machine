import { redirect } from "next/navigation";
import DashboardActions from "@/components/DashboardActions";
import StickerCatalogGrid from "@/components/StickerCatalogGrid";
import StickerUploadPanel from "@/components/StickerUploadPanel";
import { StickerAssetProvider } from "@/components/StickerAssetProvider";
import { isAdminAuthenticated } from "@/lib/auth";
import { readMachineLayout } from "@/lib/machineSlots";
import { getAllAvailableStickers } from "@/lib/stickerInventory";
import { getStickerAssetMode } from "@/lib/s3/stickerAssets";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const [entries, layout, assetMode] = await Promise.all([
    getAllAvailableStickers(),
    readMachineLayout(),
    getStickerAssetMode(),
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

        <StickerUploadPanel />

        <StickerCatalogGrid entries={entries} initialLayout={layout} />
        </div>
      </main>
    </StickerAssetProvider>
  );
}
