import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, BookOpen, Copy, ExternalLink, FileText, Link2, Plus, Printer, ScrollText, Search, Trash2, Wand2 } from 'lucide-react';
import { Report } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { generateProjectReport, generateHandoverReport } from '../../lib/report';
import { generateId, todayISO, formatDate } from '../../lib/dateUtils';
import ScreenCanvas from '../../components/layout/ScreenCanvas';
import CommandHero from '../../components/layout/CommandHero';
import FinderView from '../../components/layout/FinderView';
import EmptyMoment from '../../components/layout/EmptyMoment';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import FileLinkForm from '../files/FileLinkForm';

type Section = 'reports' | 'files' | 'audit' | 'archives' | 'handover';

const SECTION_LABELS: Record<Section, string> = {
  reports: 'Reports',
  files: 'Files',
  audit: 'Audit',
  archives: 'Archives',
  handover: 'Handover',
};

export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const { data, saveReport, deleteReport, saveFileLink, deleteFileLink } = useAppData();
  const activeSection: Section = (params.get('section') as Section) ?? 'reports';
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? '');
  const [preview, setPreview] = useState<{ title: string; summary: string; sections: string; type: 'Project Summary' | 'Handover' } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; kind: 'report' | 'file' } | null>(null);

  const project = data.projects.find((item) => item.id === projectId);
  const auditItems = [...(data.activityItems ?? [])].reverse();
  const archives = data.projects.filter((item) => item.status === 'Archived' || item.status === 'Completed');

  const items = useMemo(() => {
    if (activeSection === 'reports') {
      return data.reports.filter((report) => report.type !== 'Handover').map((report) => ({
        id: report.id,
        title: report.title,
        subtitle: `${data.projects.find((projectItem) => projectItem.id === report.projectId)?.name ?? report.projectId} · ${formatDate(report.generatedDate)}`,
        body: report.summary,
        raw: report,
      }));
    }
    if (activeSection === 'handover') {
      return data.reports.filter((report) => report.type === 'Handover').map((report) => ({
        id: report.id,
        title: report.title,
        subtitle: `${data.projects.find((projectItem) => projectItem.id === report.projectId)?.name ?? report.projectId} · ${formatDate(report.generatedDate)}`,
        body: report.summary,
        raw: report,
      }));
    }
    if (activeSection === 'files') {
      return data.fileLinks.map((file) => ({
        id: file.id,
        title: file.title,
        subtitle: `${data.projects.find((projectItem) => projectItem.id === file.projectId)?.name ?? file.projectId} · ${file.category}`,
        body: file.url,
        raw: file,
      }));
    }
    if (activeSection === 'audit') {
      return auditItems.map((item) => ({
        id: item.id,
        title: item.summary,
        subtitle: item.projectId ? data.projects.find((projectItem) => projectItem.id === item.projectId)?.name ?? 'RCCS OS' : 'RCCS OS',
        body: new Date(item.createdAt).toLocaleString('en-GB'),
        raw: item,
      }));
    }
    return archives.map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.status} · ${item.year}`,
      body: item.type,
      raw: item,
    }));
  }, [activeSection, archives, auditItems, data.fileLinks, data.projects, data.reports]);

  const filtered = items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()) || item.subtitle.toLowerCase().includes(search.toLowerCase()));
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function setSection(section: Section) {
    setParams({ section });
    setSelectedId(null);
  }

  function generate(kind: 'Project Summary' | 'Handover') {
    if (!project) return;
    const result = kind === 'Handover' ? generateHandoverReport(data, project) : generateProjectReport(data, project);
    setPreview({ ...result, type: kind });
    setSection(kind === 'Handover' ? 'handover' : 'reports');
  }

  function savePreview() {
    if (!preview || !project) return;
    saveReport({ id: generateId(), projectId: project.id, title: preview.title, type: preview.type, summary: preview.summary, sections: preview.sections, generatedDate: todayISO() });
    setPreview(null);
  }

  function copyPreview() {
    if (!preview) return;
    navigator.clipboard.writeText(`${preview.title}\n\n${preview.summary}\n\n${preview.sections}`);
  }

  function printPreview() {
    if (!preview) return;
    window.print();
  }

  return (
    <ScreenCanvas variant="document">
      <CommandHero
        title="Library"
        description="Reports, files, audit, archives, and handover records."
        primaryAction={activeSection === 'files' ? <button className="btn-primary" onClick={() => setModal({ open: true })}><Plus size={15} /> Add File</button> : undefined}
        secondaryActions={(
          <div className="flex flex-wrap gap-2">
            <select className="select w-48" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {data.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => generate('Project Summary')}><Wand2 size={14} /> Generate Report</button>
            <button className="btn-secondary" onClick={() => generate('Handover')}><ScrollText size={14} /> Generate Handover</button>
          </div>
        )}
      />

      {preview && (
        <div className="glass-panel rounded-[var(--radius-xl)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-[var(--text-primary)]">{preview.title}</div>
              <div className="mt-1 text-sm text-[var(--text-tertiary)]">{preview.summary}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={savePreview}>Save</button>
              <button className="btn-secondary" onClick={copyPreview}><Copy size={13} /> Copy</button>
              <button className="btn-secondary" onClick={printPreview}><Printer size={13} /> Print</button>
            </div>
          </div>
        </div>
      )}

      <FinderView
        rail={(
          <div className="space-y-1">
            {(Object.entries(SECTION_LABELS) as [Section, string][]).map(([section, label]) => (
              <button key={section} onClick={() => setSection(section)} className={`flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm ${section === activeSection ? 'bg-[var(--royal-soft)] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]'}`}>
                {section === 'reports' && <BookOpen size={14} />}
                {section === 'files' && <Link2 size={14} />}
                {section === 'audit' && <ScrollText size={14} />}
                {section === 'archives' && <Archive size={14} />}
                {section === 'handover' && <FileText size={14} />}
                {label}
              </button>
            ))}
          </div>
        )}
        list={(
          <>
            <div className="border-b border-[var(--border-hairline)] px-4 py-3 md:px-5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input type="text" className="input pl-9" placeholder={`Search ${SECTION_LABELS[activeSection].toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="p-4">
                <EmptyMoment title={`No ${SECTION_LABELS[activeSection].toLowerCase()} found`} description="Try changing the search or generate something new." />
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {filtered.map((item) => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.03] md:px-5 ${selected?.id === item.id ? 'bg-white/[0.03]' : ''}`}>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{item.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{item.subtitle}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        preview={selected ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{selected.title}</div>
              <div className="mt-1 text-sm text-[var(--text-tertiary)]">{selected.subtitle}</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-black/10 p-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
              {activeSection === 'files' ? selected.body : selected.body || 'No preview body available.'}
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSection === 'files' && 'url' in (selected.raw as any) && <a className="btn-secondary" href={(selected.raw as any).url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> Open</a>}
              {(activeSection === 'reports' || activeSection === 'handover') && <button className="btn-secondary" onClick={() => navigator.clipboard.writeText((selected.raw as Report).sections)}><Copy size={13} /> Copy</button>}
              {(activeSection === 'reports' || activeSection === 'handover') && <button className="btn-ghost text-[var(--danger)]" onClick={() => setConfirmDelete({ id: selected.id, title: selected.title, kind: 'report' })}><Trash2 size={13} /> Delete</button>}
              {activeSection === 'files' && <button className="btn-ghost text-[var(--danger)]" onClick={() => setConfirmDelete({ id: selected.id, title: selected.title, kind: 'file' })}><Trash2 size={13} /> Delete</button>}
            </div>
          </div>
        ) : (
          <EmptyMoment title="Choose a document" description="Select an item from the list to preview it here." />
        )}
      />

      {modal.open && (
        <Modal open={modal.open} title={modal.editing ? 'Edit File Link' : 'Add File Link'} onClose={() => setModal({ open: false })}>
          <FileLinkForm projectId={modal.editing?.projectId ?? (data.projects[0]?.id ?? '')} members={data.members} initial={modal.editing} onSave={(fileLink: any) => { saveFileLink(fileLink); setModal({ open: false }); }} onCancel={() => setModal({ open: false })} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete item?"
        message={`Delete "${confirmDelete?.title}"?`}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.kind === 'report') deleteReport(confirmDelete.id);
          else deleteFileLink(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </ScreenCanvas>
  );
}
