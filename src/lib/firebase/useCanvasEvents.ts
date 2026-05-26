"use client";

import { useEffect, useCallback } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "./config";
import { useCanvasStore } from "@/stores/canvas.store";
import type { TaskCardNodeData } from "@/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useCanvasEvents() {
  const setNodes = useCanvasStore((s) => s.setNodes);

  useEffect(() => {
    if (!ORG_ID || !isFirebaseConfigured()) return;

    const db = getFirestoreDb();
    if (!db) return;

    const eventsRef = collection(db, "orgs", ORG_ID, "events");
    const recentQuery = query(
      eventsRef,
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(recentQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const event = change.doc.data() as {
          type?: string;
          taskId?: string;
          payload?: { status?: string };
        };

        if (event.type === "task_status_changed" && event.taskId) {
          setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id !== `task-${event.taskId}`) return node;
              const data = node.data as TaskCardNodeData;
              return {
                ...node,
                data: {
                  ...data,
                  task: {
                    ...data.task,
                    status:
                      (event.payload?.status as TaskCardNodeData["task"]["status"]) ??
                      data.task.status,
                  },
                },
              };
            }),
          );
        }
      });
    });

    return () => unsubscribe();
  }, [setNodes]);

  const publishEvent = useCallback(
    async (
      type: string,
      taskId: string,
      payload: Record<string, unknown>,
    ) => {
      if (!ORG_ID || !isFirebaseConfigured()) return;
      const db = getFirestoreDb();
      if (!db) return;

      await addDoc(collection(db, "orgs", ORG_ID, "events"), {
        type,
        taskId,
        payload,
        timestamp: serverTimestamp(),
        userId: "local",
      });
    },
    [],
  );

  return { publishEvent };
}
