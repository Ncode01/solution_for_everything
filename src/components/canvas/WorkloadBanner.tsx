"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, X } from "lucide-react";
import { useWorkloadLayer } from "@/lib/canvas/useWorkloadLayer";
import { MOCK_USERS } from "@/lib/seed/mockData";

export function WorkloadBanner() {
  const { isWorkloadActive, toggleWorkloadLayer } = useWorkloadLayer();

  const overloadedCount = MOCK_USERS.filter(
    (u) => u.loadLevel === "overloaded",
  ).length;
  const atCapacityCount = MOCK_USERS.filter(
    (u) => u.loadLevel === "at_capacity",
  ).length;

  return (
    <AnimatePresence>
      {isWorkloadActive && (
        <motion.div
          key="workload-banner"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="pointer-events-auto absolute top-2 left-1/2 z-30 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-surface-container px-4 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <Users size={13} className="text-primary" />
            <span className="text-body-sm text-on-surface">Workload View</span>
            <div className="mx-1 h-4 w-px bg-white/10" />
            {overloadedCount > 0 && (
              <span className="font-mono-label text-[10px] text-[#DD6974]">
                {overloadedCount} overloaded
              </span>
            )}
            {atCapacityCount > 0 && (
              <span className="font-mono-label ml-1 text-[10px] text-[#E8AF34]">
                {atCapacityCount} at capacity
              </span>
            )}
            <button
              type="button"
              onClick={toggleWorkloadLayer}
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white/10"
              aria-label="Exit workload view"
            >
              <X size={11} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
