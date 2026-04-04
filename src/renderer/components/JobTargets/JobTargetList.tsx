import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlass, Crosshair, Star, FileText } from '@phosphor-icons/react';
import JobTargetDetail from './JobTargetDetail';
import JobSearch from './JobSearch';
import ConfirmDialog from '../Layout/ConfirmDialog';
import type { JobTarget, MasterResume } from '../../../shared/types';

export default function JobTargetList() {
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [resumes, setResumes] = useState<MasterResume[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ jobTitle: '', company: '', masterResumeId: '', jobDescriptionUrl: '', jobDescriptionText: '', notes: '', deadline: '' });
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasSearchKey, setHasSearchKey] = useState(false);

  const load = useCallback(async () => {
    const [t, r, s] = await Promise.all([
      window.jobotta.listJobTargets(),
      window.jobotta.listResumes(),
      window.jobotta.getSettings(),
    ]);
    setTargets(t);
    setResumes(r);
    setHasSearchKey(!!s?.rapidApiKey);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.jobTitle.trim() || !form.company.trim()) return;
    const target = await window.jobotta.createJobTarget({
      jobTitle: form.jobTitle.trim(),
      company: form.company.trim(),
      masterResumeId: form.masterResumeId,
      jobDescriptionUrl: form.jobDescriptionUrl || undefined,
      jobDescriptionText: form.jobDescriptionText || undefined,
      notes: form.notes || undefined,
      deadline: form.deadline || undefined,
      status: 'draft',
    });
    setForm({ jobTitle: '', company: '', masterResumeId: '', jobDescriptionUrl: '', jobDescriptionText: '', notes: '', deadline: '' });
    setScrapeUrl('');
    setShowCreate(false);
    await load();
    setSelectedId(target.id);
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeError(null);
    try {
      const result = await window.jobotta.scrapeJobUrl(scrapeUrl.trim());
      setForm(prev => ({
        ...prev,
        jobTitle: result.jobTitle || prev.jobTitle,
        company: result.company || prev.company,
        jobDescriptionUrl: scrapeUrl.trim(),
        jobDescriptionText: result.jobDescriptionText || prev.jobDescriptionText,
        notes: result.notes || prev.notes,
        deadline: result.deadline || prev.deadline,
      }));
    } catch (err: any) {
      setScrapeError(err.message || 'Failed to scrape job posting');
    } finally {
      setScraping(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<JobTarget | null>(null);

  const handleDelete = async (id: string) => {
    await window.jobotta.deleteJobTarget(id);
    if (selectedId === id) setSelectedId(null);
    setDeleteTarget(null);
    await load();
  };

  const selected = targets.find(t => t.id === selectedId) || null;

  const statusColors: Record<string, string> = {
    draft: 'badge-purple',
    active: 'badge-green',
    submitted: 'badge-blue',
    applied: 'badge-blue',
    closed: 'badge-red',
  };

  const handleCreateFromSearch = async (data: any) => {
    const target = await window.jobotta.createJobTarget(data);
    setShowSearch(false);
    await load();
    setSelectedId(target.id);
  };

  // ─── Level 3: Job Search View ─────────────────────────────
  if (showSearch) {
    return (
      <JobSearch
        resumes={resumes}
        onCreateTarget={handleCreateFromSearch}
        onClose={() => setShowSearch(false)}
      />
    );
  }

  // ─── Level 2: Detail View ─────────────────────────────────
  if (selected) {
    return (
      <div>
        <button
          className="btn btn-sm"
          onClick={() => setSelectedId(null)}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 16 }}>←</span> Back to Job Targets
        </button>
        <JobTargetDetail target={selected} resumes={resumes} onUpdate={load} />
      </div>
    );
  }

  // ─── Level 1: Table View ──────────────────────────────────
  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {targets.length} job target{targets.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasSearchKey && (
            <button className="btn btn-sm" onClick={() => setShowSearch(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MagnifyingGlass size={14} /> Search Jobs
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            + New Job Target
          </button>
        </div>
      </div>

      {targets.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <Crosshair size={40} />
          <p>No job targets yet</p>
          <p style={{ fontSize: 11 }}>Search for jobs or add one manually</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {hasSearchKey && <button className="btn" onClick={() => setShowSearch(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MagnifyingGlass size={16} /> Search Jobs</button>}
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Job Target</button>
          </div>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 80px 90px 80px 36px',
            gap: 8,
            padding: '8px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <span>Job Title</span>
            <span>Company</span>
            <span>Status</span>
            <span>Deadline</span>
            <span>ATS</span>
            <span></span>
          </div>

          {/* Table rows */}
          {targets.map(target => {
            const resumeName = resumes.find(r => r.id === target.masterResumeId)?.name;
            return (
              <div
                key={target.id}
                onClick={() => setSelectedId(target.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 80px 90px 80px 36px',
                  gap: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {target.preferred && <span title="Priority"><Star size={14} weight="fill" style={{ color: 'var(--accent-yellow)', marginRight: 4, verticalAlign: 'middle' }} /></span>}
                  <span style={{ fontWeight: 600 }}>{target.jobTitle}</span>
                  {resumeName && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <FileText size={12} /> {resumeName}
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {target.company}
                </span>
                <span className={`badge ${statusColors[target.status] || 'badge-purple'}`} style={{ justifySelf: 'start' }}>
                  {target.status}
                </span>
                <span style={{ fontSize: 12, color: target.deadline ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {target.deadline ? new Date(target.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                </span>
                <span>
                  {target.atsScore != null ? (
                    <span className="badge badge-indigo">{target.atsScore}%</span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                  )}
                </span>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ padding: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1 }}
                  onClick={e => { e.stopPropagation(); setDeleteTarget(target); }}
                  title="Delete"
                >×</button>
              </div>
            );
          })}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setScrapeError(null); }}>
          <div className="modal" style={{ maxWidth: 720, width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Job Target</h3>
              <button className="btn btn-sm" onClick={() => { setShowCreate(false); setScrapeError(null); }}>×</button>
            </div>

            {/* URL Scrape */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Import from Job URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="Paste a job posting URL (Indeed, LinkedIn, company careers page, etc.)"
                  onKeyDown={e => e.key === 'Enter' && handleScrapeUrl()}
                />
                <button className="btn btn-primary" onClick={handleScrapeUrl} disabled={scraping || !scrapeUrl.trim()} style={{ whiteSpace: 'nowrap' }}>
                  {scraping ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                AI will read the page and auto-fill the fields below
              </span>
              {scraping && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--accent-indigo)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Reading job posting and extracting details...
                </div>
              )}
              {scrapeError && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent-red)', background: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  {scrapeError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or fill in manually</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <div className="form-group">
                <label className="form-label">Job Title {form.jobTitle && <span style={{ color: 'var(--accent-green)' }}>✓</span>}</label>
                <input className="form-input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Company {form.company && <span style={{ color: 'var(--accent-green)' }}>✓</span>}</label>
                <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Corp" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Master Resume</label>
              <select className="form-select" value={form.masterResumeId} onChange={e => setForm({ ...form, masterResumeId: e.target.value })}>
                <option value="">Select a resume...</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {form.jobDescriptionText && (
              <div className="form-group">
                <label className="form-label">Job Description <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4 }}>auto-filled</span></label>
                <textarea className="form-textarea" value={form.jobDescriptionText} onChange={e => setForm({ ...form, jobDescriptionText: e.target.value })} rows={5} style={{ maxHeight: 200 }} />
              </div>
            )}
            {form.notes && (
              <div className="form-group">
                <label className="form-label">Notes <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4 }}>auto-filled</span></label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
            )}
            {form.deadline && (
              <div className="form-group">
                <label className="form-label">Deadline <span style={{ fontSize: 11, color: 'var(--accent-green)', marginLeft: 4 }}>auto-filled</span></label>
                <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            )}

            <div className="modal-footer">
              <button className="btn" onClick={() => { setShowCreate(false); setScrapeError(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.jobTitle.trim() || !form.company.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Job Target"
          message={`Are you sure you want to delete "${deleteTarget.jobTitle}" at ${deleteTarget.company}? This will remove the job target, any tailored resume, and cover letter. This cannot be undone.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
