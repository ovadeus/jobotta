import React, { useState, useEffect, useCallback } from 'react';
import { Archive, Star } from '@phosphor-icons/react';
import ConfirmDialog from '../Layout/ConfirmDialog';
import type { Application } from '../../../shared/types';

export default function ArchiveView() {
  const [archived, setArchived] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReturnConfirm, setShowReturnConfirm] = useState<Application | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Application | null>(null);

  const load = useCallback(async () => {
    const all = await window.jobotta.listApplications();
    setArchived(all.filter((a: Application) => a.stage === 'archived'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReturn = async (app: Application) => {
    await window.jobotta.updateApplication(app.id, { stage: 'saved' });
    setShowReturnConfirm(null);
    await load();
  };

  const handleDelete = async (app: Application) => {
    await window.jobotta.deleteApplication(app.id);
    setShowDeleteConfirm(null);
    await load();
  };

  const selected = archived.find(a => a.id === selectedId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {archived.length} archived application{archived.length !== 1 ? 's' : ''}
        </span>
      </div>

      {archived.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <Archive size={40} />
          <p style={{ marginTop: 12 }}>No archived applications</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Archive applications from the Job Board to keep your board clean and focused
          </p>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 100px 100px 120px',
            gap: 8,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <span>Role</span>
            <span>Company</span>
            <span>Last Stage</span>
            <span>Applied</span>
            <span>Actions</span>
          </div>

          {/* Table rows */}
          {archived.map(app => (
            <div
              key={app.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 100px 100px 120px',
                gap: 8,
                padding: '10px 12px',
                fontSize: 13,
                borderBottom: '1px solid var(--border-subtle)',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onClick={() => setSelectedId(selectedId === app.id ? null : app.id)}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.priority && <Star size={14} weight="fill" style={{ color: 'var(--accent-green)', marginRight: 4, verticalAlign: 'middle' }} />}
                <span style={{ fontWeight: 600 }}>{app.role}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.company}
              </span>
              <span className="badge badge-purple" style={{ justifySelf: 'start', fontSize: 10 }}>
                archived
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
              </span>
              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setShowReturnConfirm(app)}
                  title="Return to Job Board"
                >
                  ↩ Return
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setShowDeleteConfirm(app)}
                  title="Permanently delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Expanded detail */}
          {selected && (
            <div className="card" style={{ marginTop: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{selected.role}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.company}</div>
                </div>
                <button className="btn btn-sm" onClick={() => setSelectedId(null)}>×</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {selected.appliedDate && <span className="badge badge-green">Applied {new Date(selected.appliedDate).toLocaleDateString()}</span>}
                {selected.source && <span className="badge badge-purple">{selected.source}</span>}
                {selected.priority && <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Star size={12} weight="fill" /> Priority</span>}
              </div>

              {/* Timeline */}
              {selected.milestones.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Timeline</h4>
                  {selected.milestones.map(m => (
                    <div key={m.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--accent-indigo)' }}>●</span>
                      <span style={{ fontWeight: 500 }}>{m.title}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(m.occurredAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts */}
              {selected.contacts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Contacts</h4>
                  {selected.contacts.map(c => (
                    <div key={c.id} style={{ fontSize: 12, marginBottom: 3 }}>
                      <strong>{c.name}</strong>
                      {c.role && <span style={{ color: 'var(--text-muted)' }}> — {c.role}</span>}
                      {c.email && <span style={{ color: 'var(--accent-blue)', marginLeft: 8 }}>{c.email}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Notes</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{selected.notes}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowReturnConfirm(selected)}>
                  ↩ Return to Job Board
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Return confirmation */}
      {showReturnConfirm && (
        <ConfirmDialog
          title="Return to Job Board"
          message={`Return "${showReturnConfirm.role}" at ${showReturnConfirm.company} to the Job Board? It will appear in the Saved column.`}
          confirmLabel="Return to Board"
          danger={false}
          onConfirm={() => handleReturn(showReturnConfirm)}
          onCancel={() => setShowReturnConfirm(null)}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Application"
          message={`Permanently delete the application for "${showDeleteConfirm.role}" at ${showDeleteConfirm.company}? This cannot be undone.`}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
