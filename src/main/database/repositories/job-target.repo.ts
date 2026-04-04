import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import type { JobTarget } from '../../../shared/types';

export function listJobTargets(): JobTarget[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM job_targets WHERE deleted_at IS NULL ORDER BY updated_at DESC
  `).all() as any[];
  return rows.map(mapJobTarget);
}

export function getJobTarget(id: string): JobTarget | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM job_targets WHERE id = ? AND deleted_at IS NULL').get(id) as any;
  return row ? mapJobTarget(row) : null;
}

export function createJobTarget(data: Partial<JobTarget>): JobTarget {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO job_targets (id, master_resume_id, job_title, company, job_description_text, job_description_url, deadline, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.masterResumeId || null,
    data.jobTitle || '',
    data.company || '',
    data.jobDescriptionText || null,
    data.jobDescriptionUrl || null,
    data.deadline || null,
    data.notes || null,
    data.status || 'draft',
    now, now
  );

  return getJobTarget(id)!;
}

export function updateJobTarget(id: string, data: Partial<JobTarget>): JobTarget {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.masterResumeId !== undefined) { sets.push('master_resume_id = ?'); values.push(data.masterResumeId); }
  if (data.jobTitle !== undefined) { sets.push('job_title = ?'); values.push(data.jobTitle); }
  if (data.company !== undefined) { sets.push('company = ?'); values.push(data.company); }
  if (data.jobDescriptionText !== undefined) { sets.push('job_description_text = ?'); values.push(data.jobDescriptionText); }
  if (data.jobDescriptionUrl !== undefined) { sets.push('job_description_url = ?'); values.push(data.jobDescriptionUrl); }
  if (data.deadline !== undefined) { sets.push('deadline = ?'); values.push(data.deadline); }
  if (data.notes !== undefined) { sets.push('notes = ?'); values.push(data.notes); }
  if (data.coverLetterText !== undefined) { sets.push('cover_letter_text = ?'); values.push(data.coverLetterText); }
  if (data.atsScore !== undefined) { sets.push('ats_score = ?'); values.push(data.atsScore); }
  if (data.preferred !== undefined) { sets.push('preferred = ?'); values.push(data.preferred ? 1 : 0); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (data.tailoredResumeContent !== undefined) {
    sets.push('tailored_resume_content = ?');
    values.push(JSON.stringify(data.tailoredResumeContent));
  }

  values.push(id);
  db.prepare(`UPDATE job_targets SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getJobTarget(id)!;
}

export function deleteJobTarget(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE job_targets SET deleted_at = ? WHERE id = ?').run(now, id);
}

function mapJobTarget(row: any): JobTarget {
  return {
    id: row.id,
    userId: row.user_id,
    masterResumeId: row.master_resume_id,
    jobTitle: row.job_title,
    company: row.company,
    jobDescriptionText: row.job_description_text,
    jobDescriptionUrl: row.job_description_url,
    deadline: row.deadline,
    notes: row.notes,
    tailoredResumeContent: row.tailored_resume_content ? JSON.parse(row.tailored_resume_content) : undefined,
    coverLetterText: row.cover_letter_text,
    atsScore: row.ats_score,
    preferred: row.preferred === 1,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncId: row.sync_id,
    syncVersion: row.sync_version,
    deletedAt: row.deleted_at,
  };
}
