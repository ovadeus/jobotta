import React, { useState } from 'react';
import {
  FileText, Crosshair, Kanban, Sparkle, MagnifyingGlass,
  GearSix, Archive, Star, Crown, GitBranch, FloppyDisk, Lightning,
} from '@phosphor-icons/react';

type Section = 'overview' | 'resumes' | 'targets' | 'board' | 'ai' | 'search' | 'settings' | 'shortcuts' | 'faq';

const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Getting Started', icon: <Lightning size={16} /> },
  { key: 'resumes', label: 'Resumes', icon: <FileText size={16} /> },
  { key: 'targets', label: 'Job Targets', icon: <Crosshair size={16} /> },
  { key: 'search', label: 'Job Search', icon: <MagnifyingGlass size={16} /> },
  { key: 'board', label: 'Job Board', icon: <Kanban size={16} /> },
  { key: 'ai', label: 'AI Features', icon: <Sparkle size={16} /> },
  { key: 'settings', label: 'Settings & API Keys', icon: <GearSix size={16} /> },
  { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Lightning size={16} /> },
  { key: 'faq', label: 'FAQ', icon: <Star size={16} /> },
];

export default function HelpView() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  return (
    <div style={{ display: 'flex', gap: 0, margin: '-24px', height: 'calc(100% + 48px)' }}>
      {/* Sidebar TOC */}
      <div style={{
        width: 220, flexShrink: 0, borderRight: '1px solid var(--border-color)',
        padding: '16px 8px', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 12px', marginBottom: 8 }}>
          Topics
        </div>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', textAlign: 'left', padding: '8px 12px',
              border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontSize: 13, fontWeight: activeSection === s.key ? 600 : 400,
              background: activeSection === s.key ? 'var(--accent-orange-light)' : 'transparent',
              color: activeSection === s.key ? 'var(--accent-orange)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto', lineHeight: 1.7, fontSize: 13 }}>
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'resumes' && <ResumesSection />}
        {activeSection === 'targets' && <TargetsSection />}
        {activeSection === 'search' && <SearchSection />}
        {activeSection === 'board' && <BoardSection />}
        {activeSection === 'ai' && <AISection />}
        {activeSection === 'settings' && <SettingsSection />}
        {activeSection === 'shortcuts' && <ShortcutsSection />}
        {activeSection === 'faq' && <FAQSection />}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, marginTop: 20, color: 'var(--accent-orange)' }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>{children}</p>;
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--accent-orange-light)', borderLeft: '3px solid var(--accent-orange)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 12, color: 'var(--text-primary)' }}>
      <strong>Tip:</strong> {children}
    </div>
  );
}
function KBD({ children }: { children: string }) {
  return <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', border: '1px solid var(--border-color)' }}>{children}</kbd>;
}

// ─── Sections ──────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div>
      <H2>Getting Started with Jobotta</H2>
      <P>Jobotta is an intelligent desktop application that helps you manage every aspect of your job search — from building resumes to tracking applications.</P>

      <H3>The Workflow</H3>
      <P>The typical flow through Jobotta is:</P>
      <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <li><strong>Build your master resume</strong> in the Resumes section with all your experience, skills, and education.</li>
        <li><strong>Find a job</strong> using the built-in Job Search, by pasting a URL, or by adding one manually in Job Targets.</li>
        <li><strong>Tailor your resume</strong> — AI analyzes the job description and optimizes your resume blocks for that specific role.</li>
        <li><strong>Generate a cover letter</strong> — AI creates a personalized cover letter in your preferred style and length.</li>
        <li><strong>Add to Job Board</strong> — Move the job target to your Kanban board to track your application progress.</li>
        <li><strong>Track progress</strong> — Drag cards across stages: Saved → Applied → Phone Screen → Interview → Offer.</li>
        <li><strong>Archive</strong> — Move completed or old applications to the Archive to keep your board focused.</li>
      </ol>

      <H3>First-Time Setup</H3>
      <P>Before using AI features, you need at least one API key configured in Settings:</P>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>AI Provider</strong> (required for AI features) — Google Gemini (free), OpenAI, or Anthropic</li>
        <li><strong>RapidAPI / JSearch</strong> (optional) — Enables in-app job searching across LinkedIn, Indeed, Glassdoor, and more</li>
      </ul>
      <Tip>You can use Jobotta without any API keys for manual resume building, job tracking, and the Kanban board. AI features just won't be available.</Tip>
    </div>
  );
}

function ResumesSection() {
  return (
    <div>
      <H2>Resumes</H2>
      <P>The Resumes section is where you build and manage your resume content using a block-based editor.</P>

      <H3>Master vs. Tailored Resumes</H3>
      <P><Crown size={14} weight="fill" style={{ color: 'var(--accent-orange)', verticalAlign: 'middle' }} /> <strong>Master resumes</strong> are your comprehensive base resumes containing all your experience. They always appear at the top of the list.</P>
      <P><GitBranch size={14} style={{ verticalAlign: 'middle' }} /> <strong>Tailored resumes</strong> are derived from masters, optimized for a specific job. Created when you use "Save as New Resume" from a tailored result in Job Targets.</P>

      <H3>Block Types</H3>
      <P>Each resume is made up of blocks. Available types:</P>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Personal Info</strong> — Name, email, phone, location, LinkedIn, website</li>
        <li><strong>Professional Summary</strong> — Your career summary paragraph</li>
        <li><strong>Work Experience</strong> — Jobs with company, title, dates, location, bullet points</li>
        <li><strong>Education</strong> — Degrees, institutions, dates, GPA, honors</li>
        <li><strong>Skills</strong> — Categorized skill lists</li>
        <li><strong>Projects</strong> — Portfolio projects with descriptions and tech stacks</li>
        <li><strong>Certifications</strong> — Professional certifications with issuers and dates</li>
        <li><strong>References</strong> — Professional references with contact info</li>
        <li><strong>Awards, Volunteer, Custom</strong> — Flexible blocks for additional content</li>
      </ul>

      <H3>Editing Blocks</H3>
      <P>Each block has two editing modes:</P>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Form view</strong> (default) — Friendly form fields for each block type</li>
        <li><strong>Code view</strong> — Raw JSON editor for advanced users</li>
      </ul>
      <Tip>Drag the grip handle (⠿) on the left side of any block to reorder. Changes are saved automatically.</Tip>

      <H3>Preview & Export</H3>
      <P>Click <strong>Preview</strong> to see your resume formatted as a document. From the preview, you can:</P>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Print</strong> — Send to printer</li>
        <li><strong>Download DOC</strong> — Save as a Word-compatible document</li>
        <li><strong>Download PDF</strong> — Save as PDF via the print dialog</li>
      </ul>
    </div>
  );
}

function TargetsSection() {
  return (
    <div>
      <H2>Job Targets</H2>
      <P>Job Targets are jobs you're interested in applying to. This is where you prepare your application materials before submitting.</P>

      <H3>Adding Job Targets</H3>
      <P>Three ways to add a job target:</P>
      <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Search Jobs</strong> — Use the built-in JSearch integration to find and import jobs (requires RapidAPI key)</li>
        <li><strong>Import from URL</strong> — Paste a job posting URL and AI extracts the title, company, description, and notes</li>
        <li><strong>Manual entry</strong> — Type the job details yourself</li>
      </ol>

      <H3>Job Target Detail Page</H3>
      <P>Each target shows (in order):</P>
      <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Linked Resume</strong> — The master resume connected to this target, with a "Tailor for This Job" button</li>
        <li><strong>Tailored Resume (AI)</strong> — The AI-optimized version with Form/Code/Preview views and "Save as New Resume"</li>
        <li><strong>Cover Letter</strong> — Generate in Short (~150 words), Medium (~300), or Full (~500) styles</li>
        <li><strong>Job URL</strong> — Link to the original posting</li>
        <li><strong>Job Description</strong> — Full text of the role</li>
        <li><strong>Notes</strong> — Salary, location, contacts, application instructions</li>
      </ol>

      <H3>Priority & Status</H3>
      <P>Mark targets as <Star size={12} weight="fill" style={{ color: 'var(--accent-green)', verticalAlign: 'middle' }} /> <strong>Priority</strong> to highlight your top choices. Status options: Draft, Active, Submitted, Applied, Closed.</P>
      <Tip>Click "Add to Job Board" to create a linked application card on the Kanban board. The status changes to "Submitted".</Tip>
    </div>
  );
}

function SearchSection() {
  return (
    <div>
      <H2>Job Search</H2>
      <P>The built-in job search uses the JSearch API (via RapidAPI) to search across LinkedIn, Indeed, Glassdoor, ZipRecruiter, and thousands of company career pages — all through Google for Jobs.</P>

      <H3>Setup</H3>
      <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li>Go to <strong>rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch</strong></li>
        <li>Click "Subscribe to Test" and select the <strong>Basic (Free)</strong> plan — $0/month, 200 searches</li>
        <li>Copy your <strong>X-RapidAPI-Key</strong> from the page</li>
        <li>Paste it in Settings → Application Settings → Job Search API</li>
      </ol>

      <H3>Searching</H3>
      <P>From Job Targets, click "Search Jobs". Enter keywords and optionally a location. Use the filters for date posted, employment type, and remote-only. Your remaining search count shows next to the title.</P>

      <H3>Importing Results</H3>
      <P>Click <strong>+ Target</strong> on any result to instantly create a Job Target with the title, company, description, salary, and apply link pre-filled.</P>

      <Tip>The JSearch API is optional. Without it, you can still add jobs via URL import or manual entry. The search button only appears when a key is configured.</Tip>
    </div>
  );
}

function BoardSection() {
  return (
    <div>
      <H2>Job Board</H2>
      <P>The Job Board is a Kanban-style tracker for your active applications. Drag cards between columns to track progress.</P>

      <H3>Stages</H3>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Saved</strong> — Jobs you're interested in but haven't applied to yet</li>
        <li><strong>Applied</strong> — Application submitted</li>
        <li><strong>Phone Screen</strong> — Initial phone/video call scheduled or completed</li>
        <li><strong>Interview</strong> — Formal interview stage</li>
        <li><strong>Offer</strong> — Received an offer</li>
        <li><strong>Accepted</strong> — Accepted the offer</li>
        <li><strong>Rejected</strong> — Application was rejected</li>
      </ul>

      <H3>Features</H3>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Drag & drop</strong> cards between columns to update status</li>
        <li><strong>Collapse columns</strong> with the « button to save space — slides smoothly</li>
        <li><strong>Priority</strong> — Mark cards as priority (green highlight)</li>
        <li><strong>Archive</strong> — Move old applications to the Archive</li>
        <li><strong>Retract</strong> — Remove an application and reset the linked Job Target</li>
      </ul>

      <Tip>Applications linked to Job Targets (via "Add to Job Board") show a link icon. Click through to access the tailored resume and cover letter.</Tip>
    </div>
  );
}

function AISection() {
  return (
    <div>
      <H2>AI Features</H2>
      <P>Jobotta uses AI to help you tailor your application materials. All AI features require at least one API key configured in Settings.</P>

      <H3>Supported Providers</H3>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Google Gemini</strong> — Free tier available at ai.google.dev. Models: Gemini 2.5 Flash (fast), 2.5 Pro (most capable)</li>
        <li><strong>OpenAI</strong> — GPT-4o, GPT-4o Mini, o3-mini. Get keys at platform.openai.com</li>
        <li><strong>Anthropic</strong> — Claude Sonnet 4, Haiku 4, Opus 4. Get keys at console.anthropic.com</li>
      </ul>

      <H3>AI Capabilities</H3>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Resume Tailoring</strong> — Analyzes a job description and optimizes your resume blocks for ATS and relevance</li>
        <li><strong>Cover Letter Generation</strong> — Creates personalized cover letters in Short, Medium, or Full styles</li>
        <li><strong>Application Q&A</strong> — Answers supplementary application questions using your resume and job context</li>
        <li><strong>Interview Prep</strong> — Generates behavioral, technical, and situational questions with tips</li>
        <li><strong>Salary Research</strong> — Estimates market rates for a role, location, and experience level</li>
        <li><strong>URL Scraping</strong> — Extracts job details from pasted URLs using AI</li>
      </ul>

      <Tip>You can switch between providers anytime in Settings. Each provider's key is saved independently — configure multiple and switch as needed.</Tip>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <H2>Settings & API Keys</H2>
      <P>Settings is divided into two tabs:</P>

      <H3>Personal Information</H3>
      <P>Your default profile that pre-fills the Personal Info block on every new resume. Includes contact details, online presence, cover letter signature, and application defaults (salary, work authorization).</P>

      <H3>Application Settings</H3>
      <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
        <li><strong>Appearance</strong> — Light/Dark theme toggle</li>
        <li><strong>Job Search API</strong> — RapidAPI key for JSearch integration</li>
        <li><strong>Account & Sync</strong> — Server URL and sync frequency (for future web app sync)</li>
        <li><strong>AI Configuration</strong> — Provider selection, API keys, model choice, cover letter style, ATS strategy</li>
        <li><strong>Browser Automation</strong> — Default browser, auto-fill mode, confirm before submit</li>
        <li><strong>Keyboard Shortcuts</strong> — Global hotkey reference</li>
      </ul>

      <H3>Where to Get API Keys</H3>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>Service</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>URL</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)' }}>Cost</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-secondary)' }}>
            <tr><td style={{ padding: '6px 8px' }}>Google Gemini</td><td style={{ padding: '6px 8px' }}>ai.google.dev</td><td style={{ padding: '6px 8px' }}>Free tier available</td></tr>
            <tr><td style={{ padding: '6px 8px' }}>OpenAI</td><td style={{ padding: '6px 8px' }}>platform.openai.com/api-keys</td><td style={{ padding: '6px 8px' }}>Pay-per-use</td></tr>
            <tr><td style={{ padding: '6px 8px' }}>Anthropic</td><td style={{ padding: '6px 8px' }}>console.anthropic.com/settings/keys</td><td style={{ padding: '6px 8px' }}>Pay-per-use</td></tr>
            <tr><td style={{ padding: '6px 8px' }}>JSearch (RapidAPI)</td><td style={{ padding: '6px 8px' }}>rapidapi.com/.../jsearch</td><td style={{ padding: '6px 8px' }}>200 free searches/month</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShortcutsSection() {
  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <div>
      <H2>Keyboard Shortcuts</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {[
          { keys: `${mod}+Shift+J`, desc: 'Trigger browser auto-fill (global hotkey)' },
          { keys: `${mod}+,`, desc: 'Open Settings' },
          { keys: `${mod}+N`, desc: 'Go to Resumes' },
          { keys: `${mod}+Shift+N`, desc: 'Go to Job Targets' },
          { keys: `${mod}+Q`, desc: 'Quit Jobotta' },
          { keys: `${mod}+H`, desc: 'Hide Jobotta' },
          { keys: `${mod}++`, desc: 'Zoom in' },
          { keys: `${mod}+-`, desc: 'Zoom out' },
          { keys: `${mod}+0`, desc: 'Reset zoom' },
        ].map(s => (
          <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
            <KBD>{s.keys}</KBD>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    { q: 'Do I need API keys to use Jobotta?', a: 'Not for basic features. You can build resumes, track applications on the Job Board, and manage job targets without any API keys. AI features (resume tailoring, cover letter generation, Q&A) require an AI provider key. In-app job search requires a RapidAPI key.' },
    { q: 'Which AI provider should I choose?', a: 'Google Gemini offers a free tier and is a great starting point. OpenAI (GPT-4o) and Anthropic (Claude) are also excellent but require paid accounts. You can configure all three and switch between them anytime.' },
    { q: 'Is my data stored locally or in the cloud?', a: 'All data is stored locally on your computer in a SQLite database. Nothing is sent to external servers except API calls to your configured AI provider and JSearch when you use those features.' },
    { q: 'Can I use Jobotta on Windows or Linux?', a: 'Jobotta is available for macOS and Windows. Download the .dmg or .zip for macOS, or the .exe installer for Windows. Linux (AppImage) support is planned for a future release.' },
    { q: 'How do I export my resume as a PDF?', a: 'Open a resume, click Preview, then click "Download PDF" in the top-right. This opens the system print dialog where you can select "Save as PDF".' },
    { q: 'What happens when I "Add to Job Board"?', a: 'A linked application card is created on the Job Board in the "Saved" column. The Job Target status changes to "Submitted". From the board, you can track progress, and the card links back to your tailored resume and cover letter.' },
    { q: 'Can I undo an archive or retraction?', a: 'Archived applications can be returned to the Job Board from the Archive page. Retracted applications are deleted and the linked Job Target resets to "Draft" status.' },
    { q: 'How many job searches do I get?', a: 'The free JSearch plan includes 200 searches per month. Your remaining count is displayed next to "Search Jobs". The counter resets on the 1st of each month.' },
  ];

  return (
    <div>
      <H2>Frequently Asked Questions</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {faqs.map((faq, i) => (
          <div key={i}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{faq.q}</div>
            <P>{faq.a}</P>
          </div>
        ))}
      </div>
    </div>
  );
}
