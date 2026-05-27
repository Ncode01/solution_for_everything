"use client";

import { Bell, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { useWorkloadLayer } from "@/lib/canvas/useWorkloadLayer";
import { authClient } from "@/lib/auth-client";
import { FlowCanvasLogo } from "./FlowCanvasLogo";

const VIEWS = [
  { id: "canvas" as const, label: "Canvas" },
  { id: "dashboard" as const, label: "Dashboard" },
  { id: "gantt" as const, label: "Gantt" },
];

export function TopBar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const { toggleWorkloadLayer, isWorkloadActive } = useWorkloadLayer();

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "FC";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-surface-container px-4">
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

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="text-on-surface-variant hover:text-on-surface"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>

        <div
          className="text-body-sm flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container font-bold text-on-tertiary-container"
          aria-label={session?.user?.name ?? "Signed in user"}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
