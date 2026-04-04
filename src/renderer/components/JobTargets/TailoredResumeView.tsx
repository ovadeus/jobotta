import React, { useState } from 'react';
import { FloppyDisk } from '@phosphor-icons/react';
import ResumePreview from '../Resumes/ResumePreview';
import type { ResumeBlock, MasterResume } from '../../../shared/types';

interface Props {
  blocks: ResumeBlock[];
  resumeName: string;
  company?: string;
  jobTitle?: string;
}

export default function TailoredResumeView({ blocks, resumeName, company, jobTitle }: Props) {
  const [viewMode, setViewMode] = useState<'form' | 'code'>('form');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveAsResume = async () => {
    setSaving(true);
    try {
      // Create a new non-master resume
      const name = `${resumeName} — ${company || jobTitle || 'Tailored'}`;
      const resume = await window.jobotta.createResume({ name, isMaster: false });

      // Delete the default blocks that were auto-created
      const fullResume = await window.jobotta.getResume(resume.id);
      if (fullResume?.blocks) {
        for (const block of fullResume.blocks) {
          await window.jobotta.deleteBlock(block.id);
        }
      }

      // Add the tailored blocks
      for (const block of blocks) {
        await window.jobotta.createBlock(resume.id, {
          blockType: block.blockType || (block as any).block_type,
          title: block.title,
          content: block.content,
          isIncluded: block.isIncluded !== false,
          sortOrder: block.sortOrder,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save tailored resume:', err);
    } finally {
      setSaving(false);
    }
  };

  const includedBlocks = blocks.filter((b: any) => b.isIncluded !== false);

  // Build a fake MasterResume for the preview component
  const previewResume: MasterResume = {
    id: 'tailored-preview',
    name: `${resumeName} (Tailored)`,
    isMaster: false,
    blocks: includedBlocks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>TAILORED RESUME (AI)</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {saved && <span className="badge badge-green">Saved to Resumes!</span>}
            <button
              className="btn btn-sm"
              onClick={handleSaveAsResume}
              disabled={saving}
              style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {saving ? 'Saving...' : <><FloppyDisk size={14} /> Save as New Resume</>}
            </button>
            <span className="badge badge-green">{includedBlocks.length} blocks</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                className="btn btn-sm"
                style={{ background: viewMode === 'form' ? '#1d1d1f' : undefined, color: viewMode === 'form' ? 'white' : undefined, borderColor: viewMode === 'form' ? '#1d1d1f' : undefined }}
                onClick={() => setViewMode('form')}
              >
                Form
              </button>
              <button
                className="btn btn-sm"
                style={{ background: viewMode === 'code' ? '#1d1d1f' : undefined, color: viewMode === 'code' ? 'white' : undefined, borderColor: viewMode === 'code' ? '#1d1d1f' : undefined }}
                onClick={() => setViewMode('code')}
              >
                Code
              </button>
            </div>
            <button className="btn btn-sm" onClick={() => setShowPreview(true)}>
              Preview
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 500, overflow: 'auto' }}>
          {viewMode === 'form' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {includedBlocks.map((block: any, i: number) => (
                <TailoredBlockView key={block.id || i} block={block} />
              ))}
            </div>
          ) : (
            <pre style={{
              whiteSpace: 'pre-wrap', fontSize: 11, fontFamily: 'var(--font-mono)',
              background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              {JSON.stringify(includedBlocks, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)} style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ width: '100%', maxWidth: 780, maxHeight: 'calc(100vh - 80px)', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', padding: '0 8px 8px' }}>
              <button
                className="btn"
                onClick={() => setShowPreview(false)}
                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
              >
                Close Preview
              </button>
            </div>
            <ResumePreview resume={previewResume} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Individual Block Renderer (read-only form view) ───────────

function TailoredBlockView({ block }: { block: any }) {
  const content = block.content || {};
  const blockType = block.blockType || block.block_type || '';
  const title = block.title || blockType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--accent-indigo)', marginBottom: 8 }}>
        {title}
      </div>

      {blockType === 'personal_info' && <PersonalInfoView content={content} />}
      {blockType === 'summary' && <SummaryView content={content} />}
      {blockType === 'work_experience' && <WorkExperienceView content={content} />}
      {blockType === 'education' && <EducationView content={content} />}
      {blockType === 'skills' && <SkillsView content={content} />}
      {blockType === 'projects' && <ProjectsView content={content} />}
      {blockType === 'certifications' && <CertificationsView content={content} />}
      {blockType === 'references' && <ReferencesView content={content} />}
      {!['personal_info', 'summary', 'work_experience', 'education', 'skills', 'projects', 'certifications', 'references'].includes(blockType) && (
        <GenericView content={content} />
      )}
    </div>
  );
}

// ─── Read-only renderers ───────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 3, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
    </div>
  );
}

function PersonalInfoView({ content }: { content: Record<string, any> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
      <FieldRow label="Name" value={content.full_name} />
      <FieldRow label="Email" value={content.email} />
      <FieldRow label="Phone" value={content.phone} />
      <FieldRow label="Location" value={content.location} />
      <FieldRow label="LinkedIn" value={content.linkedin} />
      <FieldRow label="Website" value={content.website} />
    </div>
  );
}

function SummaryView({ content }: { content: Record<string, any> }) {
  return <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{content.text || ''}</p>;
}

function WorkExperienceView({ content }: { content: Record<string, any> }) {
  const entries = content.entries || [];
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No entries</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map((entry: any, i: number) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 13 }}>
              <strong>{entry.title}</strong>
              {entry.company && <span style={{ color: 'var(--text-secondary)' }}> — {entry.company}</span>}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.start_date}{entry.end_date ? ` – ${entry.end_date}` : ''}</span>
          </div>
          {entry.location && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.location}</div>}
          {(entry.bullets || []).filter((b: string) => b?.trim()).map((bullet: string, j: number) => (
            <div key={j} style={{ fontSize: 12, paddingLeft: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>• {bullet}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EducationView({ content }: { content: Record<string, any> }) {
  const entries = content.entries || [];
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No entries</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry: any, i: number) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13 }}>
              <strong>{entry.institution}</strong>
              {entry.degree && <span style={{ color: 'var(--text-secondary)' }}> — {entry.degree}{entry.field ? ` in ${entry.field}` : ''}</span>}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{entry.start_date}{entry.end_date ? ` – ${entry.end_date}` : ''}</span>
          </div>
          {entry.gpa && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GPA: {entry.gpa}</div>}
          {entry.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{entry.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function SkillsView({ content }: { content: Record<string, any> }) {
  const categories = content.categories || [];
  if (categories.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No skills</span>;
  return (
    <div>
      {categories.map((cat: any, i: number) => (
        <div key={i} style={{ fontSize: 12, marginBottom: 3, color: 'var(--text-secondary)' }}>
          {cat.name && <strong>{cat.name}: </strong>}
          <span>{cat.skills || ''}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectsView({ content }: { content: Record<string, any> }) {
  const entries = content.entries || [];
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No projects</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry: any, i: number) => (
        <div key={i}>
          <div style={{ fontSize: 13 }}>
            <strong>{entry.name}</strong>
            {entry.url && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{entry.url}</span>}
          </div>
          {entry.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{entry.description}</div>}
          {entry.technologies && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}><em>{entry.technologies}</em></div>}
        </div>
      ))}
    </div>
  );
}

function CertificationsView({ content }: { content: Record<string, any> }) {
  const entries = content.entries || [];
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No certifications</span>;
  return (
    <div>
      {entries.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
          <div>
            <strong>{entry.name}</strong>
            {entry.issuer && <span style={{ color: 'var(--text-secondary)' }}> — {entry.issuer}</span>}
          </div>
          {entry.date && <span style={{ color: 'var(--text-muted)' }}>{entry.date}</span>}
        </div>
      ))}
    </div>
  );
}

function ReferencesView({ content }: { content: Record<string, any> }) {
  const entries = content.entries || [];
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No references</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map((entry: any, i: number) => (
        <div key={i}>
          <div style={{ fontSize: 13 }}>
            <strong>{entry.name}</strong>
            {entry.title && <span style={{ color: 'var(--text-secondary)' }}> — {entry.title}</span>}
          </div>
          {entry.organization && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.organization}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
            {entry.email && <span>{entry.email}</span>}
            {entry.phone && <span>{entry.phone}</span>}
          </div>
          {entry.relationship && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{entry.relationship}</div>}
        </div>
      ))}
    </div>
  );
}

function GenericView({ content }: { content: Record<string, any> }) {
  const entries = Object.entries(content);
  if (entries.length === 0) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No content</span>;
  return (
    <div>
      {entries.map(([key, value]) => (
        <FieldRow key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={value} />
      ))}
    </div>
  );
}
