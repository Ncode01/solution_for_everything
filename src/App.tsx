import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import Layout from './components/Layout';
import LoginPage from './features/auth/LoginPage';
import PageLoader from './components/PageLoader';

// Eagerly loaded — core pages the user hits immediately
import TodayPage from './features/today/TodayPage';
import ProjectsPage from './features/projects/ProjectsPage';
import ProjectDetailPage from './features/projects/ProjectDetailPage';
import FocusPage from './features/focus/FocusPage';

// Lazy-loaded — large or less-frequently visited routes
const CalendarPage    = lazy(() => import('./features/calendar/CalendarPage'));
const LaunchesPage    = lazy(() => import('./features/launches/LaunchesPage'));
const PeoplePage      = lazy(() => import('./features/people/PeoplePage'));
const MeetingsPage    = lazy(() => import('./features/meetings/MeetingsPage'));
const BudgetPage      = lazy(() => import('./features/budget/BudgetPage'));
const ApprovalsPage   = lazy(() => import('./features/approvals/ApprovalsPage'));
const LibraryPage     = lazy(() => import('./features/library/LibraryPage'));
const SystemPage      = lazy(() => import('./features/system/SystemPage'));
const EventDayPage    = lazy(() => import('./features/event-day/EventDayPage'));

export default function App() {
  const { state, user, logout } = useAuth();

  if (state === 'loading') {
    return <PageLoader message="Loading RCCS OS…" />;
  }

  if (state === 'unauthenticated' || state === 'no-profile') {
    return <LoginPage />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout user={user} onLogout={logout} />}>
          {/* Default → /today */}
          <Route index element={<Navigate to="/today" replace />} />

          {/* Primary routes */}
          <Route path="/today"        element={<TodayPage user={user} />} />
          <Route path="/focus"        element={<FocusPage user={user} />} />
          <Route path="/calendar"     element={<CalendarPage />} />
          <Route path="/projects"     element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/launches"     element={<LaunchesPage />} />
          <Route path="/meetings"     element={<MeetingsPage />} />
          <Route path="/approvals"    element={<ApprovalsPage />} />
          <Route path="/people"       element={<PeoplePage />} />
          <Route path="/money"        element={<BudgetPage />} />
          <Route path="/library"      element={<LibraryPage />} />
          <Route path="/system"       element={<SystemPage />} />
          <Route path="/event-day"    element={<EventDayPage />} />

          {/* Compatibility redirects — keep old links working */}
          <Route path="/dashboard"    element={<Navigate to="/today" replace />} />
          <Route path="/my-work"      element={<Navigate to="/focus" replace />} />
          <Route path="/pr-planner"   element={<Navigate to="/launches" replace />} />
          <Route path="/budget"       element={<Navigate to="/money" replace />} />
          <Route path="/members"      element={<Navigate to="/people" replace />} />
          <Route path="/sponsors"     element={<Navigate to="/money" replace />} />
          <Route path="/reports"      element={<Navigate to="/library?section=reports" replace />} />
          <Route path="/files"        element={<Navigate to="/library?section=files" replace />} />
          <Route path="/audit"        element={<Navigate to="/library?section=audit" replace />} />
          <Route path="/data-tools"   element={<Navigate to="/system" replace />} />
          <Route path="/settings"     element={<Navigate to="/system" replace />} />

          {/* 404 → /today */}
          <Route path="*"             element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
