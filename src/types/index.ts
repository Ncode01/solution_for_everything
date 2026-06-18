// ============================================================
// RCCS OS — Data Types
// All internal "person" fields now carry an optional *Id
// pointing to a Member.id, in addition to the legacy string
// display-name field (kept for backward compat / search).
// ============================================================

export type UserRole = 'Super Admin' | 'Executive Admin' | 'Project Admin' | 'Team Lead' | 'Member' | 'Viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export type ProjectStatus =
  | 'Idea'
  | 'Planning'
  | 'Active'
  | 'On Hold'
  | 'Event Week'
  | 'Completed'
  | 'Archived';

export type ProjectPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type ProjectType =
  | 'ICT Day / Competition / Event'
  | 'Outreach / Workshop / Network Building'
  | 'Educational Workshop / Seminar Series'
  | 'Internal System'
  | 'Publication'
  | 'Software Product'
  | 'Hackathon'
  | 'Mixed Project';

export type PhaseStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';

export type MilestoneStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Pending Approval'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled';

export type TaskStatus =
  | 'To Do'
  | 'Doing'
  | 'Waiting'
  | 'Review'
  | 'Approved'
  | 'Done'
  | 'Blocked';

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type PRApprovalStatus =
  | 'Draft'
  | 'Internal Review'
  | 'Teacher Review'
  | 'Approved'
  | 'Changes Requested';

export type PRPublishingStatus =
  | 'Idea'
  | 'Designing'
  | 'Scheduled'
  | 'Posted'
  | 'Archived';

export type PRPlatform =
  | 'Instagram'
  | 'Facebook'
  | 'LinkedIn'
  | 'WhatsApp'
  | 'Website'
  | 'YouTube'
  | 'Email';

export type PRWorkflowStatus =
  | 'Draft'
  | 'Sent to Designer'
  | 'Designer Accepted'
  | 'Designing'
  | 'Design Submitted'
  | 'In Approval'
  | 'Changes Requested'
  | 'Ready to Launch'
  | 'Scheduled'
  | 'Posted'
  | 'Archived';

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  /** Display name (legacy / fallback). Use ownerId when available. */
  owner: string;
  /** Member.id — set by MemberSelect */
  ownerId?: string;
  status: PhaseStatus;
  progress: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  dueDate: string;
  /** Display name (legacy / fallback). Use ownerId when available. */
  owner: string;
  /** Member.id — set by MemberSelect */
  ownerId?: string;
  status: MilestoneStatus;
  description: string;
}

export interface Task {
  id: string;
  projectId: string;
  phaseId?: string;
  milestoneId?: string;
  title: string;
  description: string;
  /** Display name (legacy / fallback). Use assigneeId when available. */
  assignee: string;
  /** Member.id — set by MemberSelect */
  assigneeId?: string;
  /** Display name (legacy / fallback). Use reviewerId when available. */
  reviewer?: string;
  /** Member.id — set by MemberSelect */
  reviewerId?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export interface PRItem {
  id: string;
  projectId: string;
  title: string;
  campaign: string;
  platform: PRPlatform;
  publishDate: string;
  publishTime: string;
  /** Display name (legacy / fallback). Use designerId when available. */
  designer: string;
  designerId?: string;
  /** Display name (legacy / fallback). Use captionWriterId when available. */
  captionWriter: string;
  captionWriterId?: string;
  /** Display name (legacy / fallback). Use reviewerId when available. */
  reviewer: string;
  reviewerId?: string;
  approvalStatus: PRApprovalStatus;
  publishingStatus: PRPublishingStatus;
  caption: string;
  designLink?: string;
  notes?: string;
  workflowStatus?: PRWorkflowStatus;
  designBrief?: string;
  designerAcceptedAt?: string;
  designSubmittedAt?: string;
  approvalSubmittedAt?: string;
  approvedAt?: string;
  postedAt?: string;
  archivedAt?: string;
  sourceFileLink?: string;
  finalDesignLink?: string;
}

export interface Project {
  id: string;
  name: string;
  year: number;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  description: string;
  /** Display name (legacy / fallback). Use ownerId when available. */
  owner: string;
  /** Member.id — set by MemberSelect */
  ownerId?: string;
  startDate: string;
  endDate: string;
  finalEventDate?: string;
  progress: number;
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  prItems: PRItem[];
  /** Pinned/favourited by user */
  pinned?: boolean;
  /** Project-level notes / activity */
  notes?: string;
}

// ============================================================
// Phase Two — Operational Modules
// ============================================================

export type Committee =
  | 'Executive'
  | 'PR & Media'
  | 'Development'
  | 'Sponsorship'
  | 'Finance'
  | 'Logistics'
  | 'Events'
  | 'Editorial'
  | 'Education'
  | 'General';

export type AvailabilityStatus = 'Available' | 'Busy' | 'Away' | 'Unavailable';

export type WorkloadLevel = 'Light' | 'Normal' | 'Heavy' | 'Overloaded';

export interface Member {
  id: string;
  name: string;
  displayName: string;
  role: string;
  committee: Committee;
  gradeOrClass: string;
  email?: string;
  phone?: string;
  skills: string[];
  availabilityStatus: AvailabilityStatus;
  workloadLevel: WorkloadLevel;
  activeProjectIds: string[];
  notes?: string;
}

export type MeetingType =
  | 'Executive Meeting'
  | 'Project Meeting'
  | 'PR Meeting'
  | 'Sponsorship Meeting'
  | 'Logistics Meeting'
  | 'Teacher Approval Meeting'
  | 'Post-Project Review';

export type ActionItemStatus = 'Open' | 'In Progress' | 'Done' | 'Cancelled';

export interface MeetingDecision {
  id: string;
  decision: string;
  /** Display name (legacy / fallback). Use ownerId when available. */
  owner?: string;
  ownerId?: string;
  date: string;
}

export interface MeetingActionItem {
  id: string;
  title: string;
  /** Display name (legacy / fallback). Use ownerId when available. */
  owner: string;
  ownerId?: string;
  dueDate: string;
  status: ActionItemStatus;
  linkedTaskId?: string;
}

export interface Meeting {
  id: string;
  projectId?: string;
  title: string;
  type: MeetingType;
  date: string;
  time: string;
  location?: string;
  /** Legacy: list of display names. Use attendeeIds when available. */
  attendees: string[];
  /** Member.id[] — set by MultiMemberSelect */
  attendeeIds?: string[];
  agenda: string;
  notes: string;
  decisions: MeetingDecision[];
  actionItems: MeetingActionItem[];
  nextMeetingDate?: string;
  createdAt: string;
}

export type SponsorStage =
  | 'Lead'
  | 'Contacted'
  | 'Interested'
  | 'Proposal Sent'
  | 'Meeting Scheduled'
  | 'Negotiating'
  | 'Confirmed'
  | 'Rejected'
  | 'Completed';

export type PaymentStatus =
  | 'Not Requested'
  | 'Pending'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue';

export type SponsorDeliverableStatus = 'Not Started' | 'In Progress' | 'Delivered' | 'Cancelled';

export interface SponsorDeliverable {
  id: string;
  title: string;
  dueDate?: string;
  status: SponsorDeliverableStatus;
  notes?: string;
}

export interface Sponsor {
  id: string;
  projectId: string;
  name: string;
  /** External contact — stays as free text (not an RCCS member) */
  contactPerson: string;
  contactNumber?: string;
  email?: string;
  packageName: string;
  amount: number;
  stage: SponsorStage;
  /** Display name (legacy / fallback). Use assignedMemberId when available. */
  assignedMember: string;
  /** Member.id — set by MemberSelect */
  assignedMemberId?: string;
  lastContactedDate?: string;
  nextFollowUpDate?: string;
  proposalLink?: string;
  agreementLink?: string;
  paymentStatus: PaymentStatus;
  deliverables: SponsorDeliverable[];
  notes?: string;
}

export interface Budget {
  id: string;
  projectId: string;
  expectedIncome: number;
  expectedExpense: number;
  confirmedIncome: number;
  confirmedExpense: number;
  notes?: string;
}

export type TransactionType = 'Income' | 'Expense';

export type TransactionCategory =
  | 'Venue'
  | 'Audio/Visual'
  | 'Lighting'
  | 'Decorations'
  | 'Certificates'
  | 'Medals'
  | 'Trophies'
  | 'Refreshments'
  | 'Transport'
  | 'Printing'
  | 'PR'
  | 'Web/IT'
  | 'Equipment'
  | 'Sponsorship'
  | 'Miscellaneous';

export interface ExpenseQuotation {
  id: string;
  sellerName: string;
  amount: number;
  contact?: string;
  quotationLink?: string;
  notes?: string;
  selected?: boolean;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  /** Display name (legacy). Use paidById when available. */
  paidBy?: string;
  paidById?: string;
  /** Display name (legacy). Use approvedById when available. */
  approvedBy?: string;
  approvedById?: string;
  receiptLink?: string;
  notes?: string;
  assignedMember?: string;
  assignedMemberId?: string;
  quotations?: ExpenseQuotation[];
}

export type ApprovalRelatedType =
  | 'Project Approval'
  | 'Letter Approval'
  | 'Budget Approval'
  | 'Sponsor Proposal Approval'
  | 'Event Permission Approval'
  | 'External / Ministry Approval'
  | 'General Approval'
  // legacy stored values
  | 'PR Item'
  | 'Budget'
  | 'Sponsor'
  | 'Task'
  | 'File'
  | 'General';

export type ApprovalStageStatus =
  | 'Not Started'
  | 'Pending'
  | 'Approved'
  | 'Changes Requested'
  | 'Rejected'
  | 'Skipped';

export interface ApprovalStage {
  id: string;
  title: string;
  owner?: string;
  ownerId?: string;
  status: ApprovalStageStatus;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  sortOrder: number;
}

export type ApprovalStatus =
  | 'Draft'
  | 'Submitted'
  | 'Changes Requested'
  | 'Approved'
  | 'Rejected';

export interface ApprovalRequest {
  id: string;
  projectId?: string;
  relatedType: ApprovalRelatedType;
  relatedId?: string;
  title: string;
  description: string;
  /** Display name (legacy). Use requestedById when available. */
  requestedBy: string;
  requestedById?: string;
  /** Display name (legacy). Use approverId when available. */
  approver: string;
  approverId?: string;
  status: ApprovalStatus;
  submittedDate: string;
  decisionDate?: string;
  comments?: string;
  stages?: ApprovalStage[];
}

export type FileCategory =
  | 'Project Proposal'
  | 'Budget'
  | 'PR'
  | 'Sponsorship'
  | 'Meeting Notes'
  | 'Invitations'
  | 'Certificates'
  | 'Designs'
  | 'Videos'
  | 'Event Agenda'
  | 'Final Report'
  | 'Receipts'
  | 'Other';

export type FileStatus = 'Draft' | 'Final' | 'Approved' | 'Archived';

export interface FileLink {
  id: string;
  projectId: string;
  title: string;
  category: FileCategory;
  url: string;
  /** Display name (legacy). Use ownerId when available. */
  owner: string;
  ownerId?: string;
  status: FileStatus;
  notes?: string;
  createdAt: string;
}

export type ReportType = 'Project Summary' | 'Post-Event Review' | 'Handover';

// ============================================================
// Phase Six — New Entity Types
// ============================================================

export type DeliverableType =
  | 'Poster'
  | 'Video'
  | 'Caption'
  | 'Sponsor Proposal'
  | 'Registration Form'
  | 'Agenda'
  | 'Certificate Set'
  | 'Report'
  | 'Website Page'
  | 'Quiz Set'
  | 'Resource Pack'
  | 'Other';

export type DeliverableStatus =
  | 'Not Started'
  | 'Drafting'
  | 'In Review'
  | 'Changes Requested'
  | 'Approved'
  | 'Published'
  | 'Completed'
  | 'Archived';

export interface Deliverable {
  id: string;
  projectId: string;
  phaseId?: string;
  milestoneId?: string;
  title: string;
  type: DeliverableType;
  description?: string;
  /** Member.id */
  ownerId?: string;
  owner?: string;
  dueDate?: string;
  status: DeliverableStatus;
  fileLinkId?: string;
  approvalRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventDayItemStatus = 'Not Ready' | 'Ready' | 'In Progress' | 'Completed' | 'Problem';
export type EventDayItemCategory =
  | 'Agenda'
  | 'Guest'
  | 'Registration'
  | 'AV'
  | 'Certificates'
  | 'Refreshments'
  | 'Stage'
  | 'Media'
  | 'Logistics'
  | 'Emergency'
  | 'Other';
export type EventDayItemPriority = 'Normal' | 'High' | 'Critical';

export interface EventDayItem {
  id: string;
  projectId: string;
  title: string;
  category: EventDayItemCategory;
  /** Member.id */
  ownerId?: string;
  owner?: string;
  scheduledTime?: string;
  status: EventDayItemStatus;
  priority: EventDayItemPriority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityItemType =
  | 'task_created'
  | 'task_done'
  | 'launch_approved'
  | 'launch_posted'
  | 'sponsor_changed'
  | 'payment_changed'
  | 'transaction_added'
  | 'approval_decision'
  | 'meeting_action_created'
  | 'deliverable_completed'
  | 'report_generated'
  | 'event_day_problem'
  | 'event_day_completed'
  | 'project_created'
  | 'project_updated'
  | 'general';

export interface ActivityItem {
  id: string;
  projectId?: string;
  actorId?: string;
  actorName?: string;
  type: ActivityItemType;
  summary: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;

  // Local-only: link to related entity for navigation
  link?: string;
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  type: ReportType;
  summary: string;
  generatedDate: string;
  sections: string;
  notes?: string;
}

export interface AppData {
  projects: Project[];
  members: Member[];
  meetings: Meeting[];
  sponsors: Sponsor[];
  budgets: Budget[];
  transactions: Transaction[];
  approvals: ApprovalRequest[];
  fileLinks: FileLink[];
  reports: Report[];
  deliverables: Deliverable[];
  eventDayItems: EventDayItem[];
  activityItems: ActivityItem[];
}

export interface AppState {
  projects: Project[];
}
