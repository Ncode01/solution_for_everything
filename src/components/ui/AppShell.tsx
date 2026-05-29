"use client";

import { useUIStore } from "@/stores/ui.store";
import { RootLayout } from "@/components/layout/RootLayout";
import { CanvasView } from "@/components/views/CanvasView";
import { TasksView } from "@/components/views/TasksView";
import { PosterBoardView } from "@/components/views/PosterBoardView";
import { BudgetView } from "@/components/views/BudgetView";
import { TeamView } from "@/components/views/TeamView";
import { SchoolsView } from "@/components/views/SchoolsView";
import { GanttView } from "@/components/views/GanttView";
import { DashboardView } from "@/components/views/DashboardView";
import { GlobalCommandOrchestrator } from "./GlobalCommandOrchestrator";
import { CommandPalette } from "@/components/panels/CommandPalette";
import { useCanvasEvents } from "@/lib/firebase/useCanvasEvents";
import { useOrgGraph } from "@/lib/api/useOrgGraph";
import { PresenceOrchestrator } from "./PresenceOrchestrator";
import { KeyboardHelpModal } from "@/components/panels/KeyboardHelpModal";
import { SettingsView } from "@/components/views/SettingsView";
import { ToastContainer } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { ProductionBootstrap } from "./ProductionBootstrap";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function CanvasEventListener() {
  useCanvasEvents();
  return null;
}

function OrgGraphHydrator() {
  useOrgGraph();
  return null;
}

function MainView() {
  const activeView = useUIStore((s) => s.activeView);

  switch (activeView) {
    case "canvas":
      return (
        <ErrorBoundary fallbackLabel="Canvas failed to load">
          <CanvasView />
        </ErrorBoundary>
      );
    case "tasks":
      return (
        <ErrorBoundary fallbackLabel="Tasks view failed to load">
          <TasksView />
        </ErrorBoundary>
      );
    case "posters":
      return (
        <ErrorBoundary fallbackLabel="Poster board failed to load">
          <PosterBoardView />
        </ErrorBoundary>
      );
    case "budget":
      return (
        <ErrorBoundary fallbackLabel="Budget view failed to load">
          <BudgetView />
        </ErrorBoundary>
      );
    case "team":
      return (
        <ErrorBoundary fallbackLabel="Team view failed to load">
          <TeamView />
        </ErrorBoundary>
      );
    case "schools":
      return (
        <ErrorBoundary fallbackLabel="Schools view failed to load">
          <SchoolsView />
        </ErrorBoundary>
      );
    case "gantt":
      return (
        <ErrorBoundary fallbackLabel="Gantt view failed to load">
          <GanttView />
        </ErrorBoundary>
      );
    case "dashboard":
      return (
        <ErrorBoundary fallbackLabel="Dashboard failed to load">
          <DashboardView />
        </ErrorBoundary>
      );
    case "settings":
      return (
        <ErrorBoundary fallbackLabel="Settings failed to load">
          <SettingsView />
        </ErrorBoundary>
      );
    default:
      return (
        <ErrorBoundary fallbackLabel="Canvas failed to load">
          <CanvasView />
        </ErrorBoundary>
      );
  }
}

export function AppShell() {
  useKeyboardShortcuts();

  return (
    <>
      <OrgGraphHydrator />
      <ProductionBootstrap />
      <GlobalCommandOrchestrator />
      <PresenceOrchestrator />
      <CanvasEventListener />
      <CommandPalette />
      <KeyboardHelpModal />
      <ToastContainer />
      <RootLayout>
        <MainView />
      </RootLayout>
    </>
  );
}
