import type { NodeTypes } from "@xyflow/react";
import TaskNode from "./TaskNode";
import CommentNode from "./CommentNode";
import OrgNode from "./OrgNode";
import GroupNode from "./GroupNode";
import { ProjectClusterNode } from "@/components/canvas/nodes/ProjectClusterNode";
import { PhaseClusterNode } from "@/components/canvas/nodes/PhaseClusterNode";
import { PersonAvatarNode } from "@/components/canvas/nodes/PersonAvatarNode";
import { MilestoneNode } from "@/components/canvas/nodes/MilestoneNode";
import { PhaseHeaderNode } from "@/components/canvas/nodes/PhaseHeaderNode";
import { MicroTaskNode } from "@/components/canvas/nodes/MicroTaskNode";
import { EpicTaskNode } from "@/components/canvas/nodes/EpicTaskNode";
import { BlockedTaskNode } from "@/components/canvas/nodes/BlockedTaskNode";
import { CriticalPathTaskNode } from "@/components/canvas/nodes/CriticalPathTaskNode";
import { ReviewTaskNode } from "@/components/canvas/nodes/ReviewTaskNode";
import { RecurringTaskNode } from "@/components/canvas/nodes/RecurringTaskNode";
import { ChecklistTaskNode } from "@/components/canvas/nodes/ChecklistTaskNode";
import { CostTaskNode } from "@/components/canvas/nodes/CostTaskNode";
import { GanttMiniBarNode } from "@/components/canvas/nodes/GanttMiniBarNode";
import { RiskFlagNode } from "@/components/canvas/nodes/RiskFlagNode";
import { ApprovalGateNode } from "@/components/canvas/nodes/ApprovalGateNode";
import { DecisionDiamondNode } from "@/components/canvas/nodes/DecisionDiamondNode";
import { CollabNoteNode } from "@/components/canvas/nodes/CollabNoteNode";
import { BudgetGaugeNode } from "@/components/canvas/nodes/BudgetGaugeNode";
import { BudgetSummaryCardNode } from "@/components/canvas/nodes/BudgetSummaryCardNode";
import { BurnRateSparklineNode } from "@/components/canvas/nodes/BurnRateSparklineNode";
import { WorkloadCardNode } from "@/components/canvas/nodes/WorkloadCardNode";
import { AssignmentMatrixNode } from "@/components/canvas/nodes/AssignmentMatrixNode";
import { PhaseProgressRingNode } from "@/components/canvas/nodes/PhaseProgressRingNode";
import { HealthScoreCardNode } from "@/components/canvas/nodes/HealthScoreCardNode";
import { StatusMatrixNode } from "@/components/canvas/nodes/StatusMatrixNode";
import { PRStatusNode } from "@/components/canvas/nodes/PRStatusNode";
import { ExternalLinkCardNode } from "@/components/canvas/nodes/ExternalLinkCardNode";
import { WarpGateNode } from "@/components/canvas/nodes/WarpGateNode";

export const nodeTypes: NodeTypes = {
  taskCard: TaskNode,
  projectCluster: ProjectClusterNode,
  projectEnvelope: GroupNode,
  phaseCluster: PhaseClusterNode,
  personAvatar: PersonAvatarNode,
  milestoneNode: MilestoneNode,
  phaseHeader: PhaseHeaderNode,
  microTask: MicroTaskNode,
  epicTask: EpicTaskNode,
  blockedTask: BlockedTaskNode,
  criticalPathTask: CriticalPathTaskNode,
  reviewTask: ReviewTaskNode,
  recurringTask: RecurringTaskNode,
  checklistTask: ChecklistTaskNode,
  costTask: CostTaskNode,
  ganttMiniBar: GanttMiniBarNode,
  riskFlag: RiskFlagNode,
  approvalGate: ApprovalGateNode,
  decisionDiamond: DecisionDiamondNode,
  collabNote: CollabNoteNode,
  budgetGauge: BudgetGaugeNode,
  budgetSummaryCard: BudgetSummaryCardNode,
  burnRateSparkline: BurnRateSparklineNode,
  workloadCard: WorkloadCardNode,
  teamCluster: OrgNode,
  assignmentMatrix: AssignmentMatrixNode,
  phaseProgressRing: PhaseProgressRingNode,
  healthScoreCard: HealthScoreCardNode,
  statusMatrix: StatusMatrixNode,
  prStatus: PRStatusNode,
  externalLinkCard: ExternalLinkCardNode,
  stickyNote: CommentNode,
  warpGate: WarpGateNode,
};

export { default as TaskNode } from "./TaskNode";
export { default as CommentNode } from "./CommentNode";
export { default as StatsNode } from "./StatsNode";
export { default as OrgNode } from "./OrgNode";
export { default as GroupNode } from "./GroupNode";
