import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { getSession, logout } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProjectsPage from './features/projects/ProjectsPage';
import ProjectDetailPage from './features/projects/ProjectDetailPage';
import CalendarPage from './features/calendar/CalendarPage';
import PRPlannerPage from './features/pr/PRPlannerPage';
import MembersPage from './features/members/MembersPage';
import MeetingsPage from './features/meetings/MeetingsPage';
import BudgetPage from './features/budget/BudgetPage';
import ApprovalsPage from './features/approvals/ApprovalsPage';
import ReportsPage from './features/reports/ReportsPage';
import DataToolsPage from './features/settings/DataToolsPage';
import MyWorkPage from './features/my-work/MyWorkPage';

export default function App() {
  const [user, setUser] = useState<User | null>(getSession);

  function handleLogin(u: User) { setUser(u); }
  function handleLogout() { logout(); setUser(null); }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<DashboardPage user={user} />} />
        <Route path="/my-work"         element={<MyWorkPage user={user} />} />
        <Route path="/projects"        element={<ProjectsPage />} />
        <Route path="/projects/:id"    element={<ProjectDetailPage />} />
        <Route path="/calendar"        element={<CalendarPage />} />
        <Route path="/pr-planner"      element={<PRPlannerPage />} />
        <Route path="/members"         element={<MembersPage />} />
        <Route path="/meetings"        element={<MeetingsPage />} />
        {/* /sponsors → /budget: sponsors are inside the Money workflow */}
        <Route path="/sponsors"        element={<Navigate to="/budget" replace />} />
        <Route path="/budget"          element={<BudgetPage />} />
        <Route path="/approvals"       element={<ApprovalsPage />} />
        <Route path="/reports"         element={<ReportsPage />} />
        <Route path="/data-tools"      element={<DataToolsPage />} />
        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
