"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { usePresence } from "@/lib/firebase/usePresence";
import { useUIStore } from "@/stores/ui.store";

export function PresenceOrchestrator() {
  const { data: session } = authClient.useSession();
  const setPresenceUsers = useUIStore((s) => s.setPresenceUsers);
  const setBroadcastCursor = useUIStore((s) => s.setBroadcastCursor);
  const setBroadcastViewport = useUIStore((s) => s.setBroadcastViewport);

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? "Unknown",
        initials: (session.user.name ?? "U")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }
    : null;

  const { presenceUsers, broadcastCursor, broadcastViewport } =
    usePresence(currentUser);

  useEffect(() => {
    setPresenceUsers(presenceUsers);
  }, [presenceUsers, setPresenceUsers]);

  useEffect(() => {
    setBroadcastCursor(() => broadcastCursor);
  }, [broadcastCursor, setBroadcastCursor]);

  useEffect(() => {
    setBroadcastViewport(() => broadcastViewport);
  }, [broadcastViewport, setBroadcastViewport]);

  return null;
}
