import React from 'react';
import type { MasterResume, ResumeBlock } from '../../../shared/types';

interface Props {
  resume: MasterResume;
}

const S = {
  page: {
    background: 'white',
    color: '#1a1a1a',
    padding: '40px 48px',
    borderRadius: 8,
    maxWidth: 720,
    margin: '0 auto',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: 12,
    lineHeight: 1.55,
    boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
    minHeight: 600,
  } as React.CSSProperties,
  name: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: -0.5,
    marginBottom: 2,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    color: '#111',
  } as React.CSSProperties,
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 16px',
    fontSize: 11,
    color: '#555',
    marginBottom: 4,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  } as React.CSSProperties,
  divider: {
    border: 'none',
    borderTop: '1.5px solid #222',
    margin: '12px 0 16px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: '#333',
    borderBottom: '1px solid #ccc',
    paddingBottom: 3,
    marginBottom: 10,
    marginTop: 18,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  } as React.CSSProperties,
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  } as React.CSSProperties,
  bold: { fontWeight: 700, fontSize: 12.5 } as React.CSSProperties,
  italic: { fontStyle: 'italic', color: '#555' } as React.CSSProperties,
  date: { fontSize: 11, color: '#666', whiteSpace: 'nowrap', fontFamily: "'Helvetica Neue', Arial, sans-serif" } as React.CSSProperties,
  bullet: { margin: '2px 0', paddingLeft: 14, textIndent: -14 } as React.CSSProperties,
  empty: { color: '#bbb', fontStyle: 'italic', fontSize: 11 } as React.CSSProperties,
};

export default function ResumePreview({ resume }: Props) {
  const blocks = resume.blocks.filter(b => b.isIncluded);

  const findBlock = (type: string) => blocks.find(b => b.blockType === type);
  const otherBlocks = blocks.filter(b =>
    !['personal_info', 'summary', 'work_experience', 'education', 'skills', 'projects', 'certifications', 'references'].includes(b.blockType)
  );

  const personal = findBlock('personal_info');
  const summary = findBlock('summary');
  const experience = findBlock('work_experience');
  const education = findBlock('education');
  const skills = findBlock('skills');
  const projects = findBlock('projects');
  const certifications = findBlock('certifications');
  const references = findBlock('references');

  const c = (block: ResumeBlock | undefined) => (block?.content || {}) as Record<string, any>;

  const isEmpty = (val: any) => !val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0);

  return (
    <div style={S.page} data-resume-preview>
      {/* ─── Header / Personal Info ─────────────────────────── */}
      {personal && (
        <>
          <div style={S.name}>{c(personal).full_name || resume.name}</div>
          <div style={S.contactRow}>
            {c(personal).email && <span>{c(personal).email}</span>}
            {c(personal).phone && <span>{c(personal).phone}</span>}
            {c(personal).location && <span>{c(personal).location}</span>}
            {c(personal).linkedin && <span>{c(personal).linkedin}</span>}
            {c(personal).website && <span>{c(personal).website}</span>}
          </div>
          <hr style={S.divider} />
        </>
      )}

      {!personal && (
        <>
          <div style={S.name}>{resume.name}</div>
          <hr style={S.divider} />
        </>
      )}

      {/* ─── Summary ────────────────────────────────────────── */}
      {summary && c(summary).text && (
        <>
          <div style={S.sectionTitle}>Professional Summary</div>
          <p style={{ marginBottom: 0 }}>{c(summary).text}</p>
        </>
      )}

      {/* ─── Work Experience ────────────────────────────────── */}
      {experience && !isEmpty(c(experience).entries) && (
        <>
          <div style={S.sectionTitle}>Experience</div>
          {(c(experience).entries || []).map((entry: any, i: number) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={S.entryHeader}>
                <div>
                  <span style={S.bold}>{entry.title || 'Position'}</span>
                  {entry.company && <span style={S.italic}> — {entry.company}</span>}
                </div>
                <span style={S.date}>
                  {entry.start_date}{entry.start_date && entry.end_date ? ' – ' : ''}{entry.end_date}
                </span>
              </div>
              {entry.location && <div style={{ fontSize: 11, color: '#777', marginBottom: 3 }}>{entry.location}</div>}
              {(entry.bullets || []).filter((b: string) => b?.trim()).map((bullet: string, j: number) => (
                <div key={j} style={S.bullet}>• {bullet}</div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* ─── Education ──────────────────────────────────────── */}
      {education && !isEmpty(c(education).entries) && (
        <>
          <div style={S.sectionTitle}>Education</div>
          {(c(education).entries || []).map((entry: any, i: number) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={S.entryHeader}>
                <div>
                  <span style={S.bold}>{entry.institution || 'Institution'}</span>
                  {entry.degree && <span style={S.italic}> — {entry.degree}{entry.field ? ` in ${entry.field}` : ''}</span>}
                </div>
                <span style={S.date}>
                  {entry.start_date}{entry.start_date && entry.end_date ? ' – ' : ''}{entry.end_date}
                </span>
              </div>
              {entry.gpa && <div style={{ fontSize: 11, color: '#666' }}>GPA: {entry.gpa}</div>}
              {entry.notes && <div style={{ fontSize: 11, color: '#555' }}>{entry.notes}</div>}
            </div>
          ))}
        </>
      )}

      {/* ─── Skills ─────────────────────────────────────────── */}
      {skills && !isEmpty(c(skills).categories) && (
        <>
          <div style={S.sectionTitle}>Skills</div>
          {(c(skills).categories || []).map((cat: any, i: number) => (
            <div key={i} style={{ marginBottom: 3 }}>
              {cat.name && <strong>{cat.name}: </strong>}
              <span>{cat.skills || ''}</span>
            </div>
          ))}
        </>
      )}

      {/* ─── Projects ───────────────────────────────────────── */}
      {projects && !isEmpty(c(projects).entries) && (
        <>
          <div style={S.sectionTitle}>Projects</div>
          {(c(projects).entries || []).map((entry: any, i: number) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={S.bold}>{entry.name || 'Project'}</span>
                {entry.url && <span style={{ fontSize: 10, color: '#888' }}>{entry.url}</span>}
              </div>
              {entry.description && <div style={{ marginTop: 2 }}>{entry.description}</div>}
              {entry.technologies && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}><em>Technologies: {entry.technologies}</em></div>}
            </div>
          ))}
        </>
      )}

      {/* ─── Certifications ─────────────────────────────────── */}
      {certifications && !isEmpty(c(certifications).entries) && (
        <>
          <div style={S.sectionTitle}>Certifications</div>
          {(c(certifications).entries || []).map((entry: any, i: number) => (
            <div key={i} style={{ marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={S.bold}>{entry.name || 'Certification'}</span>
                {entry.issuer && <span style={S.italic}> — {entry.issuer}</span>}
              </div>
              {entry.date && <span style={S.date}>{entry.date}</span>}
            </div>
          ))}
        </>
      )}

      {/* ─── References ───────────────────────────────────── */}
      {references && !isEmpty(c(references).entries) && (
        <>
          <div style={S.sectionTitle}>References</div>
          {(c(references).entries || []).map((entry: any, i: number) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div>
                <span style={S.bold}>{entry.name || 'Reference'}</span>
                {entry.title && <span style={S.italic}> — {entry.title}</span>}
              </div>
              {entry.organization && <div style={{ fontSize: 11, color: '#555' }}>{entry.organization}</div>}
              <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 16, marginTop: 2 }}>
                {entry.email && <span>{entry.email}</span>}
                {entry.phone && <span>{entry.phone}</span>}
              </div>
              {entry.relationship && <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>{entry.relationship}</div>}
            </div>
          ))}
        </>
      )}

      {/* ─── Other blocks (Awards, Volunteer, Custom) ────── */}
      {otherBlocks.map(block => (
        <div key={block.id}>
          <div style={S.sectionTitle}>{block.title || block.blockType.replace(/_/g, ' ')}</div>
          {Object.entries(block.content).map(([key, value]) => (
            <div key={key} style={{ marginBottom: 3 }}>
              <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}:</strong> {String(value)}
            </div>
          ))}
          {Object.keys(block.content).length === 0 && <span style={S.empty}>No content</span>}
        </div>
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
          <p style={{ fontSize: 14 }}>No blocks added yet</p>
          <p style={{ fontSize: 11 }}>Add blocks to your resume to see a preview here</p>
        </div>
      )}
    </div>
  );
}
