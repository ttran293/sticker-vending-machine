import { redirect } from "next/navigation";
import DashboardActions from "@/components/DashboardActions";
import StickerCatalogGrid from "@/components/StickerCatalogGrid";
import { isAdminAuthenticated } from "@/lib/auth";
import { readMachineLayout } from "@/lib/machineSlots";
import { getAllAvailableStickers } from "@/lib/stickerInventory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const entries = getAllAvailableStickers();
  const layout = await readMachineLayout();

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <h1 className="admin-title">Dashboard</h1>
            <p className="admin-subtitle">Manage your sticker backlog and machine inventory.</p>
          </div>
          <DashboardActions />
        </header>

        <StickerCatalogGrid entries={entries} initialLayout={layout} />
      </div>
    </main>
  );
}
