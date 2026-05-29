"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getFirestoreDb, isFirebaseConfigured } from "./config";
import { useCanvasStore } from "@/stores/canvas.store";
import { logOnce, logDevOnce } from "@/lib/diagnostics";
import type { TaskCardNodeData } from "@/types";
import type { ApiTask, OrgGraphResponse } from "@/lib/api/types";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";
const SESSION_START_KEY = "flowcanvas:events:sessionStart";

interface UseCanvasEventsOptions {
  listen?: boolean;
}

function getOrCreateSessionStart(): { ms: number; source: "persisted" | "fresh" } {
  if (typeof sessionStorage === "undefined") {
    return { ms: Date.now(), source: "fresh" };
  }
  const stored = sessionStorage.getItem(SESSION_START_KEY);
  if (stored) {
    const ms = Number(stored);
    if (!Number.isNaN(ms)) {
      return { ms, source: "persisted" };
    }
  }
  const ms = Date.now();
  sessionStorage.setItem(SESSION_START_KEY, String(ms));
  return { ms, source: "fresh" };
}

function eventTimestampMs(event: Record<string, unknown>): number {
  const ts = event.timestamp as Timestamp | undefined;
  if (ts && typeof ts.toMillis === "function") {
    return ts.toMillis();
  }
  return Date.now();
}

export function useCanvasEvents(options: UseCanvasEventsOptions = {}) {
  const { listen = true } = options;
  const queryClient = useQueryClient();
  const sessionStartRef = useRef<number | null>(null);

  if (sessionStartRef.current === null) {
    const { ms, source } = getOrCreateSessionStart();
    sessionStartRef.current = ms;
    logDevOnce(
      "canvas-events-session",
      `[CanvasEvents] session marker (${source}): ${new Date(ms).toISOString()}`,
    );
  }

  useEffect(() => {
    if (!listen || !ORG_ID || !isFirebaseConfigured()) return;

    const db = getFirestoreDb();
    if (!db) return;

    logDevOnce(
      "canvas-events-listener",
      "[CanvasEvents] Firestore listener initialized",
    );

    const setNodes = useCanvasStore.getState().setNodes;
    const setEdges = useCanvasStore.getState().setEdges;
    const sessionStart = sessionStartRef.current ?? Date.now();

    const eventsRef = collection(db, "orgs", ORG_ID, "events");
    const recentQuery = query(
      eventsRef,
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      recentQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const event = change.doc.data() as {
            type?: string;
            taskId?: string;
            payload?: Record<string, unknown> & {
              status?: string;
              task?: ApiTask;
            };
            timestamp?: Timestamp;
          };

          if (!event.type || !event.taskId) return;

          const eventMs = eventTimestampMs(
            event as Record<string, unknown>,
          );
          const isNewSinceSession = eventMs >= sessionStart - 2_000;

          if (!isNewSinceSession) {
            logDevOnce(
              `canvas-events-old-${event.type}`,
              `[CanvasEvents] ignored old event: ${event.type} (before session start)`,
            );
          }

          switch (event.type) {
            case "task_status_changed": {
              if (!isNewSinceSession) break;
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
              if (isNewSinceSession) {
                void queryClient.invalidateQueries({
                  queryKey: ["org-graph", ORG_ID],
                });
              }
              break;
            case "dependency_added":
            case "dependency_removed":
              if (isNewSinceSession) {
                void queryClient.invalidateQueries({
                  queryKey: ["org-graph", ORG_ID],
                });
              }
              break;
            case "task_updated": {
              const apiTask = event.payload?.task as ApiTask | undefined;
              if (!apiTask) {
                logDevOnce(
                  "canvas-events-task-updated-empty",
                  "[CanvasEvents] task_updated ignored: empty payload",
                );
                break;
              }
              if (!isNewSinceSession) break;

              queryClient.setQueryData<OrgGraphResponse>(
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
              break;
            }
            case "task_archived": {
              if (!isNewSinceSession) break;
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
              queryClient.setQueryData<OrgGraphResponse>(
                ["org-graph", ORG_ID],
                (prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    tasks: prev.tasks.filter((t) => t.id !== event.taskId),
                  };
                },
              );
              break;
            }
            default:
              break;
          }
        });
      },
      (error) => {
        logOnce(
          "canvas-events-firestore-error",
          `[CanvasEvents] Firestore unavailable — realtime events disabled: ${error.code}`,
        );
      },
    );

    return () => unsubscribe();
  }, [listen, queryClient]);

  const publishEvent = useCallback(
    async (
      type: string,
      taskId: string,
      payload: Record<string, unknown>,
    ) => {
      if (!ORG_ID || !isFirebaseConfigured()) return;
      const db = getFirestoreDb();
      if (!db) return;

      const session = await authClient.getSession();
      await addDoc(collection(db, "orgs", ORG_ID, "events"), {
        type,
        taskId,
        payload,
        timestamp: serverTimestamp(),
        userId: session?.data?.user?.id ?? "unknown",
      });
    },
    [],
  );

  return { publishEvent };
}
