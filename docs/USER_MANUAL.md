# FlowCanvas — User Manual

This guide explains how to use FlowCanvas day to day. For technical setup, see [DEPLOY.md](./DEPLOY.md). For when something goes wrong, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## 1. Getting started

### Create an account

1. Open your organization’s FlowCanvas URL (e.g. `https://solutionforeverything.vercel.app`).
2. Go to **Sign up** on the login page.
3. Enter your name, email, and password.
4. After sign-up, you may need an **invite link** from an admin to join the organization (see [Invites](#invites)).

### Log in

1. Enter email and password on `/login`.
2. You are taken to the main app (canvas view by default).

### First load

After login you typically see:

- **Top bar** — org name, view switcher, notifications (disabled), account menu
- **Left sidebar** — projects and people from your organization
- **Canvas** — project clusters and task cards (or an empty state with **Create task**)

The app loads your organization’s graph from the server. The first load may take a few seconds on a cold API.

---

## 2. Core concepts

| Term | Meaning |
|------|---------|
| **Organization** | Your company or team. One deployment is usually one org (`NEXT_PUBLIC_ORG_ID`). |
| **Project** | A body of work (e.g. “Q3 Launch”). Shown as a **cluster** on the canvas. |
| **Phase** | A stage inside a project (e.g. “Design”, “Build”). Tasks belong to a phase. |
| **Task** | A unit of work — title, status, assignees, dates, position on canvas. |
| **Canvas** | The main infinite board where nodes are placed and connected. |
| **Dependency** | “Task B cannot start until Task A finishes” — shown as an arrow between tasks. |
| **Views** | **Canvas** (spatial), **Gantt** (timeline), **Dashboard** (summary metrics). |
| **Workload layer** | Overlay highlighting who is overloaded based on task count (heuristic). |

---

## 3. Using the canvas

### Navigate the canvas

- **Pan:** click and drag the background (or use trackpad).
- **Zoom:** scroll wheel or pinch.
- **Fit view:** `Shift + C` or command palette → fit view.

Your pan/zoom may be saved per user when the server is available. If save fails, the canvas still works; you simply start from a default view next time.

### Semantic zoom

As you zoom out, the canvas hides detail so you see projects first, then phases and tasks as you zoom in. This is automatic — no setting required.

### Expand and collapse projects

Click a **project cluster** to expand and see phases and tasks inside. Click again to collapse.

### Create a task

You need at least one **project** and **phase** in your org (usually created via database seed or admin setup).

| Method | How |
|--------|-----|
| Keyboard | Press **`T`** on the canvas |
| Command palette | `⌘K` (Mac) or `Ctrl+K` → “New Task” |
| Empty canvas | Click **Create task** when no tasks are visible |
| Right panel | Opens in **create** mode with project/phase pre-filled when possible |

If no project exists, you’ll see a message asking to create a project and phase first (admin/seed).

### View and edit a task

- **Click** a task card to open the **right panel** (details).
- **Keyboard:** focus a task card, press **Enter** or **Space** to open.
- **Edit:** select a task, press **`E`**, or use the panel fields.
- **Archive:** use the archive action in the task panel (removes from active graph).

### Move tasks

Drag a task card to reposition it. Position is saved to the server (debounced). If save fails, the card may snap back and you’ll see an error toast — try again after checking your connection.

### Dependencies

1. Open a task in the right panel.
2. Use the **Dependencies** section to add or remove upstream tasks.
3. Edges on the canvas update after save.

Connecting edges by dragging between handles on the canvas may be limited; the panel is the supported path for pilot.

### Layers and highlights

| Shortcut / action | Effect |
|-------------------|--------|
| `Shift + W` | Toggle **workload** layer (load rings on people) |
| Cascade highlight | Selecting dependencies may highlight related tasks (when enabled in UI) |
| Critical path | Computed automatically; critical tasks use distinct styling |

Workload percentages are **estimates** (based on task count), not official capacity planning.

### Command palette

Press **`⌘K`** (Mac) or **`Ctrl+K`** (Windows) to open the palette. Search by name; use arrow keys and Enter to run a command.

Common commands: switch views (`G` then `C` / `D` / `G`), new task, edit task, toggle workload, fit view.

### Right panel

- Opens when you select or create a task.
- Press **`Escape`** to close or deselect.
- Do not use the panel for full-page navigation — everything stays on the canvas.

### Keyboard shortcuts

Press **`?`** to open the shortcuts overlay.

| Keys | Action |
|------|--------|
| `G` `C` | Canvas view |
| `G` `G` | Gantt view |
| `G` `D` | Dashboard view |
| `⌘K` / `Ctrl+K` | Command palette |
| `T` | New task |
| `E` | Edit selected task |
| `Shift+W` | Workload layer |
| `Shift+C` | Fit view |
| `Esc` | Close panel / deselect |
| `?` | Shortcut help |

---

## 4. Using the views

### Canvas (default)

Best for spatial planning, dependencies, and team layout. This is the primary view.

### Gantt

Shows tasks on a **timeline** by due date.

- Tasks **without due dates** may not appear — that is expected.
- Use this for schedule-oriented check-ins, not full portfolio planning in the pilot.

Switch: `G` then `G`, or command palette.

### Dashboard

Shows **KPI-style metrics** derived from the org graph (counts, status breakdown, etc.).

- Requires loaded graph data.
- If the API fails, you’ll see an error with **Try again** — not a blank silent failure.

Switch: `G` then `D`, or command palette.

---

## 5. Error handling and recovery

| Situation | What you see | What to do |
|-----------|--------------|------------|
| API down / offline | “Could not load data”, network message | Check connection; click **Try again** |
| Session expired | “Session expired” on canvas | Click **Sign in** or go to `/login` |
| Firebase missing | No presence dots; optional console note | Ignore for core work; app is fine |
| Viewport not saved | No message (non-critical) | Pan/zoom still works this session |
| Task save failed | Error toast | Fix validation or retry |
| Empty org | Empty canvas / empty dashboard copy | Add data via admin seed or invites |

The app does **not** reload the whole page when your session expires — you stay on screen and can sign in again.

---

## 6. Optional features

### Presence (other users)

When Firebase is configured, you may see **other users’ cursors** or presence indicators.

If Firebase is off or misconfigured:

- No presence UI
- One console warning for developers (not shown to end users in UI)
- All task and canvas features still work via the API

### Realtime events

Optional Firestore events can notify other tabs about changes. The **source of truth** is always PostgreSQL via the API.

---

## 7. Notifications

The **bell icon** in the top bar is **disabled** and labeled **not available yet**.

There is no unread count. Notifications are planned for a future release.

---

## 8. Accessibility

- Task cards support **keyboard** activation (Enter / Space).
- Command palette is keyboard-driven.
- Error states use text readable by screen readers (role/status where implemented).
- Menus support **Escape** to close.

**Limitations:** Canvas drag is pointer-first; some React Flow controls may have limited screen reader labels. Use the right panel for structured task edits when using assistive tech.

---

## 9. Known limitations (pilot)

| Limitation | Detail |
|------------|--------|
| Workload numbers | Heuristic, not HR capacity rules |
| Viewport sync | Best-effort; failures are silent |
| Notifications | Not implemented |
| Yjs live cursors on canvas | Not implemented (Firebase presence only) |
| Preview URLs | Auth may fail if env URLs don’t match preview hostname |
| Create project/phase in UI | May require admin/seed; not all flows are in-product yet |
| Task status-only API | Use full task edit; dedicated status endpoint is not implemented |

---

## 10. FAQ

**Why don’t I see any tasks?**  
Your org may be empty, or the API failed. Check for an error overlay and try again. Confirm you’re signed into the correct environment.

**Why did my task jump back after dragging?**  
The save failed or was slow. Retry when online; if it persists, contact support with the time and browser console open.

**Why does Gantt look empty?**  
Tasks need **due dates** to appear on the timeline.

**Why can’t I sign in on a preview link?**  
Preview deployments need matching auth URLs. Use the production URL or ask ops to configure preview env vars.

**What does “Domain user not linked” mean?**  
Your auth account isn’t linked to an org user row. An admin must run `pnpm auth:link-owner` (or accept an invite).

**Is my data live-collaborative like Figma?**  
Not yet for canvas positions via CRDT. Multiple users can use the app; positions sync via API save and optional Firebase.

---

## Related docs

- [README.md](./README.md) — documentation index  
- [STATUS.md](./STATUS.md) — what’s shipped  
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — technical debugging  
