"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Copy, LogOut, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { useWorkloadLayer } from "@/lib/canvas/useWorkloadLayer";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/api/useCurrentUser";
import { getUserColor } from "@/lib/presence/userColor";
import { FlowCanvasLogo } from "./FlowCanvasLogo";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

const VIEWS = [
  { id: "canvas" as const, label: "Canvas" },
  { id: "dashboard" as const, label: "Dashboard" },
  { id: "gantt" as const, label: "Gantt" },
];

export function TopBar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { domainUser, isLinked } = useCurrentUser();

  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const presenceUsers = useUIStore((s) => s.presenceUsers);
  const { toggleWorkloadLayer, isWorkloadActive } = useWorkloadLayer();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const inviteRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const onlineUsers = presenceUsers.filter((u) => u.isOnline);

  const userInitials =
    domainUser?.initials ??
    session?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    "FC";

  const avatarColor = session?.user?.id
    ? getUserColor(session.user.id)
    : "#5591C7";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        inviteRef.current &&
        !inviteRef.current.contains(e.target as Node)
      ) {
        setInviteOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ORG_ID || !inviteEmail.trim()) return;
    setInviteError(null);
    setInvitePending(true);
    setInviteUrl(null);
    try {
      const res = await apiClient.createInvite(
        ORG_ID,
        inviteEmail.trim(),
        inviteRole,
      );
      setInviteUrl(res.inviteUrl);
    } catch (err: unknown) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to create invite",
      );
    } finally {
      setInvitePending(false);
    }
  };

  const handleCopyLink = useCallback(async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopyDone(true);
    window.setTimeout(() => setCopyDone(false), 2000);
  }, [inviteUrl]);

  const resetInviteForm = () => {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("member");
    setInviteUrl(null);
    setInviteError(null);
  };

  return (
    <header className="relative flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-surface-container px-4">
      <div className="flex items-center">
        <FlowCanvasLogo />
        <span className="text-headline-sm ml-2 font-semibold text-on-surface">
          FlowCanvas
        </span>
      </div>

      <nav
        className="flex rounded-full border border-white/5 bg-surface-container-highest p-1"
        aria-label="Main views"
      >
        {VIEWS.map((view) => {
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={
                isActive
                  ? "text-body-sm rounded-full bg-primary/10 px-4 py-1.5 font-medium text-primary"
                  : "text-body-sm rounded-full px-4 py-1.5 text-on-surface-variant hover:bg-white/5"
              }
            >
              {view.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {onlineUsers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono-label text-[10px] text-on-surface-variant">
              {onlineUsers.length} online
            </span>
            <div className="flex">
              {onlineUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.userId}
                  title={`${u.name} — ${u.activeView}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0E0D0C] text-[9px] font-bold text-white"
                  style={{
                    background: getUserColor(u.userId),
                    marginLeft: i > 0 ? -8 : 0,
                  }}
                >
                  {u.initials}
                </div>
              ))}
              {onlineUsers.length > 4 ? (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0E0D0C] bg-surface-container-high text-[9px] text-on-surface-variant"
                  style={{ marginLeft: -8 }}
                >
                  +{onlineUsers.length - 4}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleWorkloadLayer}
          className={[
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
            isWorkloadActive
              ? "border border-primary/30 bg-primary/20 text-primary"
              : "border border-white/10 bg-surface-container-low text-on-surface-variant hover:bg-white/5",
          ].join(" ")}
          aria-label="Toggle workload layer"
        >
          <Users size={13} />
          <span>Workload</span>
        </button>

        <div className="relative" ref={inviteRef}>
          <button
            type="button"
            onClick={() => {
              setInviteOpen((o) => !o);
              setUserMenuOpen(false);
            }}
            className="text-body-sm flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-on-surface-variant hover:bg-white/5"
          >
            <UserPlus size={14} />
            Invite
          </button>

          {inviteOpen ? (
            <div className="absolute top-full right-0 z-50 mt-2 w-[320px] rounded-xl border border-white/[0.08] bg-surface-container-high p-4 shadow-lg">
              {inviteUrl ? (
                <div className="flex flex-col gap-3">
                  <p className="text-body-sm font-medium text-on-surface">
                    Invite link ready
                  </p>
                  <p className="text-body-sm break-all rounded-lg border border-white/10 bg-surface-container px-2 py-2 text-on-surface-variant">
                    {inviteUrl}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyLink()}
                      className="text-body-sm flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-on-surface hover:bg-white/5"
                    >
                      <Copy size={14} />
                      {copyDone ? "Copied" : "Copy Link"}
                    </button>
                    <button
                      type="button"
                      onClick={resetInviteForm}
                      className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite} className="flex flex-col gap-3">
                  <p className="text-body-sm font-medium text-on-surface">
                    Invite member
                  </p>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@company.com"
                    required
                    className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="text-body-sm rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-on-surface outline-none focus:border-primary"
                  >
                    <option value="member">Member</option>
                    <option value="lead">Lead</option>
                  </select>
                  {inviteError ? (
                    <p className="text-body-sm text-error">{inviteError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={invitePending || !ORG_ID}
                    className="text-body-sm rounded-lg bg-primary px-4 py-2 font-medium text-on-primary disabled:opacity-50"
                  >
                    {invitePending ? "Creating…" : "Send Invite"}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={openCommandPalette}
          className="font-mono-label text-mono-label cursor-pointer rounded-lg border border-white/10 bg-surface-container-low px-2 py-1 text-on-surface-variant hover:bg-white/5"
        >
          ⌘K
        </button>

        <button
          type="button"
          className="relative text-on-surface-variant hover:text-on-surface"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-error" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((o) => !o);
              setInviteOpen(false);
            }}
            className="text-body-sm flex h-8 w-8 items-center justify-center rounded-full font-bold text-white"
            style={{ backgroundColor: avatarColor }}
            aria-label={session?.user?.name ?? "Signed in user"}
            title={
              !isLinked
                ? "Complete setup — accept an invite to link your profile"
                : domainUser?.name
            }
          >
            {userInitials}
          </button>

          {userMenuOpen ? (
            <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-white/[0.08] bg-surface-container-high py-1 shadow-lg">
              {!isLinked ? (
                <p className="text-body-sm border-b border-white/5 px-3 py-2 text-[#E8AF34]">
                  Complete setup
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setInviteOpen(true);
                }}
                className="text-body-sm flex w-full items-center gap-2 px-3 py-2 text-left text-on-surface-variant hover:bg-white/5"
              >
                <UserPlus size={14} />
                Invite Member
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="text-body-sm flex w-full items-center gap-2 px-3 py-2 text-left text-on-surface-variant hover:bg-white/5"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
