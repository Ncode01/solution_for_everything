"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/api/client";
import type { InviteValidation } from "@/lib/api/types";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  const { data: session } = authClient.useSession();

  const [invite, setInvite] = useState<InviteValidation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Invalid invite link");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = await apiClient.validateInviteToken(token);
        if (!cancelled) {
          setInvite(data);
          setName(data.email.split("@")[0] ?? "");
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Invite not found or expired",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function acceptForSession(authUserId: string, displayName: string) {
    await apiClient.acceptInvite(token, authUserId, displayName);
    router.push("/");
    router.refresh();
  }

  async function handleAcceptExisting() {
    if (!session?.user || !invite) return;
    setSubmitError(null);
    setPending(true);
    try {
      await acceptForSession(
        session.user.id,
        session.user.name ?? (name || invite.email),
      );
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Failed to accept invite");
    } finally {
      setPending(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitError(null);
    setPending(true);

    try {
      const result = await authClient.signUp.email({
        email: invite.email,
        password,
        name: name.trim() || invite.email.split("@")[0] || "Member",
      });
      if (result.error) {
        setSubmitError(result.error.message ?? "Sign up failed");
        return;
      }
      const userId = result.data?.user?.id;
      if (!userId) {
        setSubmitError("Account created but session missing — sign in and retry");
        return;
      }
      await acceptForSession(userId, name.trim() || invite.email);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0D0C] p-6">
        <p className="font-mono-label text-mono-label text-outline">
          Validating invite…
        </p>
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0D0C] p-6">
        <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-surface-container-high p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-error" size={32} />
          <h1 className="text-headline-sm mb-2 font-medium text-on-surface">
            Invite unavailable
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            {loadError ?? "This invite link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E0D0C] p-6">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-surface-container-high p-8">
        <p className="font-mono-label text-mono-label mb-2 text-outline">
          FLOWCANVAS INVITE
        </p>
        <h1 className="text-headline-sm mb-1 font-medium text-on-surface">
          Join your team
        </h1>
        <p className="text-body-sm mb-6 text-on-surface-variant">
          You&apos;ve been invited as{" "}
          <span className="text-primary capitalize">{invite.role}</span> —{" "}
          {invite.email}
        </p>

        {session?.user ? (
          <div className="flex flex-col gap-4">
            <p className="text-body-sm text-on-surface-variant">
              Signed in as {session.user.email}. Accept to link your account.
            </p>
            {submitError ? (
              <p className="text-body-sm rounded-lg border border-[#DD6974]/40 bg-[#DD6974]/10 px-3 py-2 text-[#DD6974]">
                {submitError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleAcceptExisting()}
              className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-50"
            >
              {pending ? "Please wait…" : "Accept Invite"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono-label text-[10px] uppercase tracking-wide text-on-surface-variant">
                Email
              </span>
              <input
                type="email"
                value={invite.email}
                readOnly
                className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface-variant"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono-label text-[10px] uppercase tracking-wide text-on-surface-variant">
                Your name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                autoComplete="new-password"
                required
                minLength={8}
                className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
              />
            </label>

            {submitError ? (
              <p className="text-body-sm rounded-lg border border-[#DD6974]/40 bg-[#DD6974]/10 px-3 py-2 text-[#DD6974]">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-50"
            >
              {pending ? "Please wait…" : "Create account & join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
