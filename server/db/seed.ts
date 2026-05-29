import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PROD_SEED !== "true"
) {
  console.error(
    "SEED BLOCKED: Do not run seed in production without ALLOW_PROD_SEED=true.",
  );
  process.exit(1);
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import * as schema from "./schema";
import {
  organizations,
  users,
  projects,
  phases,
  tasks,
  taskAssignees,
  taskDependencies,
  orgRoles,
  budgetEntries,
  milestones,
  projectOrgs,
  crossProjectLinks,
} from "./schema";

const DEMO_SLUG = "rccs-2026";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing — set it in .env.server");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

type UserSeed = { name: string; role: string };

const USER_SEEDS: UserSeed[] = [
  { name: "Nadula Nisith", role: "Co-Chairman" },
  { name: "Senudi Withanage", role: "Co-Chairman" },
  { name: "Shasvinth Srikanth", role: "Co-Secretary" },
  { name: "Yehara Peiris", role: "Co-Secretary" },
  { name: "Kathirkhmaruban Agsharan", role: "Committee Member" },
  { name: "Afthab Ahamed", role: "Committee Member" },
  { name: "Rihan Rishi Ekanayake", role: "Committee Member" },
  { name: "Sailesh Rengaraj", role: "Committee Member" },
  { name: "Randeepa Jayasekara", role: "Committee Member" },
  { name: "Abdul Munaf", role: "Committee Member" },
  { name: "Thisara Randinu Perera", role: "Committee Member" },
  { name: "Zakir Hassan", role: "Committee Member" },
  { name: "Umanee De Silva", role: "Committee Member" },
  { name: "Radinsa Jayasinghe", role: "Committee Member" },
  { name: "Pinidi Harinsa", role: "Committee Member" },
  { name: "Pasanya Ranatunge", role: "Committee Member" },
  { name: "Senudi De Silva", role: "Committee Member" },
  { name: "Nethuki Wickramanayake", role: "Committee Member" },
  { name: "Thanushi Yeshani", role: "Committee Member" },
  { name: "Mihini Kodithuwakku", role: "Committee Member" },
  { name: "Kavindi Thisumya", role: "Committee Member" },
  { name: "Bodhini Piyumika", role: "Committee Member" },
  { name: "Mrs. Nawodani Samarasinghe", role: "teacher" },
  { name: "Mrs. Sandamali Jayasekara", role: "teacher" },
  { name: "Induwara Thisarindu", role: "Committee Member" },
  { name: "Binal Yensith", role: "Committee Member" },
];

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function toEmail(name: string): string {
  const parts = name.trim().toLowerCase().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  return `${first}.${last}@rccs.lk`;
}

function pastDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function futureDays(days: number): string {
  return pastDays(days);
}

type TaskMetadata = Record<string, unknown>;

async function wipeDemoOrg(orgId: string) {
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.orgId, orgId));
  const projectIds = projectRows.map((p) => p.id);

  const taskRows =
    projectIds.length > 0
      ? await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(inArray(tasks.projectId, projectIds))
      : [];
  const taskIds = taskRows.map((t) => t.id);

  if (taskIds.length > 0) {
    await db
      .delete(taskDependencies)
      .where(inArray(taskDependencies.upstreamTaskId, taskIds));
    await db.delete(taskAssignees).where(inArray(taskAssignees.taskId, taskIds));
    await db.delete(tasks).where(inArray(tasks.id, taskIds));
  }

  if (projectIds.length > 0) {
    await db.delete(phases).where(inArray(phases.projectId, projectIds));
    await db.delete(projects).where(inArray(projects.id, projectIds));
  }

  await db.delete(orgRoles).where(eq(orgRoles.orgId, orgId));
  await db.delete(users).where(eq(users.orgId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

async function seed() {
  console.log("Seeding Royal College Computer Society (RCCS)...");

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, DEMO_SLUG));

  if (existing[0]) {
    console.log(`RCCS org exists (${existing[0].id}) — wiping seed data...`);
    await wipeDemoOrg(existing[0].id);
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "Royal College Computer Society",
      slug: DEMO_SLUG,
    })
    .returning();

  const userRows = await db
    .insert(users)
    .values(
      USER_SEEDS.map((u) => ({
        orgId: org.id,
        name: u.name,
        initials: toInitials(u.name),
        email: toEmail(u.name),
        role: u.role,
      })),
    )
    .returning();

  const userByName = new Map(userRows.map((row) => [row.name, row]));
  const requireUser = (name: string) => {
    const user = userByName.get(name);
    if (!user) throw new Error(`Seed user not found: ${name}`);
    return user;
  };

  await db.insert(orgRoles).values([
    {
      orgId: org.id,
      userId: requireUser("Shasvinth Srikanth").id,
      title: "Chairman",
      rank: 1,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Nadula Nisith").id,
      title: "Secretary",
      rank: 2,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Kathirkhmaruban Agsharan").id,
      title: "Treasurer",
      rank: 3,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Afthab Ahamed").id,
      title: "Assistant Chairman",
      rank: 4,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Rihan Rishi Ekanayake").id,
      title: "Assistant Secretary",
      rank: 5,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Zakir Hassan").id,
      title: "Assistant Treasurer",
      rank: 6,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Induwara Thisarindu").id,
      title: "Chief Coordinator",
      rank: 7,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Abdul Munaf").id,
      title: "Editor",
      rank: 8,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Thisara Randinu Perera").id,
      title: "Student Coordinator",
      rank: 9,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Binal Yensith").id,
      title: "Chief Avenue Director",
      rank: 10,
      isTeacherInCharge: false,
    },
    {
      orgId: org.id,
      userId: requireUser("Mrs. Nawodani Samarasinghe").id,
      title: "Senior Teacher In-Charge",
      rank: 0,
      isTeacherInCharge: true,
    },
    {
      orgId: org.id,
      userId: requireUser("Mrs. Sandamali Jayasekara").id,
      title: "Assistant Teacher In-Charge",
      rank: 0,
      isTeacherInCharge: true,
    },
  ]);

  const nadula = requireUser("Nadula Nisith");

  const projectRows = await db
    .insert(projects)
    .values([
      {
        orgId: org.id,
        name: "Beyond The User Interface'26",
        color: "coral",
        status: "active",
        projectType: "event",
        isCollaborative: false,
        completionPercent: 45,
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        canvasX: 200,
        canvasY: 200,
      },
      {
        orgId: org.id,
        name: "RC Sports App",
        color: "sky",
        status: "active",
        projectType: "product",
        isCollaborative: false,
        completionPercent: 60,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        canvasX: 800,
        canvasY: 200,
      },
      {
        orgId: org.id,
        name: "Tesseract'26",
        color: "mint",
        status: "active",
        projectType: "education",
        isCollaborative: false,
        completionPercent: 30,
        startDate: "2026-02-01",
        endDate: "2026-11-30",
        canvasX: 1400,
        canvasY: 200,
      },
      {
        orgId: org.id,
        name: "SparkIT'26",
        color: "violet",
        status: "active",
        projectType: "collaboration",
        isCollaborative: true,
        ownerId: nadula.id,
        completionPercent: 20,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        canvasX: 200,
        canvasY: 800,
      },
      {
        orgId: org.id,
        name: "Digitalizer'26",
        color: "amber",
        status: "active",
        projectType: "internal_software",
        isCollaborative: false,
        completionPercent: 25,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        canvasX: 800,
        canvasY: 800,
      },
      {
        orgId: org.id,
        name: "The Syntax'26",
        color: "sky",
        status: "planning",
        projectType: "publication",
        isCollaborative: false,
        completionPercent: 10,
        startDate: "2026-03-01",
        endDate: "2026-06-30",
        canvasX: 1400,
        canvasY: 800,
      },
      {
        orgId: org.id,
        name: "PROTOX'26",
        color: "coral",
        status: "planning",
        projectType: "hackathon",
        isCollaborative: false,
        completionPercent: 5,
        startDate: "2026-09-01",
        endDate: "2026-11-30",
        canvasX: 500,
        canvasY: 1400,
      },
    ])
    .returning();

  const projectByName = new Map(projectRows.map((p) => [p.name, p]));
  const requireProject = (name: string) => {
    const project = projectByName.get(name);
    if (!project) throw new Error(`Seed project not found: ${name}`);
    return project;
  };

  const btui = requireProject("Beyond The User Interface'26");
  const sparkit = requireProject("SparkIT'26");
  const protox = requireProject("PROTOX'26");
  const syntax = requireProject("The Syntax'26");
  const tesseract = requireProject("Tesseract'26");

  await db.insert(projectOrgs).values({
    projectId: sparkit.id,
    orgName: "Visakha Vidyalaya ICT Society",
    orgRole: "co-organizer",
  });

  await db.insert(milestones).values([
    {
      projectId: btui.id,
      title: "Main Event Day",
      date: "2026-06-28",
      isHardDeadline: true,
    },
    {
      projectId: btui.id,
      title: "Competition Series End",
      date: "2026-06-20",
      isHardDeadline: false,
    },
    {
      projectId: sparkit.id,
      title: "Fusion One-Day Event",
      date: "2026-05-15",
      isHardDeadline: true,
    },
    {
      projectId: sparkit.id,
      title: "Family Network Launch",
      date: "2026-07-01",
      isHardDeadline: false,
    },
    {
      projectId: protox.id,
      title: "Hackathon Day @ BMICH",
      date: "2026-11-20",
      isHardDeadline: true,
    },
    {
      projectId: syntax.id,
      title: "Publication Launch @ BTUI",
      date: "2026-06-28",
      isHardDeadline: true,
    },
    {
      projectId: tesseract.id,
      title: "GIT Seminar",
      date: "2026-08-01",
      isHardDeadline: false,
    },
  ]);

  await db.insert(budgetEntries).values([
    {
      projectId: btui.id,
      label: "Registration Fees",
      type: "income",
      amount: 150000,
      confirmed: true,
    },
    {
      projectId: btui.id,
      label: "Sponsorships",
      type: "income",
      amount: 300000,
      confirmed: false,
    },
    {
      projectId: btui.id,
      label: "Venue Hire",
      type: "expenditure",
      amount: 120000,
      confirmed: true,
    },
    {
      projectId: btui.id,
      label: "Awards & Printing",
      type: "expenditure",
      amount: 85000,
      confirmed: false,
    },
    {
      projectId: protox.id,
      label: "Entry Fees",
      type: "income",
      amount: 200000,
      confirmed: false,
    },
    {
      projectId: protox.id,
      label: "Corporate Sponsors",
      type: "income",
      amount: 200000,
      confirmed: false,
    },
    {
      projectId: protox.id,
      label: "BMICH Venue",
      type: "expenditure",
      amount: 250000,
      confirmed: false,
    },
    {
      projectId: protox.id,
      label: "Prizes",
      type: "expenditure",
      amount: 120000,
      confirmed: false,
    },
    {
      projectId: sparkit.id,
      label: "School Resource Packages (x10)",
      type: "expenditure",
      amount: 800000,
      confirmed: false,
    },
    {
      projectId: sparkit.id,
      label: "Partner Contributions",
      type: "income",
      amount: 300000,
      confirmed: false,
    },
  ]);

  await db.insert(crossProjectLinks).values([
    {
      sourceProjectId: syntax.id,
      targetProjectId: btui.id,
      type: "launches_at",
      note: "Magazine launches at BTUI main event",
    },
    {
      sourceProjectId: sparkit.id,
      targetProjectId: protox.id,
      type: "talent_pipeline",
      note: "SparkIT Flash participants feed PROTOX pool",
    },
  ]);

  const phaseRows = await db
    .insert(phases)
    .values([
      {
        projectId: sparkit.id,
        name: "Discovery",
        orderIndex: 0,
        canvasX: 0,
        canvasY: 0,
      },
      {
        projectId: sparkit.id,
        name: "Design",
        orderIndex: 1,
        canvasX: 0,
        canvasY: 0,
      },
      {
        projectId: sparkit.id,
        name: "Engineering",
        orderIndex: 2,
        canvasX: 0,
        canvasY: 0,
      },
    ])
    .returning();

  const [discovery, design, engineering] = phaseRows;

  const user1 = requireUser("Yehara Peiris");
  const user2 = requireUser("Shasvinth Srikanth");
  const user3 = requireUser("Nadula Nisith");
  const user4 = requireUser("Afthab Ahamed");
  const user5 = requireUser("Kathirkhmaruban Agsharan");

  const sparkitTaskSpecs: {
    phaseId: string;
    title: string;
    status: (typeof tasks.$inferInsert)["status"];
    priority: (typeof tasks.$inferInsert)["priority"];
    effortEstimate: number;
    dueDate?: string;
    isCriticalPath?: boolean;
    metadata?: TaskMetadata;
    assigneeIds?: string[];
  }[] = [
    {
      phaseId: discovery.id,
      title: "User Research Interviews",
      status: "done",
      priority: "high",
      effortEstimate: 16,
      dueDate: pastDays(-14),
      metadata: {
        checklist: [
          { id: "c1", label: "Recruit 8 participants", done: true },
          { id: "c2", label: "Prepare interview script", done: true },
          { id: "c3", label: "Conduct sessions", done: true },
          { id: "c4", label: "Synthesise findings", done: true },
          { id: "c5", label: "Share readout", done: true },
        ],
      },
      assigneeIds: [user1.id, user2.id],
    },
    {
      phaseId: discovery.id,
      title: "Competitive Analysis",
      status: "done",
      priority: "medium",
      effortEstimate: 8,
      dueDate: pastDays(-10),
      assigneeIds: [user1.id],
    },
    {
      phaseId: discovery.id,
      title: "Technical Feasibility",
      status: "in_progress",
      priority: "high",
      effortEstimate: 12,
      isCriticalPath: true,
    },
    {
      phaseId: discovery.id,
      title: "Stakeholder Sign-off",
      status: "blocked",
      priority: "critical",
      effortEstimate: 4,
      metadata: {
        blockedReason:
          "Waiting for legal review of data privacy terms",
        requiresApproval: true,
        approverId: user3.id,
      },
    },
    {
      phaseId: discovery.id,
      title: "Sign-off Approval Gate",
      status: "not_started",
      priority: "critical",
      effortEstimate: 1,
      metadata: {
        requiresApproval: true,
        approverId: user3.id,
        isDecisionPoint: true,
      },
    },
    {
      phaseId: discovery.id,
      title: "Risk Register",
      status: "in_progress",
      priority: "high",
      effortEstimate: 6,
      metadata: {
        riskLevel: "high",
        riskDescription:
          "Third-party API deprecation in Q3 could break core feature",
      },
    },
    {
      phaseId: design.id,
      title: "Brand Identity System",
      status: "in_progress",
      priority: "high",
      effortEstimate: 24,
      metadata: {
        externalLinks: [
          {
            id: "el1",
            label: "Figma Brand Kit",
            url: "https://figma.com/file/sparkit-brand",
            type: "figma",
          },
        ],
      },
      assigneeIds: [user2.id],
    },
    {
      phaseId: design.id,
      title: "Figma Design System",
      status: "in_progress",
      priority: "high",
      effortEstimate: 40,
      metadata: {
        externalLinks: [
          {
            id: "el2",
            label: "Component Library",
            url: "https://figma.com/file/sparkit-ds",
            type: "figma",
          },
        ],
        checklist: [
          { id: "d1", label: "Colour tokens", done: true },
          { id: "d2", label: "Typography scale", done: true },
          { id: "d3", label: "Button components", done: true },
          { id: "d4", label: "Form elements", done: false },
          { id: "d5", label: "Navigation patterns", done: false },
          { id: "d6", label: "Data viz components", done: false },
        ],
      },
      assigneeIds: [user2.id, user4.id],
    },
    {
      phaseId: design.id,
      title: "Prototype v1",
      status: "in_review",
      priority: "high",
      effortEstimate: 20,
      metadata: {
        requiresApproval: true,
        approverId: user3.id,
      },
    },
    {
      phaseId: design.id,
      title: "Accessibility Audit",
      status: "not_started",
      priority: "medium",
      effortEstimate: 8,
      metadata: {
        recurrence: "monthly",
        recurrenceNext: futureDays(30),
        recurrenceLast: pastDays(-30),
      },
    },
    {
      phaseId: design.id,
      title: "Animation Spec",
      status: "not_started",
      priority: "low",
      effortEstimate: 6,
      metadata: {
        note: "Keep transitions under 300ms per WCAG 2.5.3. Avoid parallax.",
        noteAuthorId: user2.id,
      },
    },
    {
      phaseId: engineering.id,
      title: "Auth Service",
      status: "in_progress",
      priority: "critical",
      effortEstimate: 32,
      isCriticalPath: true,
      metadata: {
        costEstimate: 4200,
        githubPrUrl: "https://github.com/org/sparkit/pull/47",
        githubPrStatus: "open",
        githubPrTitle: "feat: JWT auth + refresh token rotation",
      },
      assigneeIds: [user4.id, user5.id],
    },
    {
      phaseId: engineering.id,
      title: "Database Schema v2",
      status: "in_progress",
      priority: "high",
      effortEstimate: 16,
      isCriticalPath: true,
      metadata: {
        costEstimate: 1800,
        ganttStartDate: pastDays(-5),
        ganttEndDate: futureDays(9),
        ganttProgress: 35,
      },
      assigneeIds: [user4.id],
    },
    {
      phaseId: engineering.id,
      title: "API Gateway Setup",
      status: "not_started",
      priority: "high",
      effortEstimate: 24,
      metadata: { costEstimate: 3600 },
    },
    {
      phaseId: engineering.id,
      title: "Frontend Shell",
      status: "not_started",
      priority: "high",
      effortEstimate: 20,
      isCriticalPath: true,
    },
    {
      phaseId: engineering.id,
      title: "Legacy Migration Script",
      status: "blocked",
      priority: "high",
      effortEstimate: 12,
      metadata: {
        blockedReason:
          "Waiting for production DB read access from ops team",
      },
    },
    {
      phaseId: engineering.id,
      title: "CI/CD Pipeline",
      status: "in_progress",
      priority: "medium",
      effortEstimate: 8,
      metadata: {
        recurrence: "weekly",
        recurrenceNext: futureDays(7),
        recurrenceLast: pastDays(-7),
      },
    },
    {
      phaseId: engineering.id,
      title: "Security Pen Test",
      status: "not_started",
      priority: "critical",
      effortEstimate: 16,
      metadata: {
        riskLevel: "critical",
        riskDescription:
          "External pen test required before launch. Vendor not yet contracted.",
        costEstimate: 8500,
      },
    },
    {
      phaseId: engineering.id,
      title: "Performance Budget",
      status: "not_started",
      priority: "medium",
      effortEstimate: 1,
    },
    {
      phaseId: engineering.id,
      title: "E2E Test Suite",
      status: "not_started",
      priority: "medium",
      effortEstimate: 20,
      metadata: {
        checklist: [
          { id: "e1", label: "Auth flows", done: false },
          { id: "e2", label: "Checkout flows", done: false },
          { id: "e3", label: "Dashboard smoke tests", done: false },
        ],
      },
    },
  ];

  const taskRows = await db
    .insert(tasks)
    .values(
      sparkitTaskSpecs.map((spec) => ({
        phaseId: spec.phaseId,
        projectId: sparkit.id,
        title: spec.title,
        status: spec.status,
        priority: spec.priority,
        effortEstimate: spec.effortEstimate,
        dueDate: spec.dueDate ?? null,
        canvasX: 0,
        canvasY: 0,
        isCriticalPath: spec.isCriticalPath ?? false,
        metadata: spec.metadata ?? null,
      })),
    )
    .returning();

  const taskByTitle = new Map(taskRows.map((t) => [t.title, t]));
  const competitive = taskByTitle.get("Competitive Analysis")!;
  const technical = taskByTitle.get("Technical Feasibility")!;
  const stakeholder = taskByTitle.get("Stakeholder Sign-off")!;
  const auth = taskByTitle.get("Auth Service")!;
  const dbSchema = taskByTitle.get("Database Schema v2")!;
  const apiGateway = taskByTitle.get("API Gateway Setup")!;
  const frontend = taskByTitle.get("Frontend Shell")!;
  const legacy = taskByTitle.get("Legacy Migration Script")!;

  await db
    .update(tasks)
    .set({
      metadata: {
        ...(stakeholder.metadata as TaskMetadata),
        blockedByTaskId: technical.id,
      },
    })
    .where(eq(tasks.id, stakeholder.id));

  await db
    .update(tasks)
    .set({
      metadata: {
        ...(legacy.metadata as TaskMetadata),
        blockedByTaskId: dbSchema.id,
      },
    })
    .where(eq(tasks.id, legacy.id));

  type AssigneeSpec = { taskId: string; userIds: string[] };

  const assigneeSpecs: AssigneeSpec[] = sparkitTaskSpecs
    .map((spec) => {
      const row = taskByTitle.get(spec.title);
      if (!row || !spec.assigneeIds?.length) return null;
      return { taskId: row.id, userIds: spec.assigneeIds };
    })
    .filter((s): s is AssigneeSpec => s != null);

  await db.insert(taskAssignees).values(
    assigneeSpecs.flatMap((spec) =>
      spec.userIds.map((userId) => ({
        taskId: spec.taskId,
        userId,
      })),
    ),
  );

  const dependencyRows = await db
    .insert(taskDependencies)
    .values([
      {
        upstreamTaskId: competitive.id,
        downstreamTaskId: technical.id,
        type: "FS",
      },
      {
        upstreamTaskId: auth.id,
        downstreamTaskId: apiGateway.id,
        type: "FS",
      },
      {
        upstreamTaskId: dbSchema.id,
        downstreamTaskId: apiGateway.id,
        type: "FS",
      },
      {
        upstreamTaskId: apiGateway.id,
        downstreamTaskId: frontend.id,
        type: "FS",
      },
    ])
    .returning();

  console.log("Seed complete.");
  console.log(`ORG_ID=${org.id}`);
  console.log(`PROJECTS=7`);
  console.log(`TASKS=${taskRows.length}`);
  console.log(`DEPENDENCIES=${dependencyRows.length}`);
  console.log("Add to .env.local: NEXT_PUBLIC_ORG_ID=" + org.id);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
