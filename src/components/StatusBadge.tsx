import React from 'react';

// Soft, readable badge palette. Each entry is bg + text + subtle border.
const COLOR_MAP: Record<string, string> = {
  // Project status
  Idea: 'bg-slate-800 text-slate-300 border-slate-700',
  Planning: 'bg-blue-950 text-blue-300 border-blue-900',
  Active: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  'On Hold': 'bg-amber-950 text-amber-300 border-amber-900',
  'Event Week': 'bg-violet-950 text-violet-300 border-violet-900',
  Completed: 'bg-green-950 text-green-300 border-green-900',
  Archived: 'bg-slate-800 text-slate-500 border-slate-700',
  // Phase / Milestone / generic progress
  'Not Started': 'bg-slate-800 text-slate-400 border-slate-700',
  'In Progress': 'bg-blue-950 text-blue-300 border-blue-900',
  Blocked: 'bg-red-950 text-red-300 border-red-900',
  'Pending Approval': 'bg-amber-950 text-amber-300 border-amber-900',
  Delayed: 'bg-orange-950 text-orange-300 border-orange-900',
  Cancelled: 'bg-slate-800 text-slate-500 border-slate-700',
  Delivered: 'bg-green-950 text-green-300 border-green-900',
  // Task
  'To Do': 'bg-slate-800 text-slate-300 border-slate-700',
  Doing: 'bg-blue-950 text-blue-300 border-blue-900',
  Waiting: 'bg-amber-950 text-amber-300 border-amber-900',
  Review: 'bg-violet-950 text-violet-300 border-violet-900',
  Approved: 'bg-teal-950 text-teal-300 border-teal-900',
  Done: 'bg-green-950 text-green-300 border-green-900',
  // PR approval / approvals
  Draft: 'bg-slate-800 text-slate-400 border-slate-700',
  Submitted: 'bg-blue-950 text-blue-300 border-blue-900',
  'Internal Review': 'bg-amber-950 text-amber-300 border-amber-900',
  'Teacher Review': 'bg-orange-950 text-orange-300 border-orange-900',
  'Changes Requested': 'bg-red-950 text-red-300 border-red-900',
  Rejected: 'bg-red-950 text-red-300 border-red-900',
  // PR publishing
  Designing: 'bg-violet-950 text-violet-300 border-violet-900',
  Scheduled: 'bg-teal-950 text-teal-300 border-teal-900',
  Posted: 'bg-green-950 text-green-300 border-green-900',
  // Priority
  Urgent: 'bg-red-950 text-red-300 border-red-900',
  High: 'bg-orange-950 text-orange-300 border-orange-900',
  Medium: 'bg-amber-950 text-amber-300 border-amber-900',
  Low: 'bg-slate-800 text-slate-400 border-slate-700',
  // Sponsor stages
  Lead: 'bg-slate-800 text-slate-300 border-slate-700',
  Contacted: 'bg-blue-950 text-blue-300 border-blue-900',
  Interested: 'bg-cyan-950 text-cyan-300 border-cyan-900',
  'Proposal Sent': 'bg-indigo-950 text-indigo-300 border-indigo-900',
  'Meeting Scheduled': 'bg-violet-950 text-violet-300 border-violet-900',
  Negotiating: 'bg-amber-950 text-amber-300 border-amber-900',
  Confirmed: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  // Payment status
  'Not Requested': 'bg-slate-800 text-slate-400 border-slate-700',
  Pending: 'bg-amber-950 text-amber-300 border-amber-900',
  'Partially Paid': 'bg-blue-950 text-blue-300 border-blue-900',
  Paid: 'bg-green-950 text-green-300 border-green-900',
  Overdue: 'bg-red-950 text-red-300 border-red-900',
  // Workload
  Light: 'bg-slate-800 text-slate-300 border-slate-700',
  Normal: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  Heavy: 'bg-amber-950 text-amber-300 border-amber-900',
  Overloaded: 'bg-red-950 text-red-300 border-red-900',
  // Availability
  Available: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  Busy: 'bg-amber-950 text-amber-300 border-amber-900',
  Away: 'bg-slate-800 text-slate-400 border-slate-700',
  Unavailable: 'bg-red-950 text-red-300 border-red-900',
  // File status
  Final: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  Open: 'bg-blue-950 text-blue-300 border-blue-900',
  // Health labels
  Healthy: 'bg-emerald-950 text-emerald-300 border-emerald-900',
  'Needs Attention': 'bg-amber-950 text-amber-300 border-amber-900',
  'At Risk': 'bg-red-950 text-red-300 border-red-900',
  // Attention inline
  Soon: 'bg-amber-950 text-amber-300 border-amber-900',
  Today: 'bg-blue-950 text-blue-300 border-blue-900',
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const color = COLOR_MAP[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${color} ${sizeClass}`}>
      {status}
    </span>
  );
}
