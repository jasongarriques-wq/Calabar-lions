import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard, type AdminUser, type AdminReport } from "./admin-dashboard";

export const metadata = { title: "Admin" };

type ProfileRow = {
  id: string;
  full_name: string | null;
  display_name: string | null;
  role: string | null;
  class_group: string | null;
  grade: number | null;
  graduating_year: number | null;
  approved: boolean | null;
  sport: string | null;
  houses?: { name: string | null } | { name: string | null }[] | null;
};

type ReportRow = {
  id: string;
  reason: string | null;
  status: string | null;
  target_type: string | null;
  created_at: string;
};

function severity(reason: string | null): "Low" | "Medium" | "High" {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("threat") || r.includes("abuse") || r.includes("violence")) return "High";
  if (r.includes("spam") || r.includes("duplicate")) return "Low";
  return "Medium";
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle<{ role: string | null }>();

  const adminRoles = new Set(["admin", "super_admin", "senior_admin"]);
  if (!adminRoles.has(me?.role ?? "")) redirect("/dashboard");

  const [{ data: profiles }, { data: reports }, { count: pending }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, display_name, role, class_group, grade, graduating_year, approved, sport, houses ( name )",
      )
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("reports")
      .select("id, reason, status, target_type, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approved", false),
  ]);

  const users: AdminUser[] = ((profiles as ProfileRow[] | null) ?? []).map((p) => {
    const houseRel = Array.isArray(p.houses) ? p.houses[0] : p.houses;
    return {
      id: p.id,
      name: p.display_name ?? p.full_name ?? "Unnamed",
      role: (p.role ?? "student").replace("_", " "),
      group: p.class_group ?? (p.grade ? `Grade ${p.grade}` : "—"),
      status: p.approved ? "Active" : "Pending",
      risk: "Low",
      email: "—",
      phone: "—",
      address: "—",
      house: houseRel?.name ?? "—",
      sport: p.sport ?? "—",
      attendance: "—",
      graduation: p.graduating_year ? String(p.graduating_year) : "—",
    };
  });

  const reportsView: AdminReport[] = ((reports as ReportRow[] | null) ?? []).map((r) => ({
    id: r.id,
    title: r.reason ?? "Untitled report",
    severity: severity(r.reason),
    area: (r.target_type ?? "general").replace("_", " "),
  }));

  return (
    <AdminDashboard users={users} reports={reportsView} pendingApprovals={pending ?? 0} />
  );
}
