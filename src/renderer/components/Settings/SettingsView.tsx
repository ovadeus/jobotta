import React, { useState, useEffect, useCallback } from 'react';
import { User, GearSix, Sun, Moon } from '@phosphor-icons/react';
import type { UserPreferences } from '../../../shared/types';

type AIProvider = 'gemini' | 'openai' | 'anthropic';
type SettingsTab = 'personal' | 'app';

const PROVIDER_INFO: Record<AIProvider, { label: string; keyPlaceholder: string; keyUrl: string; models: { value: string; label: string }[] }> = {
  gemini: {
    label: 'Google Gemini',
    keyPlaceholder: 'AIza...',
    keyUrl: 'ai.google.dev',
    models: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast)' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (most capable)' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
  openai: {
    label: 'OpenAI',
    keyPlaceholder: 'sk-...',
    keyUrl: 'platform.openai.com/api-keys',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (recommended)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (fast, cheap)' },
      { value: 'o3-mini', label: 'o3-mini (reasoning)' },
    ],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    keyPlaceholder: 'sk-ant-...',
    keyUrl: 'console.anthropic.com/settings/keys',
    models: [
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (recommended)' },
      { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (fast)' },
      { value: 'claude-opus-4-5', label: 'Claude Opus 4.5 (most capable)' },
    ],
  },
};

interface SettingsViewProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function SettingsView({ onThemeChange }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');

  const load = useCallback(async () => {
    const data = await window.jobotta.getSettings();
    setSettings(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (patch: Partial<UserPreferences>) => {
    await window.jobotta.updateSettings(patch);
    await load();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return null;

  return (
    <div style={{ maxWidth: 640 }}>
      {saved && (
        <div style={{ position: 'fixed', top: 60, right: 24, background: 'var(--accent-green)', color: 'white', padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500, zIndex: 200 }}>
          Settings saved
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-color)', marginBottom: 24 }}>
        {([
          { key: 'personal' as const, label: 'Personal Information', icon: 'personal' },
          { key: 'app' as const, label: 'Application Settings', icon: 'app' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#1d1d1f' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1d1d1f' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all var(--transition-fast)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon === 'personal' ? <User size={16} /> : <GearSix size={16} />}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && <PersonalInfoTab settings={settings} update={update} />}
      {activeTab === 'app' && <AppSettingsTab settings={settings} update={update} onThemeChange={onThemeChange} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PERSONAL INFORMATION TAB
// ═══════════════════════════════════════════════════════════════

function PersonalInfoTab({ settings, update }: { settings: UserPreferences; update: (p: Partial<UserPreferences>) => void }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
        This is your default profile. When you create a new resume, the Personal Info block will be pre-filled with this information. Changes here won't affect existing resumes.
      </p>

      <div className="settings-section">
        <h3>Contact Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={settings.profileFullName || ''} onChange={e => update({ profileFullName: e.target.value })} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={settings.profileEmail || ''} onChange={e => update({ profileEmail: e.target.value })} placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={settings.profilePhone || ''} onChange={e => update({ profilePhone: e.target.value })} placeholder="(555) 123-4567" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={settings.profileLocation || ''} onChange={e => update({ profileLocation: e.target.value })} placeholder="San Francisco, CA" />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Online Presence</h3>
        <div className="form-group">
          <label className="form-label">LinkedIn URL</label>
          <input className="form-input" value={settings.profileLinkedin || ''} onChange={e => update({ profileLinkedin: e.target.value })} placeholder="linkedin.com/in/johndoe" />
        </div>
        <div className="form-group">
          <label className="form-label">Website / Portfolio</label>
          <input className="form-input" value={settings.profileWebsite || ''} onChange={e => update({ profileWebsite: e.target.value })} placeholder="johndoe.dev" />
        </div>
      </div>

      <div className="settings-section">
        <h3>Cover Letter Signature</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          This signature block will be used at the end of generated cover letters, replacing "[Candidate Name]". Include your name, title, contact details, or links — similar to an email signature.
        </p>
        <div className="form-group">
          <textarea
            className="form-textarea"
            value={settings.coverLetterSignature || ''}
            onChange={e => update({ coverLetterSignature: e.target.value })}
            rows={5}
            placeholder={"Sincerely,\n\nJohn Doe\njohn@example.com\nlinkedin.com/in/johndoe\njohndoe.dev"}
            style={{ fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}
          />
        </div>
        {!settings.coverLetterSignature && settings.profileFullName && (
          <button
            className="btn btn-sm"
            onClick={() => {
              const parts = [
                'Sincerely,\n',
                settings.profileFullName,
                settings.profileEmail,
                settings.profilePhone,
                settings.profileLinkedin,
                settings.profileWebsite,
              ].filter(Boolean);
              update({ coverLetterSignature: parts.join('\n') });
            }}
          >
            Generate from profile info
          </button>
        )}
      </div>

      <div className="settings-section">
        <h3>Application Defaults</h3>
        <div className="form-group">
          <label className="form-label">Salary Expectation</label>
          <input className="form-input" value={settings.salaryExpectation || ''} onChange={e => update({ salaryExpectation: e.target.value })} placeholder="e.g. $120,000 - $150,000" />
        </div>
        <div className="form-group">
          <label className="form-label">Work Authorization</label>
          <input className="form-input" value={settings.workAuthorization || ''} onChange={e => update({ workAuthorization: e.target.value })} placeholder="e.g. US Citizen, H1-B, etc." />
        </div>
        <div className="settings-row">
          <label>Willing to relocate</label>
          <div
            className={`block-toggle ${settings.willingToRelocate ? 'active' : ''}`}
            onClick={() => update({ willingToRelocate: !settings.willingToRelocate })}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPLICATION SETTINGS TAB
// ═══════════════════════════════════════════════════════════════

function AppSettingsTab({ settings, update, onThemeChange }: { settings: UserPreferences; update: (p: Partial<UserPreferences>) => void; onThemeChange?: (t: 'light' | 'dark') => void }) {
  const activeProvider = (settings.aiProvider || 'gemini') as AIProvider;
  const providerInfo = PROVIDER_INFO[activeProvider];

  const apiKeyForProvider = (p: AIProvider): string => {
    switch (p) {
      case 'gemini': return settings.geminiApiKey || '';
      case 'openai': return settings.openaiApiKey || '';
      case 'anthropic': return settings.anthropicApiKey || '';
    }
  };

  const modelForProvider = (p: AIProvider): string => {
    switch (p) {
      case 'gemini': return settings.geminiModel || 'gemini-2.5-flash';
      case 'openai': return settings.openaiModel || 'gpt-4o';
      case 'anthropic': return settings.anthropicModel || 'claude-sonnet-4-5';
    }
  };

  const updateApiKey = (p: AIProvider, key: string) => {
    switch (p) {
      case 'gemini': return update({ geminiApiKey: key });
      case 'openai': return update({ openaiApiKey: key });
      case 'anthropic': return update({ anthropicApiKey: key });
    }
  };

  const updateModel = (p: AIProvider, model: string) => {
    switch (p) {
      case 'gemini': return update({ geminiModel: model });
      case 'openai': return update({ openaiModel: model });
      case 'anthropic': return update({ anthropicModel: model });
    }
  };

  return (
    <div>
      {/* Appearance */}
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="form-group">
          <label className="form-label">Theme</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark'] as const).map(t => (
              <button
                key={t}
                className="btn"
                style={{
                  flex: 1,
                  background: (settings.theme || 'light') === t ? '#1d1d1f' : 'var(--bg-tertiary)',
                  borderColor: (settings.theme || 'light') === t ? '#1d1d1f' : 'var(--border-color)',
                  color: (settings.theme || 'light') === t ? 'white' : 'var(--text-primary)',
                  padding: '10px 8px',
                }}
                onClick={() => {
                  update({ theme: t });
                  onThemeChange?.(t);
                }}
              >
                <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>{t === 'light' ? <Sun size={16} /> : <Moon size={16} />}</span>
                {t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Search API */}
      <div className="settings-section">
        <h3>Job Search API</h3>
        <div className="form-group">
          <label className="form-label">RapidAPI Key (for JSearch)</label>
          <input className="form-input" type="password" value={settings.rapidApiKey || ''} onChange={e => update({ rapidApiKey: e.target.value })} placeholder="Enter your RapidAPI key..." />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Get a free key at <strong>rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch</strong> — 200 searches/month free. Searches LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more.
          </span>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section">
        <h3>Account & Sync</h3>
        <div className="form-group">
          <label className="form-label">Jobotta API URL</label>
          <input className="form-input" value={settings.syncApiUrl || ''} onChange={e => update({ syncApiUrl: e.target.value })} placeholder="https://api.jobotta.app" />
        </div>
        <div className="form-group">
          <label className="form-label">Sync Frequency</label>
          <select className="form-select" value={settings.syncFrequency || 'manual'} onChange={e => update({ syncFrequency: e.target.value as any })}>
            <option value="realtime">Realtime</option>
            <option value="hourly">Hourly</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* AI Provider Selection */}
      <div className="settings-section">
        <h3>AI Configuration</h3>

        <div className="form-group">
          <label className="form-label">AI Provider</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(PROVIDER_INFO) as AIProvider[]).map(p => {
              const info = PROVIDER_INFO[p];
              const hasKey = !!apiKeyForProvider(p);
              const isActive = activeProvider === p;
              return (
                <button
                  key={p}
                  className="btn"
                  style={{
                    flex: 1,
                    background: isActive ? '#1d1d1f' : 'var(--bg-tertiary)',
                    borderColor: isActive ? '#1d1d1f' : 'var(--border-color)',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    flexDirection: 'column',
                    padding: '10px 8px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onClick={() => update({ aiProvider: p })}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{info.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {hasKey ? 'Key set' : 'No key'}
                    {hasKey && <span style={{ color: isActive ? '#aaf' : 'var(--accent-green)', marginLeft: 4 }}>●</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginTop: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {providerInfo.label} Configuration
            {apiKeyForProvider(activeProvider) && <span className="badge badge-green">Connected</span>}
          </div>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input className="form-input" type="password" value={apiKeyForProvider(activeProvider)} onChange={e => updateApiKey(activeProvider, e.target.value)} placeholder={providerInfo.keyPlaceholder} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Get your key at {providerInfo.keyUrl}</span>
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <select className="form-select" value={modelForProvider(activeProvider)} onChange={e => updateModel(activeProvider, e.target.value)}>
              {providerInfo.models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cover Letter Style</label>
          <select className="form-select" value={settings.coverLetterStyle} onChange={e => update({ coverLetterStyle: e.target.value as any })}>
            <option value="short">Short (~150 words)</option>
            <option value="medium">Medium (~300 words)</option>
            <option value="comprehensive">Comprehensive (~500 words)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">ATS Strategy</label>
          <select className="form-select" value={settings.atsStrategy} onChange={e => update({ atsStrategy: e.target.value as any })}>
            <option value="keyword_match">Keyword Match</option>
            <option value="balanced">Balanced</option>
            <option value="narrative">Narrative</option>
          </select>
        </div>
      </div>

      {/* Automation */}
      <div className="settings-section">
        <h3>Browser Automation</h3>
        <div className="form-group">
          <label className="form-label">Default Browser</label>
          <select className="form-select" value={settings.defaultBrowser || 'chrome'} onChange={e => update({ defaultBrowser: e.target.value as any })}>
            <option value="chrome">Google Chrome</option>
            <option value="safari">Safari</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Auto-Fill Mode</label>
          <select className="form-select" value={settings.autoFillMode || 'balanced'} onChange={e => update({ autoFillMode: e.target.value as any })}>
            <option value="conservative">Conservative — fill only high-confidence fields</option>
            <option value="balanced">Balanced — fill most fields, flag uncertain</option>
            <option value="aggressive">Aggressive — fill all detected fields</option>
          </select>
        </div>
        <div className="settings-row">
          <label>Confirm before submitting</label>
          <div
            className={`block-toggle ${settings.confirmBeforeSubmit !== false ? 'active' : ''}`}
            onClick={() => update({ confirmBeforeSubmit: !settings.confirmBeforeSubmit })}
          />
        </div>
      </div>

      {/* Keyboard shortcut info */}
      <div className="settings-section">
        <h3>Keyboard Shortcuts</h3>
        <div className="settings-row">
          <label>Trigger Auto-Fill</label>
          <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {navigator.platform.includes('Mac') ? '⌘⇧J' : 'Ctrl+Shift+J'}
          </span>
        </div>
      </div>
    </div>
  );
}
