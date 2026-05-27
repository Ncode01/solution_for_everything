import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  real,
  boolean,
  jsonb,
  primaryKey,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "archived",
  "on_hold",
  "completed",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "blocked",
  "in_review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const dependencyTypeEnum = pgEnum("dependency_type", ["FS", "FF", "SS"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  initials: text("initials").notNull().default("??"),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  status: projectStatusEnum("status").notNull().default("planning"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  completionPercent: real("completion_percent").notNull().default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  canvasX: real("canvas_x"),
  canvasY: real("canvas_y"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const phases = pgTable("phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  entryConditions: jsonb("entry_conditions"),
  canvasX: real("canvas_x"),
  canvasY: real("canvas_y"),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseId: uuid("phase_id")
    .notNull()
    .references(() => phases.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("not_started"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  effortEstimate: real("effort_estimate"),
  dueDate: date("due_date"),
  canvasX: real("canvas_x").notNull().default(0),
  canvasY: real("canvas_y").notNull().default(0),
  isCriticalPath: boolean("is_critical_path").notNull().default(false),
  slackTime: real("slack_time"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskAssignments = pgTable(
  "task_assignments",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.userId] })],
);

/** Alias used in seed scripts */
export const taskAssignees = taskAssignments;

export const taskDependencies = pgTable(
  "task_dependencies",
  {
    upstreamTaskId: uuid("upstream_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    downstreamTaskId: uuid("downstream_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    type: dependencyTypeEnum("type").notNull().default("FS"),
  },
  (table) => [
    primaryKey({
      columns: [table.upstreamTaskId, table.downstreamTaskId],
    }),
  ],
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const canvasBookmarks = pgTable("canvas_bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  viewportX: real("viewport_x").notNull(),
  viewportY: real("viewport_y").notNull(),
  viewportZoom: real("viewport_zoom").notNull(),
});

/** Per-auth-user viewport persistence (Better Auth id, not domain users) */
export const canvasPositions = pgTable(
  "canvas_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authUserId: text("auth_user_id").notNull(),
    viewportX: real("viewport_x").notNull(),
    viewportY: real("viewport_y").notNull(),
    viewportZoom: real("viewport_zoom").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("canvas_positions_org_auth_user_idx").on(
      table.orgId,
      table.authUserId,
    ),
  ],
);
