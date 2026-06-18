import { ApprovalRelatedType, ApprovalRequest, ApprovalStage, ApprovalStageStatus, ApprovalStatus } from '../types';
import { generateId, todayISO } from './dateUtils';

const NEW_TYPES: ApprovalRelatedType[] = [
  'Project Approval',
  'Letter Approval',
  'Budget Approval',
  'Sponsor Proposal Approval',
  'Event Permission Approval',
  'External / Ministry Approval',
  'General Approval',
];

export function getApprovalTypeOptions(): ApprovalRelatedType[] {
  return NEW_TYPES;
}

export function normalizeApprovalTypeLabel(type: string): string {
  const map: Record<string, string> = {
    'PR Item': 'Letter Approval',
    File: 'Letter Approval',
    Sponsor: 'Sponsor Proposal Approval',
    Budget: 'Budget Approval',
    Task: 'General Approval',
    General: 'General Approval',
  };
  return map[type] ?? type;
}

function stage(title: string, sortOrder: number, status: ApprovalStageStatus = 'Not Started'): ApprovalStage {
  return { id: generateId(), title, sortOrder, status };
}

export function getStageTemplates(type: ApprovalRelatedType): ApprovalStage[] {
  const normalized = normalizeApprovalTypeLabel(type);
  switch (normalized) {
    case 'Project Approval':
      return [
        stage('Avenue Director Approved', 1),
        stage('Authorization Sheet Signed', 2),
        stage('Principal Signed', 3),
        stage('Ministry Approved', 4),
      ];
    case 'Letter Approval':
      return [
        stage('Draft Prepared', 1),
        stage('Teacher-in-Charge Reviewed', 2),
        stage('Principal Signed', 3),
        stage('Sent / Filed', 4),
      ];
    case 'Budget Approval':
      return [
        stage('Budget Drafted', 1),
        stage('Treasurer Reviewed', 2),
        stage('Executive Committee Approved', 3),
        stage('Teacher-in-Charge Approved', 4),
      ];
    case 'Sponsor Proposal Approval':
      return [
        stage('Proposal Drafted', 1),
        stage('Sponsorship Lead Reviewed', 2),
        stage('Treasurer Reviewed', 3),
        stage('Teacher-in-Charge Approved', 4),
      ];
    case 'Event Permission Approval':
      return [
        stage('Proposal Finalized', 1),
        stage('Teacher-in-Charge Approved', 2),
        stage('Principal Approved', 3),
        stage('Venue / External Permission Confirmed', 4),
      ];
    case 'External / Ministry Approval':
      return [
        stage('School Approval', 1),
        stage('Principal Signed', 2),
        stage('Zone / Ministry Submitted', 3),
        stage('Ministry Approved', 4),
      ];
    default:
      return [
        stage('Draft Prepared', 1),
        stage('Reviewed', 2),
        stage('Approved', 3),
      ];
  }
}

export function ensureApprovalStages(approval: ApprovalRequest): ApprovalStage[] {
  if (approval.stages && approval.stages.length > 0) {
    return [...approval.stages].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return getStageTemplates(approval.relatedType);
}

export function computeApprovalStatus(stages: ApprovalStage[]): ApprovalStatus {
  if (!stages.length) return 'Draft';
  if (stages.some((s) => s.status === 'Rejected')) return 'Rejected';
  if (stages.some((s) => s.status === 'Changes Requested')) return 'Changes Requested';
  if (stages.every((s) => s.status === 'Approved' || s.status === 'Skipped')) return 'Approved';
  if (stages.some((s) => s.status === 'Pending')) return 'Submitted';
  return 'Draft';
}

export function getCurrentStage(stages: ApprovalStage[]): ApprovalStage | undefined {
  const sorted = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.find((s) => s.status === 'Pending' || s.status === 'Changes Requested')
    ?? sorted.find((s) => s.status === 'Not Started')
    ?? sorted[sorted.length - 1];
}

export function getStageProgress(stages: ApprovalStage[]): { completed: number; total: number } {
  const total = stages.length;
  const completed = stages.filter((s) => s.status === 'Approved' || s.status === 'Skipped').length;
  return { completed, total };
}

export function updateStageStatus(
  stages: ApprovalStage[],
  stageId: string,
  status: ApprovalStageStatus,
): ApprovalStage[] {
  const now = todayISO();
  return stages.map((s) => {
    if (s.id !== stageId) return s;
    return {
      ...s,
      status,
      completedDate: status === 'Approved' || status === 'Skipped' ? (s.completedDate ?? now) : undefined,
    };
  });
}

export function deriveApprovalFromStages(approval: ApprovalRequest, stages: ApprovalStage[]): ApprovalRequest {
  const status = computeApprovalStatus(stages);
  const decided = status === 'Approved' || status === 'Rejected';
  return {
    ...approval,
    stages,
    status,
    decisionDate: decided ? (approval.decisionDate ?? todayISO()) : undefined,
  };
}

export function countStagesWaiting(stages: ApprovalStage[]): number {
  return stages.filter((s) => s.status === 'Pending').length;
}
