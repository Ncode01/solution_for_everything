"use client";

import type { ReactNode } from "react";
import { colors, shellVariants } from "@/design-system";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { DetailPanel } from "./DetailPanel";

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden ${colors.bg.base}`}>
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={shellVariants.main}>{children}</main>
        <DetailPanel />
      </div>
    </div>
  );
}
