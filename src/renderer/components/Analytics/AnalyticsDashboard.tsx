import React, { useState, useEffect } from 'react';
import { ChartBar } from '@phosphor-icons/react';
import type { Application, ApplicationStage } from '../../../shared/types';

export default function AnalyticsDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    window.jobotta.listApplications().then(setApplications);
  }, []);

  const stageCounts: Record<string, number> = {};
  for (const app of applications) {
    stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1;
  }

  const stages: { key: ApplicationStage; label: string; color: string }[] = [
    { key: 'saved', label: 'Saved', color: 'var(--text-muted)' },
    { key: 'applied', label: 'Applied', color: 'var(--accent-blue)' },
    { key: 'phone_screen', label: 'Phone Screen', color: 'var(--accent-yellow)' },
    { key: 'interview', label: 'Interview', color: 'var(--accent-purple)' },
    { key: 'offer', label: 'Offer', color: 'var(--accent-green)' },
    { key: 'accepted', label: 'Accepted', color: '#22c55e' },
    { key: 'rejected', label: 'Rejected', color: 'var(--accent-red)' },
  ];

  const maxCount = Math.max(1, ...Object.values(stageCounts));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-indigo)' }}>{applications.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Total Applications</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>{stageCounts['offer'] || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Offers</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-purple)' }}>{stageCounts['interview'] || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Interviews</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)' }}>{stageCounts['applied'] || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Applied</div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Pipeline Funnel</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stages.map(stage => (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 100, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{stage.label}</span>
            <div style={{ flex: 1, height: 24, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${((stageCounts[stage.key] || 0) / maxCount) * 100}%`,
                height: '100%',
                background: stage.color,
                borderRadius: 4,
                transition: 'width 0.3s ease',
                minWidth: stageCounts[stage.key] ? 24 : 0,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
                fontSize: 11,
                fontWeight: 600,
                color: 'white',
              }}>
                {stageCounts[stage.key] || ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <ChartBar size={40} />
          <p>No data yet</p>
          <p style={{ fontSize: 11 }}>Add applications to see your pipeline analytics</p>
        </div>
      )}
    </div>
  );
}
