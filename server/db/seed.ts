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
  posters,
  networkSchools,
  externalCollaborators,
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
        name: "SparkIT Flash",
        orderIndex: 0,
        canvasX: 200,
        canvasY: 420,
      },
      {
        projectId: sparkit.id,
        name: "SparkIT Fusion",
        orderIndex: 1,
        canvasX: 700,
        canvasY: 420,
      },
      {
        projectId: sparkit.id,
        name: "SparkIT Family",
        orderIndex: 2,
        canvasX: 1200,
        canvasY: 420,
      },
    ])
    .returning();

  const [flash, fusion, family] = phaseRows;

  const flashBaseX = 200;
  const fusionBaseX = 700;
  const familyBaseX = 1200;
  const taskBaseY = 620;
  const taskStepX = 220;

  const taskRows = await db
    .insert(tasks)
    .values([
      {
        phaseId: flash.id,
        projectId: sparkit.id,
        title: "Identify industry speaker domains",
        status: "done",
        priority: "high",
        effortEstimate: 4,
        dueDate: "2026-02-15",
        canvasX: flashBaseX,
        canvasY: taskBaseY,
      },
      {
        phaseId: flash.id,
        projectId: sparkit.id,
        title: "Schedule weekly online sessions (8 sessions)",
        status: "in_progress",
        priority: "critical",
        effortEstimate: 6,
        dueDate: "2026-03-01",
        canvasX: flashBaseX + taskStepX,
        canvasY: taskBaseY,
      },
      {
        phaseId: flash.id,
        projectId: sparkit.id,
        title: "Design competition challenges per session topic",
        status: "in_progress",
        priority: "high",
        effortEstimate: 8,
        dueDate: "2026-03-15",
        canvasX: flashBaseX + taskStepX * 2,
        canvasY: taskBaseY,
      },
      {
        phaseId: flash.id,
        projectId: sparkit.id,
        title: "Build participant registration system",
        status: "not_started",
        priority: "high",
        effortEstimate: 10,
        dueDate: "2026-03-01",
        canvasX: flashBaseX + taskStepX * 3,
        canvasY: taskBaseY,
      },
      {
        phaseId: flash.id,
        projectId: sparkit.id,
        title: "Launch nationwide participant outreach",
        status: "not_started",
        priority: "critical",
        effortEstimate: 5,
        dueDate: "2026-03-10",
        canvasX: flashBaseX + taskStepX * 4,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Confirm and shortlist 15 partner schools",
        status: "in_progress",
        priority: "critical",
        effortEstimate: 8,
        dueDate: "2026-04-01",
        canvasX: fusionBaseX,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Secure venue and logistics",
        status: "not_started",
        priority: "critical",
        effortEstimate: 6,
        dueDate: "2026-04-15",
        canvasX: fusionBaseX + taskStepX,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Prepare Cybersecurity session (Legion Offensive Security)",
        status: "not_started",
        priority: "high",
        effortEstimate: 8,
        dueDate: "2026-04-20",
        canvasX: fusionBaseX + taskStepX * 2,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Prepare Robotics session materials",
        status: "not_started",
        priority: "high",
        effortEstimate: 10,
        dueDate: "2026-04-20",
        canvasX: fusionBaseX + taskStepX * 3,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Arrange resource donations for schools",
        status: "not_started",
        priority: "medium",
        effortEstimate: 6,
        dueDate: "2026-05-01",
        canvasX: fusionBaseX + taskStepX * 4,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Plan awards and certificates (top 3 teams)",
        status: "not_started",
        priority: "medium",
        effortEstimate: 3,
        dueDate: "2026-05-01",
        canvasX: fusionBaseX + taskStepX * 5,
        canvasY: taskBaseY,
      },
      {
        phaseId: fusion.id,
        projectId: sparkit.id,
        title: "Coordinate transportation and RFID logistics",
        status: "not_started",
        priority: "medium",
        effortEstimate: 4,
        dueDate: "2026-05-05",
        canvasX: fusionBaseX + taskStepX * 6,
        canvasY: taskBaseY,
      },
      {
        phaseId: family.id,
        projectId: sparkit.id,
        title: "Establish WhatsApp network for all partner schools",
        status: "not_started",
        priority: "high",
        effortEstimate: 3,
        dueDate: "2026-06-01",
        canvasX: familyBaseX,
        canvasY: taskBaseY,
      },
      {
        phaseId: family.id,
        projectId: sparkit.id,
        title: "Build web portal (project docs + learning modules)",
        status: "not_started",
        priority: "critical",
        effortEstimate: 20,
        dueDate: "2026-07-01",
        canvasX: familyBaseX + taskStepX,
        canvasY: taskBaseY,
      },
      {
        phaseId: family.id,
        projectId: sparkit.id,
        title: "Onboard 10+ new ICT societies into the network",
        status: "not_started",
        priority: "critical",
        effortEstimate: 10,
        dueDate: "2026-06-15",
        canvasX: familyBaseX + taskStepX * 2,
        canvasY: taskBaseY,
      },
      {
        phaseId: family.id,
        projectId: sparkit.id,
        title: "Set up mentorship chain (advanced students → new schools)",
        status: "not_started",
        priority: "high",
        effortEstimate: 8,
        dueDate: "2026-07-15",
        canvasX: familyBaseX + taskStepX * 3,
        canvasY: taskBaseY,
      },
      {
        phaseId: family.id,
        projectId: sparkit.id,
        title: "Run first cross-school innovation challenge",
        status: "not_started",
        priority: "medium",
        effortEstimate: 12,
        dueDate: "2026-08-01",
        canvasX: familyBaseX + taskStepX * 4,
        canvasY: taskBaseY,
      },
    ])
    .returning();

  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17] =
    taskRows;

  type AssigneeSpec = { taskId: string; names: string[] };

  const assigneeSpecs: AssigneeSpec[] = [
    { taskId: t1.id, names: ["Yehara Peiris"] },
    { taskId: t2.id, names: ["Yehara Peiris", "Shasvinth Srikanth"] },
    {
      taskId: t3.id,
      names: ["Sailesh Rengaraj", "Rihan Rishi Ekanayake"],
    },
    {
      taskId: t4.id,
      names: ["Afthab Ahamed", "Kathirkhmaruban Agsharan"],
    },
    { taskId: t5.id, names: ["Nadula Nisith", "Senudi Withanage"] },
    { taskId: t6.id, names: ["Senudi Withanage"] },
    { taskId: t7.id, names: ["Randeepa Jayasekara", "Abdul Munaf"] },
    {
      taskId: t8.id,
      names: ["Zakir Hassan", "Thisara Randinu Perera"],
    },
    {
      taskId: t9.id,
      names: ["Sailesh Rengaraj", "Rihan Rishi Ekanayake"],
    },
    { taskId: t10.id, names: ["Umanee De Silva", "Pinidi Harinsa"] },
    { taskId: t11.id, names: ["Pasanya Ranatunge", "Senudi De Silva"] },
    { taskId: t12.id, names: ["Randeepa Jayasekara"] },
    { taskId: t13.id, names: ["Radinsa Jayasinghe"] },
    {
      taskId: t14.id,
      names: [
        "Nethuki Wickramanayake",
        "Mihini Kodithuwakku",
        "Bodhini Piyumika",
      ],
    },
    { taskId: t15.id, names: ["Radinsa Jayasinghe", "Thanushi Yeshani"] },
    { taskId: t16.id, names: ["Kavindi Thisumya", "Senudi Withanage"] },
    { taskId: t17.id, names: ["Nadula Nisith", "Radinsa Jayasinghe"] },
  ];

  await db.insert(taskAssignees).values(
    assigneeSpecs.flatMap((spec) =>
      spec.names.map((name) => ({
        taskId: spec.taskId,
        userId: requireUser(name).id,
      })),
    ),
  );

  const dependencyRows = await db
    .insert(taskDependencies)
    .values([
      { upstreamTaskId: t1.id, downstreamTaskId: t2.id, type: "FS" },
      { upstreamTaskId: t1.id, downstreamTaskId: t3.id, type: "FS" },
      { upstreamTaskId: t2.id, downstreamTaskId: t5.id, type: "FS" },
      { upstreamTaskId: t4.id, downstreamTaskId: t5.id, type: "FS" },
      { upstreamTaskId: t6.id, downstreamTaskId: t7.id, type: "FS" },
      { upstreamTaskId: t6.id, downstreamTaskId: t8.id, type: "FS" },
      { upstreamTaskId: t6.id, downstreamTaskId: t9.id, type: "FS" },
      { upstreamTaskId: t7.id, downstreamTaskId: t10.id, type: "FS" },
      { upstreamTaskId: t7.id, downstreamTaskId: t11.id, type: "FS" },
      { upstreamTaskId: t7.id, downstreamTaskId: t12.id, type: "FS" },
      { upstreamTaskId: t6.id, downstreamTaskId: t15.id, type: "FS" },
      { upstreamTaskId: t15.id, downstreamTaskId: t13.id, type: "FS" },
      { upstreamTaskId: t15.id, downstreamTaskId: t16.id, type: "FS" },
      { upstreamTaskId: t13.id, downstreamTaskId: t17.id, type: "FS" },
      { upstreamTaskId: t16.id, downstreamTaskId: t17.id, type: "FS" },
      { upstreamTaskId: t14.id, downstreamTaskId: t17.id, type: "FS" },
    ])
    .returning();

  const POSTER_TAGS = [
    "design",
    "tech",
    "outreach",
    "education",
    "events",
  ] as const;

  const posterTitles = [
    "Kickoff Vision Board",
    "Community Outreach Flyer",
    "Sponsor Deck Cover",
    "Workshop Series Promo",
    "Hackathon Save the Date",
    "Magazine Cover Concept",
    "Sports App Launch Teaser",
    "Seminar Registration Poster",
    "Fusion Event Banner",
    "Digitalizer Roadmap",
    "Flash Session Recap",
    "Family Network Welcome",
    "PROTOX Venue Map",
    "BTUI Main Stage Art",
  ];

  const posterValues = projectRows.flatMap((project, projectIndex) => {
    const baseX = 100 + (projectIndex % 3) * 400;
    const baseY = 100 + Math.floor(projectIndex / 3) * 280;
    return [0, 1].map((slot) => {
      const titleIndex = projectIndex * 2 + slot;
      const tagA = POSTER_TAGS[titleIndex % POSTER_TAGS.length];
      const tagB = POSTER_TAGS[(titleIndex + 2) % POSTER_TAGS.length];
      return {
        orgId: org.id,
        projectId: project.id,
        title: posterTitles[titleIndex] ?? `${project.name} Poster ${slot + 1}`,
        description: `Visual asset for ${project.name} — ${slot === 0 ? "primary" : "secondary"} campaign.`,
        imageUrl: null,
        tags: [tagA, tagB],
        canvasX: baseX + slot * 180,
        canvasY: baseY + slot * 120,
      };
    });
  });

  await db.insert(posters).values(posterValues);

  const schoolSeeds = [
    {
      name: "Royal College",
      district: "Colombo",
      province: "Western",
      contactName: "ICT Society Lead",
      contactEmail: "ict@royalcollege.lk",
      status: "active",
    },
    {
      name: "Nalanda College",
      district: "Colombo",
      province: "Western",
      contactName: "Computer Club President",
      contactEmail: "cc@nalanda.sch.lk",
      status: "active",
    },
    {
      name: "Visakha Vidyalaya",
      district: "Colombo",
      province: "Western",
      contactName: "ICT Society Secretary",
      contactEmail: "ict@visakha.sch.lk",
      status: "active",
    },
    {
      name: "Devi Balika",
      district: "Colombo",
      province: "Western",
      contactName: "Tech Club Coordinator",
      contactEmail: "tech@devibalika.sch.lk",
      status: "active",
    },
    {
      name: "D.S. Senanayake College",
      district: "Colombo",
      province: "Western",
      contactName: "ICT Coordinator",
      contactEmail: "ict@ds.sch.lk",
      status: "active",
    },
    {
      name: "Ananda College",
      district: "Colombo",
      province: "Western",
      contactName: "Computer Society",
      contactEmail: "cs@ananda.sch.lk",
      status: "inactive",
    },
    {
      name: "Dharmaraja College",
      district: "Kandy",
      province: "Central",
      contactName: "ICT Society",
      contactEmail: "ict@dharmaraja.sch.lk",
      status: "active",
    },
    {
      name: "Ladies' College",
      district: "Colombo",
      province: "Western",
      contactName: "STEM Club Lead",
      contactEmail: "stem@ladiescollege.lk",
      status: "active",
    },
  ];

  const projectIdList = projectRows.map((p) => p.id);
  await db.insert(networkSchools).values(
    schoolSeeds.map((school, index) => {
      const offset = index % projectIdList.length;
      const linked = [
        projectIdList[offset],
        projectIdList[(offset + 1) % projectIdList.length],
        projectIdList[(offset + 2) % projectIdList.length],
      ].slice(0, index % 2 === 0 ? 3 : 2);
      return {
        orgId: org.id,
        ...school,
        projectIds: linked,
      };
    }),
  );

  const collabSeeds = [
    {
      name: "Legion Offensive Security",
      organization: "Legion Offensive Security",
      role: "Cybersecurity Partner",
      email: "partnerships@legion.lk",
      type: "partner",
      projectName: "SparkIT'26",
    },
    {
      name: "TechLanka Foundation",
      organization: "TechLanka Foundation",
      role: "Education Partner",
      email: "hello@techlanka.org",
      type: "partner",
      projectName: "Tesseract'26",
    },
    {
      name: "Colombo Dev Community",
      organization: "CDC",
      role: "Mentorship Network",
      email: "team@cdc.lk",
      type: "partner",
      projectName: "PROTOX'26",
    },
    {
      name: "National ICT Agency",
      organization: "ICTA",
      role: "Program Sponsor",
      email: "grants@icta.lk",
      type: "sponsor",
      projectName: "Beyond The User Interface'26",
    },
    {
      name: "Royal Sports Council",
      organization: "RSC",
      role: "Sports Program Sponsor",
      email: "sponsors@royalsports.lk",
      type: "sponsor",
      projectName: "RC Sports App",
    },
    {
      name: "Dr. Anuki Perera",
      organization: "University of Colombo",
      role: "Technical Advisor",
      email: "anuki.perera@cmb.ac.lk",
      type: "advisor",
      projectName: "Digitalizer'26",
    },
  ];

  await db.insert(externalCollaborators).values(
    collabSeeds.map((c) => ({
      orgId: org.id,
      projectId: requireProject(c.projectName).id,
      name: c.name,
      organization: c.organization,
      role: c.role,
      email: c.email,
      type: c.type,
    })),
  );

  console.log("Seed complete.");
  console.log(`ORG_ID=${org.id}`);
  console.log(`PROJECTS=7`);
  console.log(`TASKS=${taskRows.length}`);
  console.log(`DEPENDENCIES=${dependencyRows.length}`);
  console.log(`POSTERS=${posterValues.length}`);
  console.log(`SCHOOLS=${schoolSeeds.length}`);
  console.log(`COLLABORATORS=${collabSeeds.length}`);
  console.log("Add to .env.local: NEXT_PUBLIC_ORG_ID=" + org.id);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
