# Project Brief — RCCS Command Center

## Current MVP Summary

RCCS Command Center is a local-first React + TypeScript single-page application that serves as the central operations hub for the Royal College Computer Society.

Phase One is a working demo-ready MVP that allows RCCS to log in, navigate a project management workspace, and manage all active RCCS projects with phases, milestones, tasks, and PR calendars — entirely in the browser with no backend.

## Phase One Scope (Completed)

- Manual login with 3 hardcoded users
- App shell with sidebar + topbar
- Dashboard with stats, project cards, overdue tasks, upcoming deadlines, pending PR approvals
- Projects list with search and filters
- Project detail workspace (Overview, Phases, Milestones, Tasks, PR Plan)
- Full CRUD for phases, milestones, tasks, PR items
- PR Planner across all projects
- Calendar/agenda view filtered by type and month
- localStorage persistence
- Seed data for 5 RCCS 2026 projects
- Reset demo data functionality

## Phase Two Scope (Completed)

Phase Two turns the demo into a usable internal operations tool:

- Practicality + UI maturity pass across all existing screens
- Shared UI component system and responsive layout (mobile drawer)
- Global search and an in-app Attention Center
- New operational modules: Members, Meetings, Sponsors, Budget, Approvals, File Links, Reports
- Data Tools: export/import JSON backup, reset demo data
- Expanded realistic seed data (members, sponsors, budgets, transactions, meetings, approvals, files)

## Core Modules Built

1. Auth (temporary MVP)
2. Dashboard (attention-first)
3. Projects + Project Detail workspace (Overview, Phases, Milestones, Tasks, PR, Meetings, Sponsors, Budget, Approvals, Files, Reports)
4. PR Planner
5. Calendar
6. Members
7. Meetings
8. Sponsors
9. Budget
10. Approvals
11. Reports / Archive
12. Data Tools

## Core Philosophy

Deadline-first, not task-first. Every screen answers: what needs to happen next, who owns it, and when?
