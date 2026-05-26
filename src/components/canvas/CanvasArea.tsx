"use client";

import { CanvasWrapper } from "./CanvasWrapper";
import { CascadePanel } from "@/components/panels/CascadePanel";
import { WorkloadBanner } from "./WorkloadBanner";

export function CanvasArea() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <CanvasWrapper />
      <CascadePanel />
      <WorkloadBanner />
    </div>
  );
}
