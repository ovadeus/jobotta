import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Crown, GitBranch } from '@phosphor-icons/react';
import ResumeDetail from './ResumeDetail';
import ConfirmDialog from '../Layout/ConfirmDialog';
import type { MasterResume } from '../../../shared/types';

declare global {
  interface Window {
    jobotta: any;
  }
}

export default function ResumeList() {
  const [resumes, setResumes] = useState<MasterResume[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');

  const loadResumes = useCallback(async () => {
    const data = await window.jobotta.listResumes();
    setResumes(data);
  }, []);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const resume = await window.jobotta.createResume({ name: newName.trim(), isMaster: true });
    setNewName('');
    setShowCreateModal(false);
    await loadResumes();
    setSelectedId(resume.id);
  };

  const [deleteTarget, setDeleteTarget] = useState<MasterResume | null>(null);

  const handleDelete = async (id: string) => {
    await window.jobotta.deleteResume(id);
    if (selectedId === id) setSelectedId(null);
    setDeleteTarget(null);
    await loadResumes();
  };

  const selected = resumes.find(r => r.id === selectedId) || null;

  return (
    <div className="split-panel" style={{ margin: '-24px', height: 'calc(100% + 48px)' }}>
      {/* List panel */}
      <div className="split-panel-list">
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCreateModal(true)}>
            + New Resume
          </button>
        </div>
        <div style={{ padding: '8px' }}>
          {resumes.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} />
              <p>No resumes yet</p>
              <p style={{ fontSize: 11 }}>Create your first master resume</p>
            </div>
          ) : (
            resumes.map(resume => (
              <div
                key={resume.id}
                className={`list-item ${selectedId === resume.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(resume.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', color: resume.isMaster ? 'var(--accent-orange)' : 'var(--text-muted)' }}>{resume.isMaster ? <Crown size={18} weight="fill" /> : <GitBranch size={18} />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: resume.isMaster ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                    {resume.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {resume.isMaster ? '' : 'Tailored · '}{resume.blocks.length} blocks · {new Date(resume.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(resume); }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="split-panel-detail">
        {selected ? (
          <ResumeDetail resume={selected} onUpdate={loadResumes} />
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <FileText size={40} />
            <p>Select a resume to edit</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Resume</h3>
              <button className="btn btn-sm" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Resume Name</label>
              <input
                className="form-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Master Resume — Software Engineer"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Resume"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will remove the resume and all its blocks. This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
