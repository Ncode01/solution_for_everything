import type { ProjectClusterEnhancements } from "./project-extensions";

// ── Status & Priority ──────────────────────────────
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "in_review"
  | "done";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export type DependencyType = "FS" | "FF" | "SS";

export type ZoomLevel = "Z0" | "Z1" | "Z2" | "Z3";

export type ActiveLayer = "default" | "workload" | "criticalPath";

export type LoadLevel = "available" | "at_capacity" | "overloaded";

export type ProjectAccentColor = "coral" | "amber" | "violet" | "sky" | "mint";

// ── Domain Types ───────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  initials: string;
  email: string;
  avatarUrl?: string;
  role: string;
  loadLevel: LoadLevel;
  taskCount: number;
  loadPercent: number;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  color: ProjectAccentColor;
  status: ProjectStatus;
  ownerId: string;
  startDate?: Date;
  endDate?: Date;
  completionPercent: number;
  phases: Phase[];
  members: string[];
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  orderIndex: number;
  completionPercent: number;
  taskCount: number;
  doneCount: number;
}

export interface Task {
  id: string;
  phaseId: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  effortEstimate?: number;
  dueDate?: Date;
  canvasX: number;
  canvasY: number;
  isCriticalPath: boolean;
  slackTime?: number;
  earlyStart?: number;
  earlyFinish?: number;
  lateStart?: number;
  lateFinish?: number;
  dependencies: string[];
  dependents: string[];
}

export interface TaskDependency {
  upstreamTaskId: string;
  downstreamTaskId: string;
  type: DependencyType;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface CanvasBookmark {
  id: string;
  userId: string;
  name: string;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
}

export interface CascadeRisk {
  blockedTaskId: string;
  estimatedDelay: number;
  affectedTaskIds: string[];
  quickestResolution?: string;
}

export interface CPMResult {
  criticalPath: string[];
  taskFloats: Record<string, number>;
  projectDuration: number;
  cascadeRisks: CascadeRisk[];
}

// ── ReactFlow Node Data Types ──────────────────────
export interface ProjectClusterNodeData extends Partial<ProjectClusterEnhancements> {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: (projectId: string) => void;
  [key: string]: unknown;
}

export interface PhaseClusterNodeData {
  phase: Phase;
  projectColor: ProjectAccentColor;
  [key: string]: unknown;
}

export interface TaskCardNodeData {
  /** Set by semantic zoom when zoom > 1.5 */
  detailed?: boolean;
  task: Task;
  assignees: User[];
  projectColor: ProjectAccentColor;
  isCriticalPath: boolean;
  slackTime?: number;
  isExpanded?: boolean;
  [key: string]: unknown;
}

export interface PersonAvatarNodeData {
  user: User;
  isVisible: boolean;
  projectIds: string[];
  [key: string]: unknown;
}

export type {
  BudgetEntry,
  BudgetSummary,
  CrossProjectLink,
  Milestone,
  MilestoneNodeData,
  OrgRole,
  ProjectHealthScore,
  ProjectType,
} from "./project-extensions";
