import React, { useState } from 'react';
import { Star, Link as LinkIcon } from '@phosphor-icons/react';
import type { Application, ApplicationStage } from '../../../shared/types';

import ConfirmDialog from '../Layout/ConfirmDialog';

interface Props {
  application: Application;
  onUpdate: () => void;
  onClose: () => void;
}

const STAGES: ApplicationStage[] = ['saved', 'applied', 'phone_screen', 'interview', 'offer', 'accepted', 'rejected'];

export default function ApplicationDetail({ application, onUpdate, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [showRetract, setShowRetract] = useState(false);
  const [form, setForm] = useState({
    company: application.company,
    role: application.role,
    stage: application.stage,
    appliedDate: application.appliedDate || '',
    source: application.source || '',
    notes: application.notes || '',
  });

  const handleSave = async () => {
    await window.jobotta.updateApplication(application.id, form);
    setEditing(false);
    onUpdate();
  };

  return (
    <div>
      <div className="modal-header">
        <h3>{application.role} at {application.company}</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      {editing ? (
        <>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Role</label>
              <input className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Stage</label>
              <select className="form-select" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as ApplicationStage })}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Applied Date</label>
              <input className="form-input" type="date" value={form.appliedDate} onChange={e => setForm({ ...form, appliedDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Source</label>
            <input className="form-input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. LinkedIn, Company website" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} />
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <span className="badge badge-blue">{application.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <button
              onClick={async () => {
                await window.jobotta.updateApplication(application.id, { priority: !application.priority });
                onUpdate();
              }}
              style={{
                background: application.priority ? 'rgba(34,197,94,0.12)' : 'var(--bg-tertiary)',
                border: `1px solid ${application.priority ? 'var(--accent-green)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: application.priority ? 'var(--accent-green)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Star size={14} weight={application.priority ? 'fill' : 'regular'} /> Priority
            </button>
            {application.appliedDate && <span className="badge badge-green">Applied {new Date(application.appliedDate).toLocaleDateString()}</span>}
            {application.source && <span className="badge badge-purple">{application.source}</span>}
          </div>

          {/* Milestones */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Timeline</h4>
            {application.milestones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {application.milestones.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                    <span style={{ color: 'var(--accent-indigo)' }}>●</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(m.occurredAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No milestones yet</span>
            )}
          </div>

          {/* Contacts */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Contacts</h4>
            {application.contacts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {application.contacts.map(c => (
                  <div key={c.id} style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.role && <span style={{ color: 'var(--text-muted)' }}> — {c.role}</span>}
                    {c.email && <span style={{ color: 'var(--accent-blue)', marginLeft: 8 }}>{c.email}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No contacts yet</span>
            )}
          </div>

          {/* Notes */}
          {application.notes && (
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Notes</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{application.notes}</p>
            </div>
          )}

          {/* Linked Job Target */}
          {application.jobTargetId && (
            <div style={{ marginTop: 16, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <LinkIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Linked to Job Target — view in Job Targets for resume, cover letter, and job description
            </div>
          )}

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowRetract(true)}
              >
                Retract
              </button>
              <button
                className="btn btn-sm"
                onClick={async () => {
                  await window.jobotta.updateApplication(application.id, { stage: 'archived' });
                  onUpdate();
                  onClose();
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Archive
              </button>
            </div>
            <button className="btn" onClick={() => setEditing(true)}>Edit</button>
          </div>

          {showRetract && (
            <ConfirmDialog
              title="Retract Application"
              message={`Are you sure you want to retract your application for "${application.role}" at ${application.company}? This will remove it from the Job Board${application.jobTargetId ? ' and reset the linked Job Target status back to draft' : ''}.`}
              confirmLabel="Retract"
              onConfirm={async () => {
                // If linked to a job target, reset its status
                if (application.jobTargetId) {
                  await window.jobotta.updateJobTarget(application.jobTargetId, { status: 'draft' });
                }
                // Delete the application from the board
                await window.jobotta.deleteApplication(application.id);
                setShowRetract(false);
                onUpdate();
                onClose();
              }}
              onCancel={() => setShowRetract(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
