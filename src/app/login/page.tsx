"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("owner@flowcanvas.dev");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: "Demo Owner",
        });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed");
          return;
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "Sign in failed");
          return;
        }
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0D0C] p-6">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-surface-container-high p-8">
        <p className="font-mono-label text-mono-label mb-2 text-outline">
          FLOWCANVAS
        </p>
        <h1 className="text-headline-sm mb-1 font-medium text-on-surface">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-body-sm mb-6 text-on-surface-variant">
          Email and password only — local demo credentials supported.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono-label text-[10px] uppercase tracking-wide text-on-surface-variant">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono-label text-[10px] uppercase tracking-wide text-on-surface-variant">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              required
              minLength={8}
              className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
            />
          </label>

          {error && (
            <p className="text-body-sm rounded-lg border border-[#DD6974]/40 bg-[#DD6974]/10 px-3 py-2 text-[#DD6974]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-50"
          >
            {pending
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"))
          }
          className="text-body-sm mt-4 w-full text-on-surface-variant hover:text-on-surface"
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
