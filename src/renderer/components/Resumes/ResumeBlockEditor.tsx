import React, { useState, useEffect } from 'react';
import type { ResumeBlock, BlockType } from '../../../shared/types';

interface Props {
  block: ResumeBlock;
  onUpdate: () => void;
  onDelete: () => void;
  onToggle: (included: boolean) => void;
}

export default function ResumeBlockEditor({ block, onUpdate, onDelete, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [codeText, setCodeText] = useState(JSON.stringify(block.content, null, 2));
  const [content, setContent] = useState<Record<string, any>>(block.content || {});
  const [title, setTitle] = useState(block.title);
  const [dirty, setDirty] = useState(false);

  // Sync when block prop changes
  useEffect(() => {
    setContent(block.content || {});
    setCodeText(JSON.stringify(block.content, null, 2));
    setTitle(block.title);
    setDirty(false);
  }, [block.id, block.updatedAt]);

  const updateContent = (patch: Record<string, any>) => {
    const updated = { ...content, ...patch };
    setContent(updated);
    setCodeText(JSON.stringify(updated, null, 2));
    setDirty(true);
  };

  const handleSave = async () => {
    let finalContent = content;
    if (codeMode) {
      try {
        finalContent = JSON.parse(codeText);
      } catch {
        alert('Invalid JSON');
        return;
      }
    }
    await window.jobotta.updateBlock(block.id, { content: finalContent, title });
    setDirty(false);
    onUpdate();
  };

  const handleCancel = () => {
    setContent(block.content || {});
    setCodeText(JSON.stringify(block.content, null, 2));
    setTitle(block.title);
    setDirty(false);
  };

  const blockTypeLabel = block.blockType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="block-item" style={{ opacity: block.isIncluded ? 1 : 0.5 }}>
      <div className="block-header" onClick={() => setExpanded(!expanded)}>
        <div className="block-header-left">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>
            ▶
          </span>
          <span className="block-type-badge">{blockTypeLabel}</span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{block.title || blockTypeLabel}</span>
          {dirty && <span style={{ fontSize: 10, color: 'var(--accent-orange)', fontWeight: 600 }}>unsaved</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          <div
            className={`block-toggle ${block.isIncluded ? 'active' : ''}`}
            onClick={() => onToggle(!block.isIncluded)}
            title={block.isIncluded ? 'Included' : 'Excluded'}
          />
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete block">×</button>
        </div>
      </div>

      {expanded && (
        <div className="block-body">
          {/* Mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Section Title</label>
              <input className="form-input" value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }} style={{ maxWidth: 300 }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-sm"
                style={{ background: !codeMode ? 'var(--accent-indigo)' : undefined, color: !codeMode ? 'white' : undefined, borderColor: !codeMode ? 'var(--accent-indigo)' : undefined }}
                onClick={() => {
                  if (codeMode) {
                    try {
                      setContent(JSON.parse(codeText));
                    } catch {}
                  }
                  setCodeMode(false);
                }}
              >
                Form
              </button>
              <button
                className="btn btn-sm"
                style={{ background: codeMode ? 'var(--accent-indigo)' : undefined, color: codeMode ? 'white' : undefined, borderColor: codeMode ? 'var(--accent-indigo)' : undefined }}
                onClick={() => {
                  setCodeText(JSON.stringify(content, null, 2));
                  setCodeMode(true);
                }}
              >
                Code
              </button>
            </div>
          </div>

          {codeMode ? (
            <textarea
              className="form-textarea"
              value={codeText}
              onChange={e => { setCodeText(e.target.value); setDirty(true); }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minHeight: 200 }}
            />
          ) : (
            <FormEditor blockType={block.blockType} content={content} onChange={(patch) => updateContent(patch)} />
          )}

          {/* Save / Cancel */}
          {dirty && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-sm" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form Editors per Block Type ───────────────────────────────

interface FormEditorProps {
  blockType: BlockType;
  content: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}

function FormEditor({ blockType, content, onChange }: FormEditorProps) {
  switch (blockType) {
    case 'personal_info': return <PersonalInfoForm content={content} onChange={onChange} />;
    case 'summary': return <SummaryForm content={content} onChange={onChange} />;
    case 'work_experience': return <WorkExperienceForm content={content} onChange={onChange} />;
    case 'education': return <EducationForm content={content} onChange={onChange} />;
    case 'skills': return <SkillsForm content={content} onChange={onChange} />;
    case 'projects': return <ProjectsForm content={content} onChange={onChange} />;
    case 'certifications': return <CertificationsForm content={content} onChange={onChange} />;
    case 'references': return <ReferencesForm content={content} onChange={onChange} />;
    default: return <GenericForm content={content} onChange={onChange} />;
  }
}

// ─── Personal Info ─────────────────────────────────────────────

function PersonalInfoForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const field = (key: string, label: string, placeholder?: string) => (
    <div className="form-group" key={key}>
      <label className="form-label">{label}</label>
      <input className="form-input" value={content[key] || ''} onChange={e => onChange({ [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {field('full_name', 'Full Name', 'John Doe')}
        {field('email', 'Email', 'john@example.com')}
        {field('phone', 'Phone', '(555) 123-4567')}
        {field('location', 'Location', 'San Francisco, CA')}
        {field('linkedin', 'LinkedIn URL', 'linkedin.com/in/johndoe')}
        {field('website', 'Website / Portfolio', 'johndoe.dev')}
      </div>
    </div>
  );
}

// ─── Summary ───────────────────────────────────────────────────

function SummaryForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">Professional Summary</label>
      <textarea
        className="form-textarea"
        value={content.text || ''}
        onChange={e => onChange({ text: e.target.value })}
        rows={4}
        placeholder="Experienced software engineer with 5+ years building scalable web applications..."
      />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {(content.text || '').split(/\s+/).filter(Boolean).length} words
      </span>
    </div>
  );
}

// ─── Work Experience ───────────────────────────────────────────

function WorkExperienceForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const entries: any[] = content.entries || [];

  const updateEntry = (index: number, patch: Record<string, any>) => {
    const updated = entries.map((e, i) => i === index ? { ...e, ...patch } : e);
    onChange({ entries: updated });
  };

  const addEntry = () => {
    onChange({ entries: [...entries, { company: '', title: '', start_date: '', end_date: '', location: '', bullets: [''] }] });
  };

  const removeEntry = (index: number) => {
    onChange({ entries: entries.filter((_, i) => i !== index) });
  };

  const updateBullet = (entryIdx: number, bulletIdx: number, value: string) => {
    const bullets = [...(entries[entryIdx].bullets || [])];
    bullets[bulletIdx] = value;
    updateEntry(entryIdx, { bullets });
  };

  const addBullet = (entryIdx: number) => {
    const bullets = [...(entries[entryIdx].bullets || []), ''];
    updateEntry(entryIdx, { bullets });
  };

  const removeBullet = (entryIdx: number, bulletIdx: number) => {
    const bullets = (entries[entryIdx].bullets || []).filter((_: any, i: number) => i !== bulletIdx);
    updateEntry(entryIdx, { bullets });
  };

  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Position {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => removeEntry(idx)}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={entry.company || ''} onChange={e => updateEntry(idx, { company: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input className="form-input" value={entry.title || ''} onChange={e => updateEntry(idx, { title: e.target.value })} placeholder="Senior Software Engineer" />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" value={entry.start_date || ''} onChange={e => updateEntry(idx, { start_date: e.target.value })} placeholder="Jan 2022" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" value={entry.end_date || ''} onChange={e => updateEntry(idx, { end_date: e.target.value })} placeholder="Present" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={entry.location || ''} onChange={e => updateEntry(idx, { location: e.target.value })} placeholder="San Francisco, CA" />
          </div>
          <div className="form-group">
            <label className="form-label">Bullet Points</label>
            {(entry.bullets || []).map((bullet: string, bIdx: number) => (
              <div key={bIdx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 12 }}>•</span>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={bullet}
                  onChange={e => updateBullet(idx, bIdx, e.target.value)}
                  placeholder="Describe an accomplishment..."
                />
                <button className="btn btn-danger btn-sm" style={{ alignSelf: 'center' }} onClick={() => removeBullet(idx, bIdx)}>×</button>
              </div>
            ))}
            <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={() => addBullet(idx)}>+ Add Bullet</button>
          </div>
        </div>
      ))}
      <button className="btn btn-sm" onClick={addEntry}>+ Add Position</button>
    </div>
  );
}

// ─── Education ─────────────────────────────────────────────────

function EducationForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const entries: any[] = content.entries || [];

  const updateEntry = (index: number, patch: Record<string, any>) => {
    const updated = entries.map((e, i) => i === index ? { ...e, ...patch } : e);
    onChange({ entries: updated });
  };

  const addEntry = () => {
    onChange({ entries: [...entries, { institution: '', degree: '', field: '', start_date: '', end_date: '', gpa: '', notes: '' }] });
  };

  const removeEntry = (index: number) => {
    onChange({ entries: entries.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Education {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => removeEntry(idx)}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input className="form-input" value={entry.institution || ''} onChange={e => updateEntry(idx, { institution: e.target.value })} placeholder="MIT" />
            </div>
            <div className="form-group">
              <label className="form-label">Degree</label>
              <input className="form-input" value={entry.degree || ''} onChange={e => updateEntry(idx, { degree: e.target.value })} placeholder="B.S." />
            </div>
            <div className="form-group">
              <label className="form-label">Field of Study</label>
              <input className="form-input" value={entry.field || ''} onChange={e => updateEntry(idx, { field: e.target.value })} placeholder="Computer Science" />
            </div>
            <div className="form-group">
              <label className="form-label">GPA (optional)</label>
              <input className="form-input" value={entry.gpa || ''} onChange={e => updateEntry(idx, { gpa: e.target.value })} placeholder="3.8" />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" value={entry.start_date || ''} onChange={e => updateEntry(idx, { start_date: e.target.value })} placeholder="Sep 2018" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" value={entry.end_date || ''} onChange={e => updateEntry(idx, { end_date: e.target.value })} placeholder="May 2022" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (honors, activities, etc.)</label>
            <input className="form-input" value={entry.notes || ''} onChange={e => updateEntry(idx, { notes: e.target.value })} placeholder="Magna Cum Laude, Dean's List" />
          </div>
        </div>
      ))}
      <button className="btn btn-sm" onClick={addEntry}>+ Add Education</button>
    </div>
  );
}

// ─── Skills ────────────────────────────────────────────────────

function SkillsForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const categories: any[] = content.categories || [];

  const updateCategory = (index: number, patch: Record<string, any>) => {
    const updated = categories.map((c, i) => i === index ? { ...c, ...patch } : c);
    onChange({ categories: updated });
  };

  const addCategory = () => {
    onChange({ categories: [...categories, { name: '', skills: '' }] });
  };

  const removeCategory = (index: number) => {
    onChange({ categories: categories.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {categories.map((cat, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
            {idx === 0 && <label className="form-label">Category</label>}
            <input className="form-input" value={cat.name || ''} onChange={e => updateCategory(idx, { name: e.target.value })} placeholder="e.g. Languages" />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            {idx === 0 && <label className="form-label">Skills (comma separated)</label>}
            <input className="form-input" value={cat.skills || ''} onChange={e => updateCategory(idx, { skills: e.target.value })} placeholder="JavaScript, Python, Go, Rust" />
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => removeCategory(idx)}>×</button>
        </div>
      ))}
      <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={addCategory}>+ Add Category</button>
    </div>
  );
}

// ─── Projects ──────────────────────────────────────────────────

function ProjectsForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const entries: any[] = content.entries || [];

  const updateEntry = (index: number, patch: Record<string, any>) => {
    const updated = entries.map((e, i) => i === index ? { ...e, ...patch } : e);
    onChange({ entries: updated });
  };

  const addEntry = () => {
    onChange({ entries: [...entries, { name: '', description: '', technologies: '', url: '' }] });
  };

  const removeEntry = (index: number) => {
    onChange({ entries: entries.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Project {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => removeEntry(idx)}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input className="form-input" value={entry.name || ''} onChange={e => updateEntry(idx, { name: e.target.value })} placeholder="My Awesome Project" />
            </div>
            <div className="form-group">
              <label className="form-label">URL (optional)</label>
              <input className="form-input" value={entry.url || ''} onChange={e => updateEntry(idx, { url: e.target.value })} placeholder="github.com/..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={entry.description || ''} onChange={e => updateEntry(idx, { description: e.target.value })} rows={2} placeholder="Built a real-time dashboard that..." />
          </div>
          <div className="form-group">
            <label className="form-label">Technologies</label>
            <input className="form-input" value={entry.technologies || ''} onChange={e => updateEntry(idx, { technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL" />
          </div>
        </div>
      ))}
      <button className="btn btn-sm" onClick={addEntry}>+ Add Project</button>
    </div>
  );
}

// ─── Certifications ────────────────────────────────────────────

function CertificationsForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const entries: any[] = content.entries || [];

  const updateEntry = (index: number, patch: Record<string, any>) => {
    const updated = entries.map((e, i) => i === index ? { ...e, ...patch } : e);
    onChange({ entries: updated });
  };

  const addEntry = () => {
    onChange({ entries: [...entries, { name: '', issuer: '', date: '', url: '' }] });
  };

  const removeEntry = (index: number) => {
    onChange({ entries: entries.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            {idx === 0 && <label className="form-label">Certification</label>}
            <input className="form-input" value={entry.name || ''} onChange={e => updateEntry(idx, { name: e.target.value })} placeholder="AWS Solutions Architect" />
          </div>
          <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
            {idx === 0 && <label className="form-label">Issuer</label>}
            <input className="form-input" value={entry.issuer || ''} onChange={e => updateEntry(idx, { issuer: e.target.value })} placeholder="Amazon" />
          </div>
          <div className="form-group" style={{ flex: '0 0 120px', marginBottom: 0 }}>
            {idx === 0 && <label className="form-label">Date</label>}
            <input className="form-input" value={entry.date || ''} onChange={e => updateEntry(idx, { date: e.target.value })} placeholder="Mar 2024" />
          </div>
          <button className="btn btn-danger btn-sm" style={{ alignSelf: idx === 0 ? 'flex-end' : 'center' }} onClick={() => removeEntry(idx)}>×</button>
        </div>
      ))}
      <button className="btn btn-sm" style={{ marginTop: 4 }} onClick={addEntry}>+ Add Certification</button>
    </div>
  );
}

// ─── References ────────────────────────────────────────────────

function ReferencesForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const entries: any[] = content.entries || [];

  const updateEntry = (index: number, patch: Record<string, any>) => {
    const updated = entries.map((e, i) => i === index ? { ...e, ...patch } : e);
    onChange({ entries: updated });
  };

  const addEntry = () => {
    onChange({ entries: [...entries, { name: '', title: '', organization: '', email: '', phone: '', relationship: '' }] });
  };

  const removeEntry = (index: number) => {
    onChange({ entries: entries.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {entries.map((entry, idx) => (
        <div key={idx} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Reference {idx + 1}</span>
            <button className="btn btn-danger btn-sm" onClick={() => removeEntry(idx)}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={entry.name || ''} onChange={e => updateEntry(idx, { name: e.target.value })} placeholder="Dr. Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Title / Position</label>
              <input className="form-input" value={entry.title || ''} onChange={e => updateEntry(idx, { title: e.target.value })} placeholder="Department Chair" />
            </div>
            <div className="form-group">
              <label className="form-label">Organization</label>
              <input className="form-input" value={entry.organization || ''} onChange={e => updateEntry(idx, { organization: e.target.value })} placeholder="University of Texas" />
            </div>
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input className="form-input" value={entry.relationship || ''} onChange={e => updateEntry(idx, { relationship: e.target.value })} placeholder="Former supervisor" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={entry.email || ''} onChange={e => updateEntry(idx, { email: e.target.value })} placeholder="jane.smith@university.edu" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={entry.phone || ''} onChange={e => updateEntry(idx, { phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-sm" onClick={addEntry}>+ Add Reference</button>
    </div>
  );
}

// ─── Generic (Awards, Volunteer, Custom) ───────────────────────

function GenericForm({ content, onChange }: { content: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const [newKey, setNewKey] = useState('');

  const addField = () => {
    if (newKey.trim()) {
      onChange({ [newKey.trim()]: '' });
      setNewKey('');
    }
  };

  return (
    <div>
      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="form-label">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 11 }}
              onClick={() => {
                const updated = { ...content };
                delete updated[key];
                // We need to replace entirely since we're deleting
                onChange(updated);
              }}
            >
              remove
            </button>
          </div>
          {typeof value === 'string' && value.length > 80 ? (
            <textarea className="form-textarea" value={String(value)} onChange={e => onChange({ [key]: e.target.value })} rows={3} />
          ) : (
            <input className="form-input" value={String(value)} onChange={e => onChange({ [key]: e.target.value })} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input className="form-input" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Field name..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addField()} />
        <button className="btn btn-sm" onClick={addField}>+ Add Field</button>
      </div>
    </div>
  );
}
