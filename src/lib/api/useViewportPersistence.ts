"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { applyCanvasViewport, fitCanvasView } from "@/lib/canvas/reactFlowApi";
import { logOnce } from "@/lib/diagnostics";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

function logViewportFailure(
  operation: "load" | "save",
  err: unknown,
): void {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "UNAUTHORIZED") {
    logOnce(
      `viewport-${operation}-401`,
      `[ViewportPersistence] 401 on ${operation}Viewport, continuing without persistence`,
    );
    return;
  }
  if (message.includes("404") || message.toLowerCase().includes("not found")) {
    logOnce(
      `viewport-${operation}-404`,
      `[ViewportPersistence] 404 on ${operation}Viewport, continuing without persistence`,
    );
    return;
  }
  logOnce(
    `viewport-${operation}-network`,
    `[ViewportPersistence] ${operation}Viewport failed (${message}), continuing without persistence`,
  );
}

export function useViewportPersistence(graphReady: boolean) {
  const viewport = useCanvasStore((s) => s.viewport);
  const setSkipInitialFitView = useUIStore((s) => s.setSkipInitialFitView);
  const { data: session } = authClient.useSession();
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewportQuery = useQuery({
    queryKey: ["canvas-viewport", ORG_ID, session?.user?.id],
    queryFn: async () => {
      try {
        return await apiClient.getViewport(ORG_ID, session!.user.id);
      } catch (err) {
        logViewportFailure("load", err);
        return null;
      }
    },
    enabled: graphReady && Boolean(session?.user?.id && ORG_ID),
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    if (!graphReady || restoredRef.current || !session?.user?.id || !ORG_ID) {
      return;
    }
    if (viewportQuery.isLoading) return;

    void (async () => {
      try {
        const saved = viewportQuery.data ?? null;
        if (saved) {
          await applyCanvasViewport({
            x: saved.viewportX,
            y: saved.viewportY,
            zoom: saved.viewportZoom,
          });
          setSkipInitialFitView(true);
        } else {
          void fitCanvasView();
        }
      } catch {
        void fitCanvasView();
      } finally {
        restoredRef.current = true;
      }
    })();
  }, [
    graphReady,
    session?.user?.id,
    setSkipInitialFitView,
    viewportQuery.data,
    viewportQuery.isLoading,
  ]);

  useEffect(() => {
    if (!restoredRef.current || !session?.user?.id || !ORG_ID) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      void apiClient
        .saveViewport(ORG_ID, {
          authUserId: session.user!.id,
          viewportX: viewport.x,
          viewportY: viewport.y,
          viewportZoom: viewport.zoom,
        })
        .catch((err) => {
          logViewportFailure("save", err);
        });
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [viewport, session?.user?.id]);
}
