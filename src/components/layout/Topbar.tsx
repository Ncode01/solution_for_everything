"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Copy,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { shellVariants, buttonVariants, colors, typography } from "@/design-system";
import { skeletonVariants } from "@/design-system/components";
import { useUIStore } from "@/stores/ui.store";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { useCurrentUser } from "@/lib/api/useCurrentUser";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/lib/api/client";
import { getUserColor } from "@/lib/presence/userColor";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { getEffectiveOrgId } from "@/lib/api/orgId";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function Topbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { domainUser, isLinked } = useCurrentUser();
  const graph = useOrgGraphData();
  const { open: openCommandPalette } = useCommandPalette();

  const openTaskCreate = useUIStore((s) => s.openTaskCreate);
  const presenceUsers = useUIStore((s) => s.presenceUsers);
  const invitePanelRequested = useUIStore((s) => s.invitePanelRequested);
  const clearInvitePanelRequest = useUIStore((s) => s.clearInvitePanelRequest);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [presenceOpen, setPresenceOpen] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const inviteRef = useRef<HTMLDivElement>(null);
  const presenceRef = useRef<HTMLDivElement>(null);

  const orgName = graph.data?.org.name ?? null;
  const orgError = graph.isError
    ? graph.error instanceof Error
      ? graph.error.message
      : "Org error"
    : null;
  const onlineUsers = presenceUsers.filter((u) => u.isOnline);
  const offlineUsers = presenceUsers.filter((u) => !u.isOnline);
  const onlineCount = onlineUsers.length;
  const notificationCount = 0;

  const userInitials =
    domainUser?.initials ??
    session?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ??
    "CC";

  const avatarColor = session?.user?.id
    ? getUserColor(session.user.id)
    : rawAvatarFallback();

  useEffect(() => {
    if (invitePanelRequested) {
      setUserMenuOpen(false);
      setInviteOpen(true);
      clearInvitePanelRequest();
    }
  }, [invitePanelRequested, clearInvitePanelRequest]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (inviteRef.current && !inviteRef.current.contains(e.target as Node)) {
        setInviteOpen(false);
      }
      if (
        presenceRef.current &&
        !presenceRef.current.contains(e.target as Node)
      ) {
        setPresenceOpen(false);
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
    const orgId = getEffectiveOrgId();
    if (!orgId || !inviteEmail.trim()) return;
    setInviteError(null);
    setInvitePending(true);
    setInviteUrl(null);
    try {
      const res = await apiClient.createInvite(
        orgId,
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

  return (
    <header className={shellVariants.topbar}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={`${typography.scale.lg.class} ${colors.text.primary}`}>
          Command Center
        </span>
        <span
          className={`${typography.scale.xs.class} ${colors.bg.elevated} ${colors.border.default} flex items-center gap-1 truncate rounded-full border px-2.5 py-0.5 max-w-[220px] min-h-[22px]`}
          title={
            graph.data
              ? `${orgName} · ${graph.data.org.id}`
              : orgError ?? undefined
          }
        >
          {orgName === null && !orgError ? (
            <span
              className={`${skeletonVariants.base} block h-4 w-20`}
              aria-hidden
            />
          ) : orgError !== null ? (
            <>
              <span
                className={`truncate ${colors.text.tertiary}`}
                title={`Error: ${orgError} (ORG_ID: ${process.env.NEXT_PUBLIC_ORG_ID ?? "unset"})`}
              >
                {graph.isFetching
                  ? "Retrying…"
                  : orgError === "NEXT_PUBLIC_ORG_ID is not set"
                    ? "ORG_ID unset"
                    : "Org not found"}
              </span>
              {orgError !== "NEXT_PUBLIC_ORG_ID is not set" ? (
                <button
                  type="button"
                  onClick={() => graph.refetch()}
                  className="shrink-0 text-[#E8AF34] hover:text-[#F5C04A]"
                  aria-label="Retry loading org"
                  title="Retry"
                >
                  <RefreshCw
                    size={12}
                    className={graph.isFetching ? "animate-spin" : undefined}
                  />
                </button>
              ) : null}
            </>
          ) : orgName ? (
            <span className={`truncate ${colors.text.secondary}`}>{orgName}</span>
          ) : (
            <span className={colors.text.tertiary}>No org</span>
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={openCommandPalette}
        className={`mx-4 hidden max-w-md flex-1 items-center gap-2 rounded-lg border px-3 py-2 md:flex ${colors.bg.elevated} ${colors.border.subtle} ${colors.text.tertiary} hover:bg-[#1F1F2E]`}
        aria-label="Open command palette"
      >
        <Search size={16} strokeWidth={1.75} />
        <span className={typography.scale.base.class}>
          Search or press ⌘K…
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {presenceUsers.length > 0 ? (
          <div className="relative" ref={presenceRef}>
            <button
              type="button"
              onClick={() => setPresenceOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 ${typography.scale.xs.class} ${colors.text.secondary} hover:bg-white/5`}
              aria-expanded={presenceOpen}
              aria-haspopup="dialog"
              aria-label={`${onlineCount} teammates online`}
            >
              <span className="h-2 w-2 rounded-full bg-[#6DAA45]" aria-hidden />
              {onlineCount} online
            </button>
            {presenceOpen ? (
              <div
                className={`absolute right-0 top-full z-50 mt-2 w-64 py-2 ${colors.bg.elevated} ${colors.border.default} border rounded-lg shadow-lg`}
                role="dialog"
                aria-label="Team presence"
              >
                {onlineUsers.length > 0 ? (
                  <div className="px-2 pb-1">
                    <p className={`${typography.scale.xs.class} px-2 py-1 uppercase tracking-wide ${colors.text.tertiary}`}>
                      Online now
                    </p>
                    {onlineUsers.map((u) => (
                      <div
                        key={u.userId}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: getUserColor(u.userId) }}
                        >
                          {u.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate ${typography.scale.sm.class} ${colors.text.primary}`}>
                            {u.name}
                          </p>
                          <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
                            Online now · {u.activeView}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {offlineUsers.length > 0 ? (
                  <div className="border-t border-white/5 px-2 pt-1">
                    <p className={`${typography.scale.xs.class} px-2 py-1 uppercase tracking-wide ${colors.text.tertiary}`}>
                      Recently active
                    </p>
                    {offlineUsers.map((u) => {
                      const mins = Math.floor(
                        (Date.now() - u.lastSeen.getTime()) / 60_000,
                      );
                      const label =
                        mins < 1
                          ? "Last seen just now"
                          : mins === 1
                            ? "Last seen 1 min ago"
                            : `Last seen ${mins} min ago`;
                      return (
                        <div
                          key={u.userId}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-70"
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: getUserColor(u.userId) }}
                          >
                            {u.initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate ${typography.scale.sm.class} ${colors.text.primary}`}>
                              {u.name}
                            </p>
                            <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
                              {label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className={`relative p-2 ${colors.text.secondary} hover:text-[#F1F1F5]`}
          disabled
          aria-label="Notifications"
          title="Notifications coming soon"
        >
          <Bell size={18} />
          {notificationCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366F1] px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          ) : null}
        </button>

        <div className="relative" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => setQuickAddOpen((o) => !o)}
            className={`flex items-center gap-1.5 ${buttonVariants.primary} px-3 py-1.5`}
            aria-expanded={quickAddOpen}
            aria-haspopup="menu"
          >
            <Plus size={16} />
            <span className={typography.scale.sm.class}>New</span>
          </button>
          {quickAddOpen ? (
            <div
              className={`absolute right-0 top-full z-50 mt-2 w-48 py-1 ${colors.bg.elevated} ${colors.border.default} border rounded-lg shadow-lg`}
              role="menu"
            >
              <QuickAddItem
                label="New Task"
                shortcut="⌘T"
                onClick={() => {
                  setQuickAddOpen(false);
                  openTaskCreate();
                }}
              />
              <QuickAddItem
                label="Open command palette"
                shortcut="⌘K"
                onClick={() => {
                  setQuickAddOpen(false);
                  openCommandPalette();
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((o) => !o);
              setInviteOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: avatarColor }}
            aria-label={session?.user?.name ?? "Account menu"}
            title={!isLinked ? "Complete setup" : domainUser?.name}
          >
            {userInitials}
          </button>
          {userMenuOpen ? (
            <div
              className={`absolute right-0 top-full z-50 mt-2 w-48 py-1 ${colors.bg.elevated} ${colors.border.default} border rounded-lg shadow-lg`}
              role="menu"
            >
              {!isLinked ? (
                <p className={`${typography.scale.sm.class} border-b px-3 py-2 ${colors.status.inReview}`}>
                  Complete setup
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setInviteOpen(true);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 ${typography.scale.sm.class} ${colors.text.secondary} hover:bg-white/5`}
              >
                <UserPlus size={14} />
                Invite Member
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className={`flex w-full items-center gap-2 px-3 py-2 ${typography.scale.sm.class} ${colors.text.secondary} hover:bg-white/5`}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={inviteRef}>
          {inviteOpen ? (
            <div
              className={`absolute right-0 top-full z-50 mt-2 w-[320px] p-4 ${colors.bg.elevated} ${colors.border.default} border rounded-xl shadow-lg`}
              role="dialog"
              aria-label="Invite member"
            >
              {inviteUrl ? (
                <div className="flex flex-col gap-3">
                  <p className={`${typography.scale.sm.class} ${colors.text.primary} font-medium`}>
                    Invite link ready
                  </p>
                  <p className={`${typography.scale.sm.class} break-all rounded-lg border px-2 py-2 ${colors.bg.surface} ${colors.text.secondary}`}>
                    {inviteUrl}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyLink()}
                      className={buttonVariants.ghost}
                    >
                      <Copy size={14} />
                      {copyDone ? "Copied" : "Copy Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteOpen(false)}
                      className={buttonVariants.primary}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateInvite} className="flex flex-col gap-3">
                  <p className={`${typography.scale.sm.class} font-medium ${colors.text.primary}`}>
                    Invite member
                  </p>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@company.com"
                    required
                    className={`w-full rounded-lg border px-3 py-2 ${colors.bg.surface} ${colors.border.default} ${colors.text.primary} ${typography.scale.sm.class} focus:border-[#6366F1] outline-none`}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    aria-label="Invite role"
                    className={`rounded-lg border px-3 py-2 ${colors.bg.surface} ${colors.border.default} ${colors.text.primary} ${typography.scale.sm.class}`}
                  >
                    <option value="member">Member</option>
                    <option value="lead">Lead</option>
                  </select>
                  {inviteError ? (
                    <p className={`${typography.scale.xs.class} ${colors.status.blocked}`}>
                      {inviteError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={invitePending || !getEffectiveOrgId()}
                    className={`${buttonVariants.primary} disabled:opacity-50`}
                  >
                    {invitePending ? "Creating…" : "Send Invite"}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function QuickAddItem({
  label,
  shortcut,
  onClick,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3 py-2 ${typography.scale.sm.class} text-[#F1F1F5] hover:bg-white/5`}
    >
      <span>{label}</span>
      <span className={typography.scale.xs.class + " text-[#5A5A70]"}>{shortcut}</span>
    </button>
  );
}

function rawAvatarFallback(): string {
  return "#6366F1";
}
