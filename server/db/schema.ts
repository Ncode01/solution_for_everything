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
  index,
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

export const projectTypeEnum = pgEnum("project_type", [
  "event",
  "product",
  "education",
  "publication",
  "hackathon",
  "collaboration",
  "internal_software",
]);

export const budgetEntryTypeEnum = pgEnum("budget_entry_type", [
  "income",
  "expenditure",
]);

export const crossProjectLinkTypeEnum = pgEnum("cross_project_link_type", [
  "launches_at",
  "talent_pipeline",
  "venue_shared",
  "funds_from",
  "collaboration",
]);

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
  authUserId: text("auth_user_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const inviteTokens = pgTable(
  "invite_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    role: text("role").notNull().default("member"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("invite_tokens_token_idx").on(t.token),
    index("invite_tokens_org_idx").on(t.orgId),
  ],
);

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
  projectType: projectTypeEnum("project_type").notNull().default("event"),
  isCollaborative: boolean("is_collaborative").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projectOrgs = pgTable("project_orgs", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  orgName: text("org_name").notNull(),
  orgRole: text("org_role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const budgetEntries = pgTable("budget_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  type: budgetEntryTypeEnum("type").notNull(),
  amount: real("amount").notNull().default(0),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: date("date").notNull(),
  isHardDeadline: boolean("is_hard_deadline").notNull().default(true),
  description: text("description"),
  canvasX: real("canvas_x"),
  canvasY: real("canvas_y"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orgRoles = pgTable("org_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  rank: integer("rank").notNull().default(99),
  isTeacherInCharge: boolean("is_teacher_in_charge").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const crossProjectLinks = pgTable("cross_project_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceProjectId: uuid("source_project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  targetProjectId: uuid("target_project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: crossProjectLinkTypeEnum("type").notNull(),
  note: text("note"),
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
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  /** Rich task fields for canvas node resolution (checklist, PR, risk, etc.) */
  metadata: jsonb("metadata"),
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
