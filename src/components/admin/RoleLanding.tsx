"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth, roleLandingPath, type StaffRole } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

const labels: Record<StaffRole, { title: string; description: string }> = {
  "Super Admin": { title: "Super Admin Dashboard", description: "Full system control and security administration." },
  Admin: { title: "Admin Dashboard", description: "Manage the website, CRM and operational settings." },
  Manager: { title: "Manager Dashboard", description: "Manage bookings, enquiries, customers and daily tour operations." },
  Staff: { title: "Staff Dashboard", description: "Work with assigned bookings, enquiries and customer information." },
};

export function RoleLanding({ role }: { role: "Manager" | "Staff" }) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && !error) router.replace(`/admin/login?next=/${role.toLowerCase()}`);
    else if (user && user.role?.name !== role) router.replace(roleLandingPath(user.role?.name));
  }, [loading, user, error, role, router]);

  if (!loading && !user && error) {
    return <div className="mx-auto max-w-lg p-8 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-red-500" /><p className="mt-3 font-medium">Unable to verify your session.</p><Link href="/admin/login" className="mt-4 inline-block text-forest-700 underline">Sign in again</Link></div>;
  }

  if (loading || !user) {
    return <div className="flex min-h-dvh items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-forest-700" /></div>;
  }

  if (user.role?.name !== role) return null;
  const copy = labels[role];
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-forest-700">{role}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="mt-2 text-slate-500">{copy.description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-slate-900">Welcome, {user.name}.</p>
          <p className="mt-1 text-sm text-slate-500">Use the navigation menu to access the modules your role is permitted to use.</p>
          <Link href="/admin" className="mt-5 inline-flex rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-white hover:bg-forest-700">Open CRM dashboard</Link>
        </div>
      </div>
    </AdminShell>
  );
}
