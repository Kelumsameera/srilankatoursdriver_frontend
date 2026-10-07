"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, AdminApiError, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { Button, Card, FieldError, Input, Label, PageHeader } from "@/components/admin/ui";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(10, "At least 10 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { message: "Passwords do not match", path: ["confirm"] });
type Values = z.infer<typeof schema>;

export default function SecurityPage() {
  const { user, can } = useAuth();
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.get<{ security: Record<string, unknown> }>("/admin/system/integrations"),
    enabled: can("system:read"),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed. Other devices have been signed out.");
      reset();
    } catch (err) {
      if (err instanceof AdminApiError) for (const e of err.errors) setError(e.path as keyof Values, { message: e.message });
      toast.error(errorMessage(err));
    }
  });

  return (
    <div>
      <PageHeader title="Security" description={`Signed in as ${user?.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="cur">Current password</Label>
              <Input id="cur" type="password" autoComplete="current-password" {...register("currentPassword")} />
              <FieldError message={errors.currentPassword?.message} />
            </div>
            <div>
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" autoComplete="new-password" {...register("newPassword")} />
              <FieldError message={errors.newPassword?.message} />
            </div>
            <div>
              <Label htmlFor="conf">Confirm new password</Label>
              <Input id="conf" type="password" autoComplete="new-password" {...register("confirm")} />
              <FieldError message={errors.confirm?.message} />
            </div>
            <Button type="submit" loading={isSubmitting}>
              Change password
            </Button>
          </form>
        </Card>
        <Card title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Protections in place</span>}>
          <ul className="list-disc space-y-1.5 ps-4 text-sm text-slate-600">
            <li>Passwords hashed with bcrypt (cost 12); accounts lock for 15 minutes after 5 failed sign-ins</li>
            <li>Short-lived access token + rotating refresh token in httpOnly cookies (refresh-token reuse revokes all sessions)</li>
            <li>Role-based permissions enforced by the API on every request</li>
            <li>Rate limiting, Helmet security headers, strict CORS and origin checks</li>
            <li>Zod validation and NoSQL-operator stripping on all input</li>
            <li>Signed Cloudinary uploads – the API secret never reaches the browser</li>
            <li>Full audit trail in Activity Logs</li>
          </ul>
          {integrations.data && (
            <dl className="mt-4 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {Object.entries(integrations.data.data.security).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>{k}</dt>
                  <dd className="font-mono">{String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>
    </div>
  );
}
