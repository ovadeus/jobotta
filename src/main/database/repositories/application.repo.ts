import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import type { Application, Milestone, Contact, ApplicationStage } from '../../../shared/types';

export function listApplications(): Application[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM applications WHERE deleted_at IS NULL ORDER BY updated_at DESC
  `).all() as any[];
  return rows.map(row => loadRelations(row));
}

export function getApplication(id: string): Application | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ? AND deleted_at IS NULL').get(id) as any;
  return row ? loadRelations(row) : null;
}

export function createApplication(data: Partial<Application>): Application {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO applications (id, job_target_id, company, role, stage, applied_date, source, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.jobTargetId || null,
    data.company || '',
    data.role || '',
    data.stage || 'saved',
    data.appliedDate || null,
    data.source || null,
    data.notes || null,
    now, now
  );

  return getApplication(id)!;
}

export function updateApplication(id: string, data: Partial<Application>): Application {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.company !== undefined) { sets.push('company = ?'); values.push(data.company); }
  if (data.role !== undefined) { sets.push('role = ?'); values.push(data.role); }
  if (data.stage !== undefined) { sets.push('stage = ?'); values.push(data.stage); }
  if (data.priority !== undefined) { sets.push('priority = ?'); values.push(data.priority ? 1 : 0); }
  if (data.appliedDate !== undefined) { sets.push('applied_date = ?'); values.push(data.appliedDate); }
  if (data.source !== undefined) { sets.push('source = ?'); values.push(data.source); }
  if (data.notes !== undefined) { sets.push('notes = ?'); values.push(data.notes); }
  if (data.jobTargetId !== undefined) { sets.push('job_target_id = ?'); values.push(data.jobTargetId); }

  values.push(id);
  db.prepare(`UPDATE applications SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getApplication(id)!;
}

export function deleteApplication(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE applications SET deleted_at = ? WHERE id = ?').run(now, id);
}

// ─── Milestone operations ──────────────────────────────────────

export function addMilestone(applicationId: string, data: Partial<Milestone>): Milestone {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO milestones (id, application_id, title, notes, occurred_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, applicationId, data.title || '', data.notes || null, data.occurredAt || new Date().toISOString());
  return db.prepare('SELECT * FROM milestones WHERE id = ?').get(id) as any as Milestone;
}

export function deleteMilestone(id: string): void {
  getDb().prepare('DELETE FROM milestones WHERE id = ?').run(id);
}

// ─── Contact operations ────────────────────────────────────────

export function addContact(applicationId: string, data: Partial<Contact>): Contact {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO contacts (id, application_id, name, role, email, phone, linkedin, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, applicationId, data.name || '', data.role || null, data.email || null, data.phone || null, data.linkedin || null, data.notes || null);
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any as Contact;
}

export function deleteContact(id: string): void {
  getDb().prepare('DELETE FROM contacts WHERE id = ?').run(id);
}

// ─── Helpers ───────────────────────────────────────────────────

function loadRelations(row: any): Application {
  const db = getDb();
  const milestones = db.prepare('SELECT * FROM milestones WHERE application_id = ? ORDER BY occurred_at DESC').all(row.id) as any[];
  const contacts = db.prepare('SELECT * FROM contacts WHERE application_id = ?').all(row.id) as any[];

  return {
    id: row.id,
    userId: row.user_id,
    jobTargetId: row.job_target_id,
    company: row.company,
    role: row.role,
    stage: row.stage as ApplicationStage,
    priority: row.priority === 1,
    appliedDate: row.applied_date,
    source: row.source,
    notes: row.notes,
    milestones: milestones.map(m => ({
      id: m.id,
      applicationId: m.application_id,
      title: m.title,
      notes: m.notes,
      occurredAt: m.occurred_at,
    })),
    contacts: contacts.map(c => ({
      id: c.id,
      applicationId: c.application_id,
      name: c.name,
      role: c.role,
      email: c.email,
      phone: c.phone,
      linkedin: c.linkedin,
      notes: c.notes,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncId: row.sync_id,
    syncVersion: row.sync_version,
    deletedAt: row.deleted_at,
  };
}
