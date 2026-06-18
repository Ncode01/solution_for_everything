import React from 'react';

const COLOR_MAP: Record<string, string> = {
  Idea: 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  Planning: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Active: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  'On Hold': 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  'Event Week': 'bg-[var(--launch-soft)] text-[var(--launch)] border-[rgba(183,156,255,0.22)]',
  Completed: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Archived: 'bg-[rgba(255,255,255,0.04)] text-[var(--text-faint)] border-[var(--border-subtle)]',
  'Not Started': 'bg-[rgba(255,255,255,0.04)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
  'In Progress': 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Blocked: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  'Pending Approval': 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Delayed: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Cancelled: 'bg-[rgba(255,255,255,0.04)] text-[var(--text-faint)] border-[var(--border-subtle)]',
  Delivered: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  'To Do': 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  Doing: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Waiting: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Review: 'bg-[var(--launch-soft)] text-[var(--launch)] border-[rgba(183,156,255,0.22)]',
  Approved: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Done: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Draft: 'bg-[rgba(255,255,255,0.04)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
  Submitted: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  'Internal Review': 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  'Teacher Review': 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  'Changes Requested': 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Rejected: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Designing: 'bg-[var(--launch-soft)] text-[var(--launch)] border-[rgba(183,156,255,0.22)]',
  Scheduled: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Posted: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Urgent: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  High: 'bg-[rgba(255,107,107,0.08)] text-[var(--danger)] border-[rgba(255,107,107,0.18)]',
  Medium: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Low: 'bg-[rgba(255,255,255,0.04)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
  Lead: 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  Contacted: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Interested: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  'Proposal Sent': 'bg-[var(--launch-soft)] text-[var(--launch)] border-[rgba(183,156,255,0.22)]',
  'Meeting Scheduled': 'bg-[var(--launch-soft)] text-[var(--launch)] border-[rgba(183,156,255,0.22)]',
  Negotiating: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Confirmed: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  'Not Requested': 'bg-[rgba(255,255,255,0.04)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
  Pending: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  'Partially Paid': 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Paid: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Overdue: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Light: 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  Normal: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Heavy: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Overloaded: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Available: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Busy: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Away: 'bg-[rgba(255,255,255,0.04)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
  Unavailable: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Final: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  Open: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
  Healthy: 'bg-[var(--success-soft)] text-[var(--success)] border-[rgba(66,211,146,0.2)]',
  'Needs Attention': 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  'At Risk': 'bg-[var(--danger-soft)] text-[var(--danger)] border-[rgba(255,107,107,0.22)]',
  Soon: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[rgba(244,199,107,0.22)]',
  Today: 'bg-[var(--royal-soft)] text-[var(--accent)] border-[var(--royal-glow)]',
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
  subtle?: boolean;
}

export default function StatusBadge({ status, size = 'sm', subtle = false }: Props) {
  const color = COLOR_MAP[status] || 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClass} ${subtle ? 'opacity-75' : ''}`}>
      {status}
    </span>
  );
}
