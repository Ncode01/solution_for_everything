import { AppData } from '../types';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

export function globalSearch(data: AppData, queryRaw: string, limit = 12): SearchResult[] {
  const query = queryRaw.trim().toLowerCase();
  if (!query) return [];

  const { projects, members, sponsors, meetings, approvals, fileLinks } = data;
  const results: SearchResult[] = [];
  const match = (s?: string) => !!s && s.toLowerCase().includes(query);
  const nameOf = (id?: string) => projects.find((p) => p.id === id)?.name ?? '';

  projects.forEach((p) => {
    if (match(p.name) || match(p.type) || match(p.owner)) {
      results.push({ id: p.id, type: 'Project', title: p.name, subtitle: `${p.status} · ${p.type}`, link: `/projects/${p.id}` });
    }
    p.tasks.forEach((t) => {
      if (match(t.title) || match(t.assignee)) {
        results.push({ id: t.id, type: 'Task', title: t.title, subtitle: `${p.name} · ${t.status}`, link: `/projects/${p.id}` });
      }
    });
    p.milestones.forEach((m) => {
      if (match(m.name)) {
        results.push({ id: m.id, type: 'Milestone', title: m.name, subtitle: `${p.name} · ${m.status}`, link: `/projects/${p.id}` });
      }
    });
    p.prItems.forEach((pr) => {
      if (match(pr.title) || match(pr.campaign)) {
        results.push({ id: pr.id, type: 'PR Item', title: pr.title, subtitle: `${p.name} · ${pr.approvalStatus}`, link: '/pr-planner' });
      }
    });
  });

  members.forEach((m) => {
    if (match(m.name) || match(m.role) || match(m.committee) || m.skills.some(match)) {
      results.push({ id: m.id, type: 'Member', title: m.name, subtitle: `${m.role} · ${m.committee}`, link: '/members' });
    }
  });

  sponsors.forEach((s) => {
    if (match(s.name) || match(s.packageName) || match(s.assignedMember)) {
      results.push({ id: s.id, type: 'Sponsor', title: s.name, subtitle: `${nameOf(s.projectId)} · ${s.stage}`, link: '/budget' });
    }
  });

  const { transactions } = data;
  transactions.forEach((t) => {
    if (match(t.category) || match(t.notes) || match(t.paidBy)) {
      results.push({ id: t.id, type: 'Transaction', title: `${t.category} — ${t.type}`, subtitle: `${nameOf(t.projectId)} · Rs ${t.amount.toLocaleString('en-LK')}`, link: '/budget' });
    }
  });

  meetings.forEach((mt) => {
    if (match(mt.title) || match(mt.type) || match(mt.agenda)) {
      results.push({ id: mt.id, type: 'Meeting', title: mt.title, subtitle: `${mt.type} · ${mt.date}`, link: '/meetings' });
    }
  });

  approvals.forEach((a) => {
    if (match(a.title) || match(a.description)) {
      results.push({ id: a.id, type: 'Approval', title: a.title, subtitle: `${nameOf(a.projectId) || 'General'} · ${a.status}`, link: '/approvals' });
    }
  });

  fileLinks.forEach((f) => {
    if (match(f.title) || match(f.category) || match(f.notes)) {
      results.push({ id: f.id, type: 'File Link', title: f.title, subtitle: `${nameOf(f.projectId)} · ${f.category}`, link: `/projects/${f.projectId}` });
    }
  });

  return results.slice(0, limit);
}
