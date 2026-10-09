"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { roleLandingPath, useAuth } from "@/lib/admin/auth";
import { errorMessage } from "@/lib/admin/api";
import { Button, FieldError, Input, Label } from "@/components/admin/ui";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const safeNext = next && (next.startsWith("/admin") || next.startsWith("/manager") || next.startsWith("/staff")) && !next.startsWith("//") ? next : null;
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) router.replace(safeNext ?? roleLandingPath(user.role?.name));
  }, [loading, user, router, safeNext]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      const signedIn = await login(email, password);
      router.replace(safeNext ?? roleLandingPath(signedIn.role?.name));
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" data-testid="login-form">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
        <FieldError message={errors.password?.message} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#1f7a4d_0%,#08261a_55%,#04170f_100%)] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-800 text-gold-400">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="font-sans text-xl font-semibold text-slate-900">Team sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Admin, manager & staff portal</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
