# FlowCanvas — Data Models

**ORM:** Drizzle  
**Database:** PostgreSQL 16  
**Convention:** `snake_case` columns, `camelCase` in TypeScript via Drizzle mappers

---

## Entity Relationship

```
organizations 1──* users
organizations 1──* projects
projects 1──* phases
phases 1──* tasks
tasks *──* users  (via task_assignments)
tasks *──* tasks  (via task_dependencies)
tasks 1──* comments
users 1──* canvas_bookmarks
```

---

## Tables

### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | Display name |
| slug | text UNIQUE | URL segment |
| created_at | timestamptz | DEFAULT now() |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK → organizations | |
| name | text | |
| email | text UNIQUE per org | |
| avatar_url | text nullable | R2 URL |
| role | enum | owner, admin, member, viewer |
| created_at | timestamptz | |

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | |
| name | text | |
| color | text | coral \| amber \| violet \| sky \| mint |
| status | enum | active, archived, planning |
| owner_id | uuid FK → users nullable | |
| start_date | date nullable | |
| end_date | date nullable | |
| created_at | timestamptz | |
| canvas_x | float nullable | Z0 cluster position |
| canvas_y | float nullable | |

### phases
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK → projects | |
| name | text | e.g. "Sprint 3" |
| order_index | int | Sort within project |
| entry_conditions | jsonb | `{ rules: string[] }` optional |
| canvas_x | float nullable | Z1 position |
| canvas_y | float nullable | |

### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| phase_id | uuid FK → phases | |
| title | text | |
| description | text nullable | Markdown |
| status | enum | not_started, in_progress, blocked, in_review, done |
| priority | enum | low, medium, high, critical |
| effort_estimate | numeric | Hours or points |
| due_date | date nullable | |
| canvas_x | float | ReactFlow position |
| canvas_y | float | |
| is_critical_path | boolean | CPM-derived, cached |
| slack_time | numeric | CPM float, cached |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### task_assignments
| Column | Type | Notes |
|--------|------|-------|
| task_id | uuid FK → tasks | Composite PK |
| user_id | uuid FK → users | Composite PK |

### task_dependencies
| Column | Type | Notes |
|--------|------|-------|
| upstream_task_id | uuid FK → tasks | Composite PK |
| downstream_task_id | uuid FK → tasks | Composite PK |
| type | enum | FS, FF, SS |

**Constraint:** No self-loops; cycle detection at application layer (CPM).

### comments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| task_id | uuid FK → tasks | |
| user_id | uuid FK → users | |
| content | text | |
| created_at | timestamptz | |

### canvas_bookmarks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users | |
| org_id | uuid FK | Denormalized for query speed |
| name | text | |
| viewport_x | float | |
| viewport_y | float | |
| viewport_zoom | float | |
| created_at | timestamptz | |

---

## TypeScript Types (`src/types/`)

Mirror DB entities plus canvas-specific shapes:

```typescript
// src/types/task.ts
type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'in_review' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
type DependencyType = 'FS' | 'FF' | 'SS'

type Task = {
  id: string
  phaseId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  effortEstimate: number
  dueDate: string | null
  canvasX: number
  canvasY: number
  isCriticalPath: boolean
  slackTime: number
  assigneeIds: string[]
}

// src/types/canvas.ts
type ZoomLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'
type CanvasLayer = 'default' | 'workload' | 'criticalPath'

type TaskCardNodeData = {
  taskId: string
  title: string
  status: TaskStatus
  effortEstimate: number
  assigneeIds: string[]
  isCriticalPath: boolean
  slackTime: number
}
```

---

## ReactFlow Node ID Convention

| Node type | ID pattern | Example |
|-----------|------------|---------|
| Project cluster | `project:{uuid}` | `project:abc-123` |
| Phase cluster | `phase:{uuid}` | `phase:def-456` |
| Task card | `task:{uuid}` | `task:ghi-789` |
| Milestone | `milestone:{uuid}` | |
| Person avatar | `person:{userId}` | Workload layer only |

Edges: `edge:{upstreamId}:{downstreamId}`

---

## Indexes (recommended)

```sql
CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX idx_phases_project_id ON phases(project_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_task_deps_downstream ON task_dependencies(downstream_task_id);
```

---

## Migration Strategy

1. Drizzle Kit generate from `server/db/schema.ts`
2. Run migrations in CI before deploy
3. Seed script for RCCS org (`slug: rccs-2026`) — `pnpm db:seed`

---

## Extended Entity Relationship (Phase 12)

```
organizations 1──* org_roles
organizations 1──* users
organizations 1──* projects
projects 1──* project_orgs
projects 1──* budget_entries
projects 1──* milestones
projects 1──* phases 1──* tasks
projects *──* projects  (cross_project_links: source → target)
```

### `project_orgs`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK → projects | cascade delete |
| org_name | text | Partner org display name |
| org_role | text | e.g. `co-organizer`, `sponsor` |
| created_at | timestamptz | |

### `budget_entries`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK | |
| label | text | Line item name |
| type | enum | `income` \| `expenditure` |
| amount | real | LKR amounts in seed |
| confirmed | boolean | `false` = estimated |
| created_at | timestamptz | |

### `milestones`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| project_id | uuid FK | |
| title | text | |
| date | date | Hard anchor date |
| is_hard_deadline | boolean | UI padlock on canvas |
| description | text nullable | |
| canvas_x, canvas_y | real nullable | Milestone node position |
| created_at | timestamptz | |

### `org_roles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | |
| user_id | uuid FK | |
| title | text | e.g. Chairman, Treasurer |
| rank | integer | Lower = more senior (0 = teacher) |
| is_teacher_in_charge | boolean | |
| created_at | timestamptz | |

### `cross_project_links`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| source_project_id | uuid FK | |
| target_project_id | uuid FK | |
| type | enum | See below |
| note | text nullable | Shown on edge hover |
| created_at | timestamptz | |

### `projects` (Phase 12 columns)

| Column | Type | Notes |
|--------|------|-------|
| project_type | enum | See ProjectType Reference |
| is_collaborative | boolean | Shows partner org chips |

## ProjectType Reference

| Value | Meaning | RCCS 2026 project |
|-------|---------|-----------------|
| `event` | Single deadline-driven event | Beyond The User Interface'26 |
| `product` | Continuous live product | RC Sports App |
| `education` | Workshop / seminar series | Tesseract'26 |
| `publication` | Content pipeline to print | The Syntax'26 |
| `hackathon` | Hackathon-style event | PROTOX'26 |
| `collaboration` | Multi-org initiative | SparkIT'26 |
| `internal_software` | Internal multi-platform build | Digitalizer'26 |
