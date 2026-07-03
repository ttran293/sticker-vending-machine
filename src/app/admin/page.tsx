import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function AdminPage() {
  if (await isAdminAuthenticated()) {
    redirect("/dashboard");
  }

  return <AdminLoginForm />;
}
