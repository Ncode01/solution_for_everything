"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "./client";
import { useCanvasStore } from "@/stores/canvas.store";
import { useUIStore } from "@/stores/ui.store";
import { applyCanvasViewport, fitCanvasView } from "@/lib/canvas/reactFlowApi";

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID ?? "";

export function useViewportPersistence(graphReady: boolean) {
  const viewport = useCanvasStore((s) => s.viewport);
  const setSkipInitialFitView = useUIStore((s) => s.setSkipInitialFitView);
  const { data: session } = authClient.useSession();
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!graphReady || restoredRef.current || !session?.user?.id || !ORG_ID) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const saved = await apiClient.getViewport(ORG_ID, session.user.id);
        if (cancelled) return;
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
        if (!cancelled) void fitCanvasView();
      } finally {
        restoredRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [graphReady, session?.user?.id, setSkipInitialFitView]);

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
        .catch(() => undefined);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [viewport, session?.user?.id]);
}
