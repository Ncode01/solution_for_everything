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
import { useQueryClient } from "@tanstack/react-query";
import { getFirestoreDb, isFirebaseConfigured } from "./config";
import { useCanvasStore } from "@/stores/canvas.store";
import type { TaskCardNodeData } from "@/types";
import type { ApiTask } from "@/lib/api/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

interface UseCanvasEventsOptions {
  listen?: boolean;
}

export function useCanvasEvents(options: UseCanvasEventsOptions = {}) {
  const { listen = true } = options;
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listen || !ORG_ID || !isFirebaseConfigured()) return;

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
          payload?: Record<string, unknown> & { status?: string; task?: ApiTask };
        };

        if (!event.type || !event.taskId) return;

        switch (event.type) {
          case "task_status_changed": {
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
            break;
          }
          case "task_created":
          case "dependency_added":
          case "dependency_removed":
            void queryClient.invalidateQueries({
              queryKey: ["org-graph", ORG_ID],
            });
            break;
          case "task_updated": {
            const apiTask = event.payload?.task as ApiTask | undefined;
            if (apiTask) {
              queryClient.setQueryData<import("@/lib/api/types").OrgGraphResponse>(
                ["org-graph", ORG_ID],
                (prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    tasks: prev.tasks.map((t) =>
                      t.id === apiTask.id ? { ...t, ...apiTask } : t,
                    ),
                  };
                },
              );
              setNodes((nodes) =>
                nodes.map((node) => {
                  if (node.id !== `task-${event.taskId}`) return node;
                  const data = node.data as TaskCardNodeData;
                  return {
                    ...node,
                    data: {
                      ...data,
                      task: { ...data.task, ...apiTask },
                    },
                  };
                }),
              );
            } else {
              void queryClient.invalidateQueries({
                queryKey: ["org-graph", ORG_ID],
              });
            }
            break;
          }
          case "task_archived": {
            setNodes((nodes) =>
              nodes.filter((n) => n.id !== `task-${event.taskId}`),
            );
            setEdges((edges) =>
              edges.filter(
                (e) =>
                  e.source !== `task-${event.taskId}` &&
                  e.target !== `task-${event.taskId}`,
              ),
            );
            void queryClient.invalidateQueries({
              queryKey: ["org-graph", ORG_ID],
            });
            break;
          }
          default:
            break;
        }
      });
    });

    return () => unsubscribe();
  }, [listen, setNodes, setEdges, queryClient]);

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
