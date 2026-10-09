import { API_URL } from "@/lib/config";

export type StaffRole = "Super Admin" | "Admin" | "Manager" | "Staff";

/** Home page of each team role after signing in. Unknown roles get the CRM, where permissions decide what shows. */
export function roleLandingPath(roleName?: string | null): string {
  switch (roleName) {
    case "Manager":
      return "/manager";
    case "Staff":
      return "/staff";
    default:
      return "/admin";
  }
}

/**
 * Staff sign-in for the shared login page. Kept free of the admin client (react-query, redirects)
 * so the public site bundle stays small. Status 0 means the API could not be reached.
 */
export async function staffLogin(email: string, password: string): Promise<{ status: number; role: string | null }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json", "x-requested-with": "sltd-admin" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json().catch(() => null)) as { data?: { user?: { role?: { name?: string } | null } } } | null;
    return { status: res.status, role: json?.data?.user?.role?.name ?? null };
  } catch {
    return { status: 0, role: null };
  }
}
