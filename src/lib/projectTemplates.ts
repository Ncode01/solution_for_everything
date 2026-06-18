/**
 * Project Templates — RCCS OS
 * Prefills phases, milestones, deliverables, tasks, launches, and event-day items.
 */

import {
  ProjectType,
  Phase,
  Milestone,
  Task,
  PRItem,
  Deliverable,
  EventDayItem,
  DeliverableType,
  EventDayItemCategory,
} from '../types';
import { generateId, todayISO } from './dateUtils';

export type ProjectTemplateId =
  | 'blank'
  | 'ict-day'
  | 'workshop'
  | 'outreach'
  | 'software'
  | 'publication'
  | 'hackathon'
  | 'internal-system';

export interface ProjectTemplate {
  id: ProjectTemplateId;
  name: string;
  description: string;
  projectType: ProjectType;
  suggestedStatus: 'Planning' | 'Idea' | 'Active';
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: 'blank', name: 'Blank Project', description: 'Start from scratch with no prefilled structure.', projectType: 'Mixed Project', suggestedStatus: 'Planning' },
  { id: 'ict-day', name: 'ICT Day / Competition', description: 'Online competitions, final event, post-event handover.', projectType: 'ICT Day / Competition / Event', suggestedStatus: 'Planning' },
  { id: 'workshop', name: 'Workshop / Seminar', description: 'Topic planning through session delivery and follow-up.', projectType: 'Educational Workshop / Seminar Series', suggestedStatus: 'Planning' },
  { id: 'outreach', name: 'Outreach Project', description: 'School visits, partner confirmation, and network follow-up.', projectType: 'Outreach / Workshop / Network Building', suggestedStatus: 'Planning' },
  { id: 'software', name: 'Software Product', description: 'Requirements through deployment and maintenance.', projectType: 'Software Product', suggestedStatus: 'Planning' },
  { id: 'publication', name: 'Publication', description: 'Submissions, editing, design, sponsor ads, and launch.', projectType: 'Publication', suggestedStatus: 'Planning' },
  { id: 'hackathon', name: 'Hackathon', description: 'Registration through judging and awards.', projectType: 'Hackathon', suggestedStatus: 'Planning' },
  { id: 'internal-system', name: 'Internal System', description: 'Requirements, prototype, build, test, deploy, handover.', projectType: 'Internal System', suggestedStatus: 'Planning' },
];

interface TemplateSeed {
  phaseNames: string[];
  milestones: string[];
  deliverables: { title: string; type: DeliverableType }[];
  tasks: string[];
  launches: string[];
  eventDayItems?: { title: string; category: EventDayItemCategory }[];
}

const TEMPLATE_SEEDS: Record<Exclude<ProjectTemplateId, 'blank'>, TemplateSeed> = {
  'ict-day': {
    phaseNames: ['Planning', 'Online Competitions', 'Final Event', 'Post-Event Handover'],
    milestones: [
      'Registration opens',
      'Registration closes',
      'Submissions close',
      'Finalists selected',
      'Event agenda finalized',
      'Awards prepared',
      'Final report completed',
    ],
    deliverables: [
      { title: 'Registration form', type: 'Registration Form' },
      { title: 'Launch poster', type: 'Poster' },
      { title: 'Sponsor proposal', type: 'Sponsor Proposal' },
      { title: 'Quiz/rules document', type: 'Quiz Set' },
      { title: 'Certificates', type: 'Certificate Set' },
      { title: 'Final report', type: 'Report' },
    ],
    tasks: [
      'Set up registration platform',
      'Confirm venue and AV requirements',
      'Prepare competition rules document',
      'Coordinate sponsor deliverables',
    ],
    launches: [
      'Theme teaser',
      'Registration opening',
      'Category reveal',
      'Sponsor reveal',
      'Countdown post',
      'Results post',
      'Thank-you post',
    ],
    eventDayItems: [
      { title: 'Registration desk ready', category: 'Registration' },
      { title: 'AV check complete', category: 'AV' },
      { title: 'Certificates arranged', category: 'Certificates' },
      { title: 'Guest arrival confirmed', category: 'Guest' },
      { title: 'Awards table ready', category: 'Stage' },
    ],
  },
  workshop: {
    phaseNames: ['Topic Planning', 'Speaker Confirmation', 'Registration', 'Session Delivery', 'Follow-up'],
    milestones: ['Topic finalized', 'Speaker confirmed', 'Registration opens', 'Session delivered', 'Feedback collected'],
    deliverables: [
      { title: 'Session poster', type: 'Poster' },
      { title: 'Speaker reveal', type: 'Caption' },
      { title: 'Registration form', type: 'Registration Form' },
      { title: 'Slide deck', type: 'Resource Pack' },
      { title: 'Attendance sheet', type: 'Report' },
      { title: 'Feedback summary', type: 'Report' },
    ],
    tasks: ['Confirm speaker availability', 'Book venue/room', 'Prepare session materials', 'Send post-session follow-up'],
    launches: ['Session announcement', 'Speaker reveal', 'Registration reminder', 'Session recap'],
    eventDayItems: [
      { title: 'Room setup complete', category: 'Logistics' },
      { title: 'AV check complete', category: 'AV' },
      { title: 'Attendance sheet ready', category: 'Registration' },
    ],
  },
  outreach: {
    phaseNames: ['School Selection', 'Partner Confirmation', 'Resource Planning', 'Event Delivery', 'Network Follow-up'],
    milestones: ['Partner schools selected', 'Visit dates confirmed', 'Resources prepared', 'Events delivered', 'Follow-up completed'],
    deliverables: [
      { title: 'Partner school list', type: 'Report' },
      { title: 'Visit agenda', type: 'Agenda' },
      { title: 'Resource pack', type: 'Resource Pack' },
      { title: 'Session poster', type: 'Poster' },
      { title: 'Feedback summary', type: 'Report' },
    ],
    tasks: ['Contact partner schools', 'Prepare teaching materials', 'Assign visit teams', 'Collect feedback forms'],
    launches: ['Outreach announcement', 'School visit reveal', 'Impact recap'],
    eventDayItems: [
      { title: 'Transport confirmed', category: 'Logistics' },
      { title: 'Materials packed', category: 'Logistics' },
      { title: 'Team briefing complete', category: 'Agenda' },
    ],
  },
  software: {
    phaseNames: ['Requirements', 'UI/UX', 'Development', 'Testing', 'Deployment', 'Maintenance'],
    milestones: ['Requirements signed off', 'UI prototype approved', 'MVP complete', 'Testing complete', 'Deployed', 'Handover done'],
    deliverables: [
      { title: 'Requirements document', type: 'Report' },
      { title: 'UI mockups', type: 'Other' },
      { title: 'User guide', type: 'Report' },
      { title: 'Deployment checklist', type: 'Report' },
    ],
    tasks: ['Define user stories', 'Set up repository', 'Write tests', 'Prepare deployment plan'],
    launches: ['Product teaser', 'Beta announcement', 'Launch post'],
  },
  publication: {
    phaseNames: ['Submissions', 'Editing', 'Design', 'Sponsor Ads', 'Launch', 'Archive'],
    milestones: ['Submission deadline', 'Editing complete', 'Design finalized', 'Sponsor ads placed', 'Published', 'Archived'],
    deliverables: [
      { title: 'Call for submissions', type: 'Caption' },
      { title: 'Edited articles', type: 'Report' },
      { title: 'Magazine layout', type: 'Other' },
      { title: 'Sponsor ad pages', type: 'Poster' },
      { title: 'Digital edition', type: 'Website Page' },
    ],
    tasks: ['Open submissions', 'Assign editors', 'Coordinate designers', 'Prepare launch campaign'],
    launches: ['Submission call', 'Sneak peek', 'Launch announcement', 'Thank sponsors'],
  },
  hackathon: {
    phaseNames: ['Registration', 'Shortlisting', 'Mentorship', 'Hackathon Day', 'Judging', 'Awards'],
    milestones: ['Registration opens', 'Teams shortlisted', 'Mentors assigned', 'Hackathon day', 'Judging complete', 'Awards announced'],
    deliverables: [
      { title: 'Registration form', type: 'Registration Form' },
      { title: 'Rules document', type: 'Report' },
      { title: 'Judging criteria', type: 'Report' },
      { title: 'Certificates', type: 'Certificate Set' },
    ],
    tasks: ['Set up registration', 'Recruit mentors', 'Prepare judging rubric', 'Coordinate prizes'],
    launches: ['Hackathon announcement', 'Registration open', 'Mentor reveal', 'Countdown', 'Winners announcement'],
    eventDayItems: [
      { title: 'Registration desk ready', category: 'Registration' },
      { title: 'Wi-Fi and power check', category: 'AV' },
      { title: 'Judging panel briefed', category: 'Agenda' },
      { title: 'Awards prepared', category: 'Stage' },
    ],
  },
  'internal-system': {
    phaseNames: ['Requirements', 'Prototype', 'Build', 'Test', 'Deploy', 'Handover'],
    milestones: ['Requirements approved', 'Prototype demo', 'Build complete', 'UAT passed', 'Deployed', 'Documentation handed over'],
    deliverables: [
      { title: 'Requirements spec', type: 'Report' },
      { title: 'System prototype', type: 'Other' },
      { title: 'User documentation', type: 'Report' },
      { title: 'Handover guide', type: 'Report' },
    ],
    tasks: ['Gather requirements', 'Build prototype', 'Implement core features', 'Write handover docs'],
    launches: ['Internal announcement', 'Training session invite'],
  },
};

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface AppliedTemplate {
  phases: Phase[];
  milestones: Milestone[];
  tasks: Task[];
  prItems: PRItem[];
  deliverables: Omit<Deliverable, 'projectId'>[];
  eventDayItems: Omit<EventDayItem, 'projectId'>[];
}

export function applyProjectTemplate(
  templateId: ProjectTemplateId,
  projectId: string,
  ownerId?: string,
  ownerName?: string,
): AppliedTemplate {
  if (templateId === 'blank') {
    return { phases: [], milestones: [], tasks: [], prItems: [], deliverables: [], eventDayItems: [] };
  }

  const seed = TEMPLATE_SEEDS[templateId];
  const now = todayISO();
  const phaseIds = seed.phaseNames.map(() => generateId());

  const phases: Phase[] = seed.phaseNames.map((name, i) => ({
    id: phaseIds[i],
    projectId,
    name,
    description: '',
    startDate: offsetDate(i * 14),
    endDate: offsetDate((i + 1) * 14 - 1),
    owner: ownerName ?? '',
    ownerId,
    status: i === 0 ? 'In Progress' : 'Not Started',
    progress: i === 0 ? 10 : 0,
  }));

  const milestones: Milestone[] = seed.milestones.map((name, i) => ({
    id: generateId(),
    projectId,
    phaseId: phaseIds[Math.min(Math.floor(i / 2), phaseIds.length - 1)],
    name,
    dueDate: offsetDate(7 + i * 10),
    owner: ownerName ?? '',
    ownerId,
    status: 'Not Started',
    description: '',
  }));

  const tasks: Task[] = seed.tasks.map((title, i) => ({
    id: generateId(),
    projectId,
    phaseId: phaseIds[0],
    title,
    description: '',
    assignee: ownerName ?? '',
    assigneeId: ownerId,
    dueDate: offsetDate(5 + i * 7),
    priority: 'Medium',
    status: 'To Do',
    createdAt: now,
  }));

  const prItems: PRItem[] = seed.launches.map((title, i) => ({
    id: generateId(),
    projectId,
    title,
    campaign: 'Launch Campaign',
    platform: 'Instagram',
    publishDate: offsetDate(14 + i * 7),
    publishTime: '18:00',
    designer: ownerName ?? '',
    designerId: ownerId,
    captionWriter: ownerName ?? '',
    captionWriterId: ownerId,
    reviewer: '',
    approvalStatus: 'Draft',
    publishingStatus: 'Idea',
    caption: '',
  }));

  const deliverables: Omit<Deliverable, 'projectId'>[] = seed.deliverables.map((d, i) => ({
    id: generateId(),
    title: d.title,
    type: d.type,
    description: '',
    owner: ownerName ?? '',
    ownerId,
    dueDate: offsetDate(10 + i * 8),
    status: 'Not Started',
    createdAt: now,
    updatedAt: now,
  }));

  const eventDayItems: Omit<EventDayItem, 'projectId'>[] = (seed.eventDayItems ?? []).map((e) => ({
    id: generateId(),
    title: e.title,
    category: e.category,
    owner: ownerName ?? '',
    ownerId,
    status: 'Not Ready',
    priority: 'Normal',
    createdAt: now,
    updatedAt: now,
  }));

  return { phases, milestones, tasks, prItems, deliverables, eventDayItems };
}

export function isEventLikeProjectType(type: ProjectType): boolean {
  return [
    'ICT Day / Competition / Event',
    'Outreach / Workshop / Network Building',
    'Educational Workshop / Seminar Series',
    'Hackathon',
    'Mixed Project',
  ].includes(type);
}
