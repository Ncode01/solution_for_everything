import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import Layout from './components/Layout';
import LoginPage from './features/auth/LoginPage';
import PageLoader from './components/PageLoader';
import RoleGuard from './components/RoleGuard';

import TodayPage from './features/today/TodayPage';
import ProjectsPage from './features/projects/ProjectsPage';
import ProjectDetailPage from './features/projects/ProjectDetailPage';
import FocusPage from './features/focus/FocusPage';

const CalendarPage    = lazy(() => import('./features/calendar/CalendarPage'));
const LaunchesPage    = lazy(() => import('./features/launches/LaunchesPage'));
const PeoplePage      = lazy(() => import('./features/people/PeoplePage'));
const MeetingsPage    = lazy(() => import('./features/meetings/MeetingsPage'));
const BudgetPage      = lazy(() => import('./features/budget/BudgetPage'));
const ApprovalsPage   = lazy(() => import('./features/approvals/ApprovalsPage'));
const LibraryPage     = lazy(() => import('./features/library/LibraryPage'));
const SystemPage      = lazy(() => import('./features/system/SystemPage'));
const EventDayPage    = lazy(() => import('./features/event-day/EventDayPage'));

function Guard({ route, children }: { route: Parameters<typeof RoleGuard>[0]['route']; children: React.ReactNode }) {
  return <RoleGuard route={route}>{children}</RoleGuard>;
}

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
          <Route index element={<Navigate to="/today" replace />} />

          <Route path="/today"        element={<Guard route="/today"><TodayPage user={user} /></Guard>} />
          <Route path="/focus"        element={<Guard route="/focus"><FocusPage user={user} /></Guard>} />
          <Route path="/calendar"     element={<Guard route="/calendar"><CalendarPage /></Guard>} />
          <Route path="/projects"     element={<Guard route="/projects"><ProjectsPage /></Guard>} />
          <Route path="/projects/:id" element={<Guard route="/projects"><ProjectDetailPage /></Guard>} />
          <Route path="/launches"     element={<Guard route="/launches"><LaunchesPage /></Guard>} />
          <Route path="/meetings"     element={<Guard route="/meetings"><MeetingsPage /></Guard>} />
          <Route path="/approvals"    element={<Guard route="/approvals"><ApprovalsPage /></Guard>} />
          <Route path="/people"       element={<Guard route="/people"><PeoplePage /></Guard>} />
          <Route path="/money"        element={<Guard route="/money"><BudgetPage /></Guard>} />
          <Route path="/library"      element={<Guard route="/library"><LibraryPage /></Guard>} />
          <Route path="/system"       element={<Guard route="/system"><SystemPage /></Guard>} />
          <Route path="/event-day"    element={<Guard route="/event-day"><EventDayPage /></Guard>} />

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

          <Route path="*"             element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
