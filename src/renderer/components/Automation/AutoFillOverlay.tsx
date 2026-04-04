import React from 'react';
import { Lightning } from '@phosphor-icons/react';

export default function AutoFillOverlay() {
  return (
    <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Lightning size={20} />
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Auto-Fill</h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Press <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)' }}>⌘⇧J</span> while on a job application page to detect and fill form fields automatically.
      </p>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: 8 }}>Supported ATS platforms:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Greenhouse', 'Lever', 'Workday', 'iCIMS', 'Taleo', 'BambooHR', 'SmartRecruiters', 'Ashby'].map(ats => (
            <span key={ats} className="badge badge-purple">{ats}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
