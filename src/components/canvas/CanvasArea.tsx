"use client";

import { CanvasWrapper } from "./CanvasWrapper";

export function CanvasArea() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <CanvasWrapper />
    </div>
  );
}
