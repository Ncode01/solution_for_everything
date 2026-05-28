"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

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

export function usePresence(
  currentUser: { id: string; name: string; initials: string } | null,
) {
  const activeView = useUIStore((s) => s.activeView);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCursorWriteRef = useRef<number>(0);
  const lastViewportWriteRef = useRef<number>(0);
  const firestoreAvailableRef = useRef<boolean | null>(null); // null=unknown, false=unavailable

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
      if (!currentUser || !ORG_ID || !isFirebaseConfigured()) return;
      if (firestoreAvailableRef.current === false) return; // already known unavailable
      const db = getFirestoreDb();
      if (!db) return;

      const ref = doc(db, "orgs", ORG_ID, "presence", currentUser.id);
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

  // Heartbeat — write presence on mount and every 30s
  useEffect(() => {
    if (!currentUser || !ORG_ID || !isFirebaseConfigured()) return;

    void writePresence().catch(() => {
      firestoreAvailableRef.current = false;
    });

    heartbeatRef.current = setInterval(() => {
      void writePresence().catch(() => {
        firestoreAvailableRef.current = false;
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      });
    }, 30_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (firestoreAvailableRef.current === false) return; // don't try to delete if unavailable
      const db = getFirestoreDb();
      if (!db) return;
      const ref = doc(db, "orgs", ORG_ID, "presence", currentUser.id);
      deleteDoc(ref).catch(() => {});
    };
  }, [currentUser, writePresence]);

  // Listen to other users' presence
  useEffect(() => {
    if (!ORG_ID || !isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    if (!db) return;

    const ref = collection(db, "orgs", ORG_ID, "presence");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        firestoreAvailableRef.current = true; // confirmed working
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
        setPresenceUsers(users.filter((u) => u.isOnline));
      },
      (error) => {
        // Firestore unavailable (not created, wrong project, missing env vars)
        // Fail silently — presence is a non-critical feature
        firestoreAvailableRef.current = false;
        console.warn("[Presence] Firestore unavailable — presence disabled:", error.code);
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
      void writePresence({ cursorX: canvasX, cursorY: canvasY }).catch(() => {});
    },
    [writePresence],
  );

  const broadcastViewport = useCallback(
    (x: number, y: number, zoom: number) => {
      if (firestoreAvailableRef.current === false) return;
      const now = Date.now();
      if (now - lastViewportWriteRef.current < 5_000) return;
      lastViewportWriteRef.current = now;
      void writePresence({ viewportX: x, viewportY: y, viewportZoom: zoom }).catch(() => {});
    },
    [writePresence],
  );

  return { presenceUsers, broadcastCursor, broadcastViewport };
}
