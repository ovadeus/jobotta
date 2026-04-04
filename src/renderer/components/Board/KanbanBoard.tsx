import React, { useState, useEffect, useCallback } from 'react';
import ApplicationCard from './ApplicationCard';
import ApplicationDetail from './ApplicationDetail';
import ConfirmDialog from '../Layout/ConfirmDialog';
import type { Application, ApplicationStage, APPLICATION_STAGES } from '../../../shared/types';

const STAGES: { key: ApplicationStage; label: string; color: string }[] = [
  { key: 'saved', label: 'Saved', color: 'var(--text-muted)' },
  { key: 'applied', label: 'Applied', color: 'var(--accent-blue)' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'var(--accent-yellow)' },
  { key: 'interview', label: 'Interview', color: 'var(--accent-purple)' },
  { key: 'offer', label: 'Offer', color: 'var(--accent-green)' },
  { key: 'accepted', label: 'Accepted', color: '#22c55e' },
  { key: 'rejected', label: 'Rejected', color: 'var(--accent-red)' },
];

export default function KanbanBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ company: '', role: '' });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const data = await window.jobotta.listApplications();
    // Filter out archived — those show in the Archive page
    setApplications(data.filter((a: Application) => a.stage !== 'archived'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCollapse = (stageKey: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(stageKey)) next.delete(stageKey);
      else next.add(stageKey);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    await window.jobotta.createApplication({
      company: form.company.trim(),
      role: form.role.trim(),
      stage: 'saved',
    });
    setForm({ company: '', role: '' });
    setShowCreate(false);
    await load();
  };

  const handleDrop = async (applicationId: string, newStage: ApplicationStage) => {
    await window.jobotta.updateApplication(applicationId, { stage: newStage });
    setDragTarget(null);
    // Auto-expand the column if it was collapsed
    setCollapsed(prev => {
      const next = new Set(prev);
      next.delete(newStage);
      return next;
    });
    await load();
  };

  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);

  const handleDelete = async (id: string) => {
    await window.jobotta.deleteApplication(id);
    if (selectedId === id) setSelectedId(null);
    setDeleteTarget(null);
    await load();
  };

  const selected = applications.find(a => a.id === selectedId) || null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + New Application
        </button>
      </div>

      {/* Kanban board with horizontal scroll */}
      <div className="kanban-scroll-container" style={{
        display: 'flex',
        gap: 12,
        overflowX: 'scroll',
        overflowY: 'hidden',
        paddingBottom: 4,
        height: 'calc(100% - 52px)',
      }}>
        {STAGES.map(stage => {
          const cards = applications.filter(a => a.stage === stage.key);
          const isCollapsed = collapsed.has(stage.key);

          return (
            <div
              key={stage.key}
              onDragOver={e => { e.preventDefault(); setDragTarget(stage.key); }}
              onDragLeave={() => setDragTarget(null)}
              onDrop={e => {
                e.preventDefault();
                const id = e.dataTransfer.getData('application-id');
                if (id) handleDrop(id, stage.key);
              }}
              style={{
                width: isCollapsed ? 44 : 260,
                minWidth: isCollapsed ? 44 : 240,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                background: dragTarget === stage.key
                  ? 'rgba(99,102,241,0.08)'
                  : isCollapsed ? 'var(--bg-secondary)' : undefined,
                borderRadius: 'var(--radius-md)',
                border: isCollapsed ? '1px solid var(--border-subtle)' : 'none',
                overflow: 'hidden',
                transition: 'width 0.3s ease, min-width 0.3s ease, background 0.2s ease, border 0.2s ease',
              }}
            >
              {/* Collapsed view — vertical label */}
              <div
                onClick={() => isCollapsed && toggleCollapse(stage.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 10,
                  gap: 8,
                  cursor: isCollapsed ? 'pointer' : 'default',
                  position: isCollapsed ? 'relative' : 'absolute',
                  width: isCollapsed ? '100%' : 0,
                  opacity: isCollapsed ? 1 : 0,
                  transition: 'opacity 0.25s ease 0.1s',
                  pointerEvents: isCollapsed ? 'auto' : 'none',
                }}
                title={isCollapsed ? `${stage.label} (${cards.length}) — click to expand` : ''}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                <span style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  {stage.label}
                </span>
                <span style={{
                  background: 'var(--bg-tertiary)',
                  padding: '2px 0',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  width: 24,
                  textAlign: 'center',
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Expanded view — header + cards */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                opacity: isCollapsed ? 0 : 1,
                transition: 'opacity 0.25s ease 0.1s',
                pointerEvents: isCollapsed ? 'none' : 'auto',
                position: isCollapsed ? 'absolute' : 'relative',
                width: isCollapsed ? 0 : '100%',
                overflow: isCollapsed ? 'hidden' : 'visible',
              }}>
                <div className="kanban-column-header" style={{ paddingRight: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    {stage.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="kanban-column-count">{cards.length}</span>
                    <button
                      onClick={() => toggleCollapse(stage.key)}
                      title="Collapse column"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: 14,
                        padding: '2px 4px',
                        borderRadius: 4,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      «
                    </button>
                  </div>
                </div>
                <div className="kanban-cards" style={{ flex: 1, overflowY: 'auto' }}>
                  {cards.map(app => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onClick={() => setSelectedId(app.id)}
                      onDelete={() => setDeleteTarget(app)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Application detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="modal" style={{ minWidth: 500, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <ApplicationDetail application={selected} onUpdate={load} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Application</h3>
              <button className="btn btn-sm" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Google" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Application"
          message={`Are you sure you want to delete the application for "${deleteTarget.role}" at ${deleteTarget.company}? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
