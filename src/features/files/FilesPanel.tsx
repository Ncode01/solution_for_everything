import React, { useState } from 'react';
import { Plus, FileText, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { FileLink } from '../../types';
import { useAppData } from '../../state/AppDataContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import FileLinkForm from './FileLinkForm';
import { formatDate } from '../../lib/dateUtils';

interface Props {
  projectId: string;
}

export default function FilesPanel({ projectId }: Props) {
  const { data, saveFileLink, deleteFileLink } = useAppData();
  const files = data.fileLinks.filter((f) => f.projectId === projectId);
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: FileLink }>({ open: false });
  const [confirmDel, setConfirmDel] = useState<FileLink | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setFormModal({ open: true })}><Plus size={15} /> Add File Link</button>
      </div>

      {files.length === 0 ? (
        <EmptyState icon={FileText} title="No file links" description="Link external documents (proposals, budgets, designs) to this project." action={<button className="btn-primary" onClick={() => setFormModal({ open: true })}>Add File Link</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {files.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">{f.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{f.category}</span>
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{f.owner || '—'} · {formatDate(f.createdAt)}</p>
                  {f.notes && <p className="text-xs text-slate-600 mt-1">{f.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs px-2 py-1"><ExternalLink size={12} /> Open</a>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-1.5" onClick={() => setFormModal({ open: true, editing: f })}><Edit2 size={12} /></button>
                    <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirmDel(f)}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formModal.open} onClose={() => setFormModal({ open: false })} title={formModal.editing ? 'Edit File Link' : 'Add File Link'}>
        <FileLinkForm
          projectId={projectId}
          members={data.members}
          initial={formModal.editing}
          onSave={(f) => { saveFileLink(f); setFormModal({ open: false }); }}
          onCancel={() => setFormModal({ open: false })}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete file link?"
        message={`Remove the link "${confirmDel?.title}"? The external file is not affected.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDel) deleteFileLink(confirmDel.id); setConfirmDel(null); }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
