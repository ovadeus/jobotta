import React, { useRef, useEffect, useState } from 'react';
import {
  FileText,
  Crosshair,
  Kanban,
  Archive,
  Sparkle,
  ChartBar,
  Question,
  GearSix,
} from '@phosphor-icons/react';
import type { Page } from '../../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; icon: React.ReactNode; label: string }[] = [
  { page: 'resumes', icon: <FileText size={18} />, label: 'Resumes' },
  { page: 'targets', icon: <Crosshair size={18} />, label: 'Job Targets' },
  { page: 'board', icon: <Kanban size={18} />, label: 'Job Board' },
  { page: 'archive', icon: <Archive size={18} />, label: 'Archive' },
  { page: 'ai', icon: <Sparkle size={18} />, label: 'AI Assistant' },
  { page: 'analytics', icon: <ChartBar size={18} />, label: 'Analytics' },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });

  useEffect(() => {
    const activeBtn = buttonRefs.current[currentPage];
    const container = navRef.current;

    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicator({
        top: btnRect.top - containerRect.top,
        height: btnRect.height,
        visible: true,
      });
    } else if (currentPage === 'settings' && settingsRef.current && navRef.current) {
      // Settings is outside nav, calculate relative to sidebar
      const containerRect = navRef.current.getBoundingClientRect();
      const btnRect = settingsRef.current.getBoundingClientRect();
      setIndicator({
        top: btnRect.top - containerRect.top,
        height: btnRect.height,
        visible: true,
      });
    }
  }, [currentPage]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Jobotta</h1>
      </div>

      <div ref={navRef} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Sliding indicator */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: indicator.top,
            height: indicator.height,
            background: 'var(--accent-orange-light)',
            borderLeft: '3px solid var(--accent-orange)',
            borderRadius: 'var(--radius-md)',
            transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease',
            zIndex: 0,
            opacity: indicator.visible ? 1 : 0,
            pointerEvents: 'none',
          }}
        />

        <nav className="sidebar-nav" style={{ position: 'relative', zIndex: 1 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.page}
              ref={el => { buttonRefs.current[item.page] = el; }}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              <span className="icon" style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Help & Settings pinned to bottom */}
        <div style={{ marginTop: 'auto', padding: '8px', borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            ref={el => { buttonRefs.current['help'] = el; }}
            className={`sidebar-item ${currentPage === 'help' ? 'active' : ''}`}
            onClick={() => onNavigate('help')}
          >
            <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><Question size={18} /></span>
            Help & Support
          </button>
          <button
            ref={el => { buttonRefs.current['settings'] = el; settingsRef.current = el; }}
            className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <span className="icon" style={{ display: 'flex', alignItems: 'center' }}><GearSix size={18} /></span>
            Settings
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <span className="sync-dot" />
        <span>Sync: Idle</span>
        <span style={{ marginLeft: 'auto' }}>v1.0.0</span>
      </div>
    </div>
  );
}
