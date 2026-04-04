import React, { useState } from 'react';
import { Star, Crown, Kanban, Link as LinkIcon } from '@phosphor-icons/react';
import TailoredResumeView from './TailoredResumeView';
import type { JobTarget, MasterResume } from '../../../shared/types';

function Spinner({ size = 14, color = 'var(--accent-indigo)' }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

interface Props {
  target: JobTarget;
  resumes: MasterResume[];
  onUpdate: () => void;
}

export default function JobTargetDetail({ target, resumes, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [coverLetterStyle, setCoverLetterStyle] = useState<'short' | 'medium' | 'comprehensive'>('medium');
  const [form, setForm] = useState({
    jobTitle: target.jobTitle,
    company: target.company,
    jobDescriptionUrl: target.jobDescriptionUrl || '',
    jobDescriptionText: target.jobDescriptionText || '',
    deadline: target.deadline || '',
    notes: target.notes || '',
    status: target.status,
  });

  const handleSave = async () => {
    await window.jobotta.updateJobTarget(target.id, form);
    setEditing(false);
    onUpdate();
  };

  const linkedResume = resumes.find(r => r.id === target.masterResumeId);

  const handleGenerateCoverLetter = async () => {
    if (!linkedResume || !target.jobDescriptionText) {
      setAiError('Need a linked resume and job description to generate a cover letter.');
      return;
    }
    setGenerating('cover-letter');
    setAiError(null);
    try {
      const text = await window.jobotta.generateCoverLetter(
        linkedResume.blocks,
        target.jobDescriptionText,
        coverLetterStyle
      );
      await window.jobotta.updateJobTarget(target.id, { coverLetterText: text });
      onUpdate();
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate cover letter');
    } finally {
      setGenerating(null);
    }
  };

  const handleTailorResume = async () => {
    if (!linkedResume || !target.jobDescriptionText) {
      setAiError('Need a linked resume and job description to tailor.');
      return;
    }
    setGenerating('tailor');
    setAiError(null);
    try {
      const settings = await window.jobotta.getSettings();
      const tailored = await window.jobotta.tailorResume(
        linkedResume.blocks,
        target.jobDescriptionText,
        settings.atsStrategy || 'balanced'
      );
      await window.jobotta.updateJobTarget(target.id, { tailoredResumeContent: tailored });
      onUpdate();
    } catch (err: any) {
      setAiError(err.message || 'Failed to tailor resume');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{target.jobTitle}</h2>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{target.company}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <span className="badge badge-purple">{target.status}</span>
            <button
              onClick={async () => {
                await window.jobotta.updateJobTarget(target.id, { preferred: !target.preferred });
                onUpdate();
              }}
              title={target.preferred ? 'Remove preferred' : 'Mark as preferred'}
              style={{
                background: target.preferred ? 'rgba(234,179,8,0.12)' : 'var(--bg-tertiary)',
                border: `1px solid ${target.preferred ? 'var(--accent-yellow)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: target.preferred ? 'var(--accent-yellow)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all var(--transition-fast)',
              }}
            >
              <Star size={14} weight={target.preferred ? 'fill' : 'regular'} /> Priority
            </button>
            {target.atsScore != null && <span className="badge badge-indigo">ATS Score: {target.atsScore}%</span>}
            {target.deadline && <span className="badge badge-yellow">Due: {new Date(target.deadline).toLocaleDateString()}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {target.status !== 'submitted' ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                // Create linked application on the Job Board
                await window.jobotta.createApplication({
                  jobTargetId: target.id,
                  company: target.company,
                  role: target.jobTitle,
                  stage: 'saved',
                  source: target.jobDescriptionUrl ? 'Job Target' : undefined,
                  notes: target.notes || undefined,
                });
                // Update job target status to submitted
                await window.jobotta.updateJobTarget(target.id, { status: 'submitted' });
                onUpdate();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Kanban size={16} /> Add to Job Board
            </button>
          ) : (
            <span className="badge badge-green" style={{ padding: '5px 12px', fontSize: 12 }}>
              ✓ On Job Board
            </span>
          )}
          <button className="btn" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {aiError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 16, fontSize: 12, color: 'var(--accent-red)' }}>
          {aiError}
          <button style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setAiError(null)}>dismiss</button>
        </div>
      )}

      {editing ? (
        <div>
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input className="form-input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description URL</label>
            <input className="form-input" value={form.jobDescriptionUrl} onChange={e => setForm({ ...form, jobDescriptionUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea className="form-textarea" value={form.jobDescriptionText} onChange={e => setForm({ ...form, jobDescriptionText: e.target.value })} rows={6} placeholder="Paste the job description here..." />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="submitted">Submitted</option>
                <option value="applied">Applied</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      ) : (
        <div>
          {/* ── 1. LINKED RESUME ─────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>LINKED RESUME</span>
              {linkedResume && target.jobDescriptionText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {generating === 'tailor' && <Spinner />}
                  <button className="btn btn-sm btn-primary" onClick={handleTailorResume} disabled={generating === 'tailor'}>
                    {generating === 'tailor' ? 'Tailoring Resume...' : 'Tailor for This Job'}
                  </button>
                </div>
              )}
            </div>
            {linkedResume ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', color: linkedResume.isMaster ? 'var(--accent-orange)' : 'var(--text-muted)' }}>{linkedResume.isMaster ? <Crown size={18} weight="fill" /> : <LinkIcon size={18} />}</span>
                <span style={{ fontWeight: 500 }}>{linkedResume.name}</span>
                <span className="badge badge-indigo">{linkedResume.blocks.length} blocks</span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No resume linked</span>
            )}
          </div>

          {/* ── 2. TAILORED RESUME (AI) ──────────────────────── */}
          {target.tailoredResumeContent && target.tailoredResumeContent.length > 0 && (
            <TailoredResumeView
              blocks={target.tailoredResumeContent}
              resumeName={linkedResume?.name || target.jobTitle}
              company={target.company}
              jobTitle={target.jobTitle}
            />
          )}

          {/* ── 3. COVER LETTER ──────────────────────────────── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>COVER LETTER</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {generating === 'cover-letter' && <Spinner />}
                <select
                  className="form-select"
                  style={{ padding: '4px 8px', fontSize: 11, width: 'auto' }}
                  value={coverLetterStyle}
                  onChange={e => setCoverLetterStyle(e.target.value as any)}
                  disabled={generating === 'cover-letter'}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="comprehensive">Full</option>
                </select>
                <button className="btn btn-sm btn-primary" onClick={handleGenerateCoverLetter} disabled={generating === 'cover-letter'}>
                  {generating === 'cover-letter' ? 'Generating...' : (target.coverLetterText ? 'Regenerate' : 'Generate')}
                </button>
              </div>
            </div>
            {target.coverLetterText ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {target.coverLetterText}
              </pre>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No cover letter generated yet. Add a job description and click Generate.</span>
            )}
          </div>

          {/* ── 4. JOB URL ───────────────────────────────────── */}
          {target.jobDescriptionUrl && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>JOB URL</span>
              </div>
              <a href={target.jobDescriptionUrl} style={{ color: 'var(--accent-blue)', fontSize: 13, wordBreak: 'break-all' }}>
                {target.jobDescriptionUrl}
              </a>
            </div>
          )}

          {/* ── 5. JOB DESCRIPTION ───────────────────────────── */}
          {target.jobDescriptionText && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>JOB DESCRIPTION</span>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: 300, overflow: 'auto' }}>
                {target.jobDescriptionText}
              </pre>
            </div>
          )}

          {/* ── 6. NOTES ─────────────────────────────────────── */}
          {target.notes && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>NOTES</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{target.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
