import React, { useState } from 'react';
import { FileText, Copy, Printer, Save, Trash2, Wand2 } from 'lucide-react';
import { Report } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import { generateProjectReport } from '../../lib/report';
import { generateId, todayISO, formatDate } from '../../lib/dateUtils';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ReportsPage() {
  const { data, saveReport, deleteReport } = useAppData();
  const { projects, reports } = data;
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [preview, setPreview] = useState<{ title: string; summary: string; sections: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Report | null>(null);

  const project = projects.find((p) => p.id === projectId);

  function generate() {
    if (!project) return;
    setPreview(generateProjectReport(data, project));
  }

  function copyReport() {
    if (!preview) return;
    navigator.clipboard?.writeText(`${preview.title}\n\n${preview.summary}\n\n${preview.sections}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function printReport() {
    if (!preview) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${preview.title}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#0f172a;line-height:1.5}
      h1{font-size:20px}h2{font-size:15px;margin-top:20px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}</style></head>
      <body><h1>${preview.title}</h1><p><em>${preview.summary}</em></p><pre>${preview.sections.replace(/</g, '&lt;')}</pre></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  function saveCurrent() {
    if (!preview || !project) return;
    saveReport({
      id: generateId(),
      projectId: project.id,
      title: preview.title,
      type: 'Project Summary',
      summary: preview.summary,
      generatedDate: todayISO(),
      sections: preview.sections,
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="Reports & Archive"
        description="Generate project summaries for handover and post-project memory."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="label">Project</label>
            <select className="select" value={projectId} onChange={(e) => { setProjectId(e.target.value); setPreview(null); }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={generate} disabled={!project}><Wand2 size={16} /> Generate Report</button>
        </div>
      </Card>

      {preview && (
        <Card>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <h2 className="text-sm font-semibold text-white">{preview.title}</h2>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-ghost text-xs" onClick={copyReport}><Copy size={13} /> {copied ? 'Copied!' : 'Copy'}</button>
              <button className="btn-ghost text-xs" onClick={printReport}><Printer size={13} /> Print</button>
              <button className="btn-secondary text-xs" onClick={saveCurrent}><Save size={13} /> Save</button>
            </div>
          </div>
          <p className="text-sm text-slate-400 italic mb-3">{preview.summary}</p>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/50 border border-slate-800 rounded-lg p-4 max-h-[480px] overflow-y-auto font-sans">{preview.sections}</pre>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Saved Reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No saved reports" description="Generate and save a report to keep it here." />
        ) : (
          <div className="space-y-2">
            {[...reports].sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime()).map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 text-left" onClick={() => setPreview({ title: r.title, summary: r.summary, sections: r.sections })}>
                    <p className="font-medium text-white text-sm truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.type} · {formatDate(r.generatedDate)}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.summary}</p>
                  </button>
                  <button className="btn-ghost p-1.5 text-red-500 shrink-0" onClick={() => setConfirmDel(r)}><Trash2 size={13} /></button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete saved report?"
        message={`Delete "${confirmDel?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteReport(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
