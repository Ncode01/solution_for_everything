import { PRItem, PRWorkflowStatus } from '../types';

/** Three pipeline tabs shown on Launches page */
export const DISPLAY_LANES = ['Sent to Designer', 'In Approval', 'Ready to Post'] as const;
export type DisplayLane = typeof DISPLAY_LANES[number];

/** @deprecated use DISPLAY_LANES */
export const WORKFLOW_LANES = DISPLAY_LANES;

export function getPRWorkflowStatus(item: PRItem): PRWorkflowStatus {
  if (item.workflowStatus) return item.workflowStatus;

  if (item.publishingStatus === 'Archived' || item.publishingStatus === 'Posted') {
    return item.publishingStatus === 'Posted' ? 'Posted' : 'Archived';
  }
  if (item.publishingStatus === 'Scheduled') return 'Scheduled';
  if (item.approvalStatus === 'Changes Requested') return 'Changes Requested';
  if (item.approvalStatus === 'Internal Review' || item.approvalStatus === 'Teacher Review') {
    return 'In Approval';
  }
  if (item.approvalStatus === 'Approved') return 'Ready to Launch';
  if (item.publishingStatus === 'Designing') return 'Designing';
  if (item.publishingStatus === 'Idea' && item.approvalStatus === 'Draft') return 'Draft';

  return 'Draft';
}

export function getFinalDesignLink(item: PRItem): string {
  return item.finalDesignLink || item.designLink || '';
}

export function getDesignBrief(item: PRItem): string {
  return item.designBrief || item.notes || '';
}

export function getMissingChips(item: PRItem): string[] {
  const chips: string[] = [];
  const status = getPRWorkflowStatus(item);
  if (!item.designerId && !item.designer) chips.push('Missing designer');
  if (!getDesignBrief(item).trim()) chips.push('Missing brief');
  if (!item.caption?.trim()) chips.push('Missing caption');
  if (!getFinalDesignLink(item).trim() && !['Draft', 'Sent to Designer', 'Designer Accepted', 'Designing'].includes(status)) {
    chips.push('Missing design link');
  }
  if (status === 'In Approval' || status === 'Design Submitted') chips.push('Waiting approval');
  return chips;
}

export function syncLegacyFromWorkflow(item: PRItem, workflowStatus: PRWorkflowStatus): PRItem {
  const now = new Date().toISOString();
  const updated = { ...item, workflowStatus };

  switch (workflowStatus) {
    case 'Draft':
      updated.approvalStatus = 'Draft';
      updated.publishingStatus = 'Idea';
      break;
    case 'Sent to Designer':
      updated.approvalStatus = 'Draft';
      updated.publishingStatus = 'Idea';
      break;
    case 'Designer Accepted':
    case 'Designing':
      updated.approvalStatus = 'Draft';
      updated.publishingStatus = 'Designing';
      break;
    case 'Design Submitted':
    case 'In Approval':
      updated.approvalStatus = 'Internal Review';
      updated.publishingStatus = 'Designing';
      break;
    case 'Changes Requested':
      updated.approvalStatus = 'Changes Requested';
      updated.publishingStatus = 'Designing';
      break;
    case 'Ready to Launch':
      updated.approvalStatus = 'Approved';
      updated.publishingStatus = 'Designing';
      break;
    case 'Scheduled':
      updated.approvalStatus = 'Approved';
      updated.publishingStatus = 'Scheduled';
      break;
    case 'Posted':
      updated.approvalStatus = 'Approved';
      updated.publishingStatus = 'Posted';
      updated.postedAt = updated.postedAt || now;
      break;
    case 'Archived':
      updated.approvalStatus = 'Approved';
      updated.publishingStatus = 'Archived';
      updated.archivedAt = updated.archivedAt || now;
      if (!updated.postedAt) updated.postedAt = now;
      break;
    default:
      break;
  }

  const finalLink = getFinalDesignLink(updated);
  if (finalLink) {
    updated.designLink = finalLink;
    updated.finalDesignLink = finalLink;
  }

  return updated;
}

export function validateWorkflowTransition(item: PRItem, next: PRWorkflowStatus): string | null {
  const brief = getDesignBrief(item);
  const finalLink = getFinalDesignLink(item);
  const hasSource = !!(item.sourceFileLink?.trim() || finalLink.trim());
  const hasDesigner = !!(item.designerId || item.designer);

  switch (next) {
    case 'Sent to Designer':
      if (!hasDesigner) return 'Select a designer before sending.';
      if (!brief.trim()) return 'Add a design brief before sending to designer.';
      break;
    case 'Designer Accepted':
      if (!hasDesigner) return 'A designer must be assigned.';
      break;
    case 'Design Submitted':
      if (!hasSource) return 'Add a PSD/source file link or final design link.';
      break;
    case 'In Approval':
      if (!finalLink.trim()) return 'Add a final design link before sending to approval.';
      break;
    case 'Designing':
      if (!hasSource && !finalLink.trim()) return 'Add a design link before submitting.';
      break;
    case 'Ready to Launch':
      if (item.approvalStatus !== 'Approved' && getPRWorkflowStatus(item) !== 'In Approval') {
        // allow transition from In Approval when marking approved
      }
      break;
    case 'Posted':
      if (!item.publishDate) return 'Set a publish date or confirm posting.';
      break;
    default:
      break;
  }
  return null;
}

export function laneForStatus(status: PRWorkflowStatus): DisplayLane | 'Archived' {
  if (status === 'Posted' || status === 'Archived') return 'Archived';
  if (['In Approval', 'Design Submitted'].includes(status)) return 'In Approval';
  if (['Ready to Launch', 'Scheduled'].includes(status)) return 'Ready to Post';
  return 'Sent to Designer';
}

export function isAssignedDesigner(
  item: PRItem,
  member?: { id: string; displayName: string; name: string },
): boolean {
  if (!member) return false;
  if (item.designerId) return item.designerId === member.id;
  return item.designer === member.displayName || item.designer === member.name;
}

export function isChairmanOrSecretary(member?: { role: string }): boolean {
  if (!member) return false;
  const role = member.role.toLowerCase();
  return role.includes('chairman') || role.includes('secretary');
}
