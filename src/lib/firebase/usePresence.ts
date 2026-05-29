"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MutableRefObject,
} from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "./config";
import { useUIStore } from "@/stores/ui.store";
import { logOnce } from "@/lib/diagnostics";
import { getEffectiveOrgId } from "@/lib/api/orgId";

export interface PresenceUser {
  userId: string;
  name: string;
  initials: string;
  activeView: string;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  cursorX: number;
  cursorY: number;
  lastSeen: Date;
  isOnline: boolean;
}

function disablePresenceForSession(
  firestoreAvailableRef: MutableRefObject<boolean | null>,
  heartbeatRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
  reason: string,
): void {
  if (firestoreAvailableRef.current === false) return;
  firestoreAvailableRef.current = false;
  if (heartbeatRef.current) {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }
  logOnce(
    "presence-disabled",
    `[Presence] Firestore unavailable, presence disabled (${reason})`,
  );
}

export function usePresence(
  currentUser: { id: string; name: string; initials: string } | null,
) {
  const activeView = useUIStore((s) => s.activeView);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCursorWriteRef = useRef<number>(0);
  const lastViewportWriteRef = useRef<number>(0);
  const firestoreAvailableRef = useRef<boolean | null>(null);

  const writePresence = useCallback(
    async (
      extra: Partial<{
        viewportX: number;
        viewportY: number;
        viewportZoom: number;
        cursorX: number;
        cursorY: number;
      }> = {},
    ) => {
      const orgId = getEffectiveOrgId();
      if (!currentUser || !orgId || !isFirebaseConfigured()) return;
      if (firestoreAvailableRef.current === false) return;
      const db = getFirestoreDb();
      if (!db) return;

      const ref = doc(db, "orgs", orgId, "presence", currentUser.id);
      await setDoc(
        ref,
        {
          userId: currentUser.id,
          name: currentUser.name,
          initials: currentUser.initials,
          activeView,
          viewportX: extra.viewportX ?? 0,
          viewportY: extra.viewportY ?? 0,
          viewportZoom: extra.viewportZoom ?? 1,
          cursorX: extra.cursorX ?? 0,
          cursorY: extra.cursorY ?? 0,
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [currentUser, activeView],
  );

  useEffect(() => {
    const orgId = getEffectiveOrgId();
    if (!currentUser || !orgId || !isFirebaseConfigured()) return;

    void writePresence().catch(() => {
      disablePresenceForSession(
        firestoreAvailableRef,
        heartbeatRef,
        "initial write failed",
      );
    });

    heartbeatRef.current = setInterval(() => {
      void writePresence().catch(() => {
        disablePresenceForSession(
          firestoreAvailableRef,
          heartbeatRef,
          "heartbeat write failed",
        );
      });
    }, 30_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (firestoreAvailableRef.current === false) return;
      const db = getFirestoreDb();
      if (!db) return;
      const ref = doc(db, "orgs", orgId, "presence", currentUser.id);
      deleteDoc(ref).catch(() => {});
    };
  }, [currentUser, writePresence]);

  useEffect(() => {
    const orgId = getEffectiveOrgId();
    if (!orgId || !isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    if (!db) return;

    const ref = collection(db, "orgs", orgId, "presence");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        firestoreAvailableRef.current = true;
        const now = Date.now();
        const users: PresenceUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const lastSeen =
            data.lastSeen instanceof Timestamp
              ? data.lastSeen.toDate()
              : new Date(0);
          if (data.userId === currentUser?.id) return;
          users.push({
            userId: String(data.userId),
            name: String(data.name ?? ""),
            initials: String(data.initials ?? "??"),
            activeView: String(data.activeView ?? "canvas"),
            viewportX: Number(data.viewportX ?? 0),
            viewportY: Number(data.viewportY ?? 0),
            viewportZoom: Number(data.viewportZoom ?? 1),
            cursorX: Number(data.cursorX ?? 0),
            cursorY: Number(data.cursorY ?? 0),
            lastSeen,
            isOnline: now - lastSeen.getTime() < 60_000,
          });
        });
        const recentCutoff = 30 * 60_000;
        setPresenceUsers(
          users.filter((u) => now - u.lastSeen.getTime() < recentCutoff),
        );
      },
      (error) => {
        disablePresenceForSession(
          firestoreAvailableRef,
          heartbeatRef,
          error.code,
        );
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  const broadcastCursor = useCallback(
    (canvasX: number, canvasY: number) => {
      if (firestoreAvailableRef.current === false) return;
      const now = Date.now();
      if (now - lastCursorWriteRef.current < 2_000) return;
      lastCursorWriteRef.current = now;
      void writePresence({ cursorX: canvasX, cursorY: canvasY }).catch(() => {
        disablePresenceForSession(
          firestoreAvailableRef,
          heartbeatRef,
          "cursor write failed",
        );
      });
    },
    [writePresence],
  );

  const broadcastViewport = useCallback(
    (x: number, y: number, zoom: number) => {
      if (firestoreAvailableRef.current === false) return;
      const now = Date.now();
      if (now - lastViewportWriteRef.current < 5_000) return;
      lastViewportWriteRef.current = now;
      void writePresence({ viewportX: x, viewportY: y, viewportZoom: zoom }).catch(
        () => {
          disablePresenceForSession(
            firestoreAvailableRef,
            heartbeatRef,
            "viewport write failed",
          );
        },
      );
    },
    [writePresence],
  );

  return { presenceUsers, broadcastCursor, broadcastViewport };
}
