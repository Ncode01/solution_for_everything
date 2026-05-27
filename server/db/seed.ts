import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.server") });

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
} from "./schema";

const DEMO_SLUG = "flowcanvas-demo";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing — set it in .env.server");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

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

  await db.delete(users).where(eq(users.orgId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
}

async function seed() {
  console.log("Seeding FlowCanvas database...");

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, DEMO_SLUG));

  if (existing[0]) {
    console.log(`Demo org exists (${existing[0].id}) — wiping demo data...`);
    await wipeDemoOrg(existing[0].id);
  }

  const [org] = await db
    .insert(organizations)
    .values({
      name: "FlowCanvas Demo Org",
      slug: DEMO_SLUG,
    })
    .returning();

  const userRows = await db
    .insert(users)
    .values([
      {
        orgId: org.id,
        name: "Sarah L.",
        initials: "SL",
        email: "sarah@flowcanvas.dev",
        role: "Lead",
      },
      {
        orgId: org.id,
        name: "Aiden K.",
        initials: "AK",
        email: "aiden@flowcanvas.dev",
        role: "Dev",
      },
      {
        orgId: org.id,
        name: "Meera P.",
        initials: "MP",
        email: "meera@flowcanvas.dev",
        role: "Design",
      },
      {
        orgId: org.id,
        name: "Luca R.",
        initials: "LR",
        email: "luca@flowcanvas.dev",
        role: "Dev",
      },
    ])
    .returning();

  const [sarah, aiden, meera, luca] = userRows;

  const projectRows = await db
    .insert(projects)
    .values([
      {
        orgId: org.id,
        name: "Annual Hackathon",
        color: "coral",
        status: "active",
        ownerId: sarah.id,
        completionPercent: 62,
      },
      {
        orgId: org.id,
        name: "Platform Redesign",
        color: "violet",
        status: "active",
        ownerId: meera.id,
        completionPercent: 30,
      },
      {
        orgId: org.id,
        name: "Data Pipeline",
        color: "sky",
        status: "planning",
        ownerId: aiden.id,
        completionPercent: 10,
      },
    ])
    .returning();

  const [hackathon, redesign, pipeline] = projectRows;

  const phaseRows = await db
    .insert(phases)
    .values([
      { projectId: hackathon.id, name: "Planning", orderIndex: 0 },
      { projectId: hackathon.id, name: "Build Sprint", orderIndex: 1 },
      { projectId: hackathon.id, name: "Demo Day", orderIndex: 2 },
      { projectId: redesign.id, name: "Research", orderIndex: 0 },
      { projectId: redesign.id, name: "Design System", orderIndex: 1 },
      { projectId: pipeline.id, name: "Architecture", orderIndex: 0 },
    ])
    .returning();

  const [ph1, ph2, ph3, ph4, ph5, ph6] = phaseRows;
  void ph1;
  void ph4;

  const taskRows = await db
    .insert(tasks)
    .values([
      {
        phaseId: ph2.id,
        projectId: hackathon.id,
        title: "Auth system setup",
        status: "done",
        priority: "critical",
        effortEstimate: 8,
        canvasX: 300,
        canvasY: 150,
      },
      {
        phaseId: ph2.id,
        projectId: hackathon.id,
        title: "Canvas engine mount",
        status: "in_progress",
        priority: "critical",
        effortEstimate: 12,
        canvasX: 580,
        canvasY: 80,
        description:
          "Mount ReactFlow with custom nodes and semantic zoom",
      },
      {
        phaseId: ph2.id,
        projectId: hackathon.id,
        title: "Design token audit",
        status: "in_review",
        priority: "high",
        effortEstimate: 4,
        canvasX: 580,
        canvasY: 240,
        dueDate: "2026-06-10",
      },
      {
        phaseId: ph2.id,
        projectId: hackathon.id,
        title: "Component library",
        status: "blocked",
        priority: "high",
        effortEstimate: 16,
        canvasX: 860,
        canvasY: 240,
      },
      {
        phaseId: ph3.id,
        projectId: hackathon.id,
        title: "Demo presentation",
        status: "not_started",
        priority: "critical",
        effortEstimate: 6,
        canvasX: 1140,
        canvasY: 150,
        dueDate: "2026-06-28",
      },
      {
        phaseId: ph5.id,
        projectId: redesign.id,
        title: "Color system design",
        status: "in_progress",
        priority: "high",
        effortEstimate: 8,
        canvasX: 300,
        canvasY: 520,
      },
      {
        phaseId: ph5.id,
        projectId: redesign.id,
        title: "Component specs",
        status: "not_started",
        priority: "medium",
        effortEstimate: 12,
        canvasX: 580,
        canvasY: 520,
      },
      {
        phaseId: ph6.id,
        projectId: pipeline.id,
        title: "Schema definition",
        status: "in_progress",
        priority: "high",
        effortEstimate: 6,
        canvasX: 300,
        canvasY: 820,
      },
      {
        phaseId: ph6.id,
        projectId: pipeline.id,
        title: "Ingestion pipeline",
        status: "not_started",
        priority: "critical",
        effortEstimate: 20,
        canvasX: 580,
        canvasY: 820,
      },
    ])
    .returning();

  const [t1, t2, t3, t4, t5, t6, t7, t8, t9] = taskRows;

  await db.insert(taskAssignees).values([
    { taskId: t1.id, userId: aiden.id },
    { taskId: t2.id, userId: sarah.id },
    { taskId: t2.id, userId: aiden.id },
    { taskId: t3.id, userId: meera.id },
    { taskId: t4.id, userId: meera.id },
    { taskId: t5.id, userId: sarah.id },
    { taskId: t6.id, userId: meera.id },
    { taskId: t7.id, userId: luca.id },
    { taskId: t8.id, userId: aiden.id },
    { taskId: t9.id, userId: aiden.id },
    { taskId: t9.id, userId: luca.id },
  ]);

  await db.insert(taskDependencies).values([
    { upstreamTaskId: t1.id, downstreamTaskId: t2.id, type: "FS" },
    { upstreamTaskId: t1.id, downstreamTaskId: t3.id, type: "FS" },
    { upstreamTaskId: t3.id, downstreamTaskId: t4.id, type: "FS" },
    { upstreamTaskId: t2.id, downstreamTaskId: t5.id, type: "FS" },
    { upstreamTaskId: t4.id, downstreamTaskId: t5.id, type: "FS" },
    { upstreamTaskId: t6.id, downstreamTaskId: t7.id, type: "FS" },
    { upstreamTaskId: t8.id, downstreamTaskId: t9.id, type: "FS" },
  ]);

  const depCount = await db.select().from(taskDependencies);
  const depsForOrg = depCount.filter(
    (d) =>
      [t1, t2, t3, t4, t5, t6, t7, t8, t9].some(
        (t) =>
          t.id === d.upstreamTaskId || t.id === d.downstreamTaskId,
      ),
  );

  console.log("Seed complete.");
  console.log(`ORG_ID=${org.id}`);
  console.log(`PROJECTS=${projectRows.length}`);
  console.log(`TASKS=${taskRows.length}`);
  console.log(`DEPENDENCIES=${depsForOrg.length}`);
  console.log("Add to .env.local: NEXT_PUBLIC_ORG_ID=" + org.id);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
