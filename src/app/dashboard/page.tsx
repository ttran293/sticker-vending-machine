import { redirect } from "next/navigation";
import DashboardActions from "@/components/DashboardActions";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function DashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  return (
    <main className="admin-page">
      <div className="admin-card admin-card--wide">
        <h1 className="admin-title">Dashboard</h1>
        <p className="admin-subtitle">You&apos;re logged in.</p>
        <DashboardActions />
      </div>
    </main>
  );
}
