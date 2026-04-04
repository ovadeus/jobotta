# Jobotta Website — Replit Build Prompt

## Project Overview

Build a modern, responsive promotional website for **Jobotta** — an intelligent desktop application that helps job seekers manage resumes, tailor applications with AI, and track their job search. The website serves as the public face of the product: it promotes the app, provides downloads, offers help/support documentation, and tells the founder's story.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, deployed on Replit. No database needed — this is a static/SSG marketing site.

**Design Direction:** Clean, minimal, modern tech aesthetic. White background, generous whitespace, black primary buttons, orange (#e8720c) as the accent color, dark charcoal (#1d1d1f) for headings. The look should feel like a blend of Linear.app, Notion's marketing site, and Vercel's homepage — confident, premium, and approachable. Use the Phosphor icon set (@phosphor-icons/react) for all icons. No stock photos — use UI screenshots, product mockups, and abstract geometric elements.

**Fonts:** Inter for headings (tight letter-spacing, heavy weight), system sans-serif stack for body text.

---

## Brand Identity

- **Product Name:** Jobotta
- **Tagline:** "Your Intelligent Job Application Assistant"
- **Secondary tagline:** "Build. Tailor. Apply. Track."
- **Brand color palette:**
  - Primary: #1d1d1f (near-black)
  - Accent: #e8720c (warm orange)
  - Accent light: rgba(232, 114, 12, 0.08)
  - Background: #ffffff
  - Text secondary: #6e6e73
  - Text muted: #999
  - Surface: #f5f5f7
- **Brand mark:** The word "Jobotta" followed by a small orange dot (●), rendered in CSS — e.g., `Jobotta<span class="text-orange-500 text-xs align-super">●</span>`
- **Tone of voice:** Professional but warm. Empowering, not salesy. Speaks to job seekers who are frustrated with the tedious application process. Academic-friendly (the founder is a professor).

---

## Site Architecture

### Page 1: Homepage (/)

The homepage is a conversion-focused landing page with these sections in order:

#### 1.1 Hero Section
- Large headline: **"Stop applying blind. Start applying smart."**
- Subheadline: "Jobotta is a free desktop app that helps you build tailored resumes, generate AI cover letters, search jobs from LinkedIn & Indeed, and track every application — all in one place."
- Two CTAs:
  - Primary (black button): "Download for Mac" — links to `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-1.0.0-mac.zip`
  - Secondary (black outline button): "Download for Windows" — links to `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-Setup-1.0.0.exe`
  - Below the buttons: Tertiary text link: "See How It Works ↓" (scrolls to features)
- Below CTAs: Small text: "Free and open source. Available for macOS and Windows. Linux coming soon."
- **IMPORTANT:** Use JavaScript to detect the user's OS via `navigator.platform` or `navigator.userAgent` and make the matching platform button PRIMARY (larger, filled black) and the other platform SECONDARY (smaller, outline). If on Linux or mobile, show both equally with a note.
- Hero visual: A stylized screenshot or mockup of the Jobotta app showing the resume editor or job board. Use a browser-frame or macOS window chrome mockup around a screenshot.

#### 1.2 Problem Statement Strip
A short, emotionally resonant section:
- "The average job seeker applies to **100+ jobs**. Each one needs a tailored resume, a custom cover letter, and careful tracking. Most people use spreadsheets, sticky notes, and hope. There's a better way."

#### 1.3 Feature Grid (4-6 cards)
Clean cards with Phosphor icons, title, and 1-2 sentence description:

1. **Resume Builder** (FileText icon) — "Block-based resume editor with form and code views. Build once, tailor for every job. Preview and export as PDF or DOC."

2. **AI Resume Tailoring** (Sparkle icon) — "Paste a job description, and AI optimizes your resume for ATS keywords, relevance, and impact. Supports Gemini, OpenAI, and Claude."

3. **Cover Letter Generator** (Envelope icon) — "Generate personalized cover letters in Short, Medium, or Full styles. Uses your resume and the job description for specificity."

4. **Job Search Integration** (MagnifyingGlass icon) — "Search LinkedIn, Indeed, Glassdoor, and ZipRecruiter from inside the app. Import any result as a job target with one click."

5. **Kanban Job Board** (Kanban icon) — "Track every application from Saved → Applied → Interview → Offer. Drag-and-drop cards, collapsible columns, priority marking."

6. **URL Scraping** (Link icon) — "Paste any job posting URL. AI reads the page and auto-fills the job title, company, description, salary, and deadline."

#### 1.4 How It Works (3-step process)
Horizontal 3-column layout with numbered steps:

1. **Build Your Resume** — "Create a master resume with our block-based editor. Personal info, experience, skills, education — all in a clean, guided form."

2. **Find & Target Jobs** — "Search jobs in-app or paste a URL. AI tailors your resume and generates a cover letter for each target."

3. **Track & Apply** — "Add targets to your Job Board. Track progress from application to offer. Archive old ones to stay focused."

#### 1.5 AI Provider Support
A slim section showing the three AI providers:
- "Works with your preferred AI" — logos/names: Google Gemini (free tier available) | OpenAI (GPT-4o) | Anthropic (Claude)
- "Bring your own API key. Switch providers anytime."

#### 1.6 Screenshot Gallery / Product Tour
3-4 full-width screenshots of key screens:
- Resume editor with blocks expanded
- Job Target detail with tailored resume and cover letter
- Kanban Job Board with cards across stages
- Job Search results
Each with a short caption.

#### 1.7 Download CTA (repeated)
- "Ready to take control of your job search?"
- Large download button
- "Free. No account required. Your data stays on your computer."

#### 1.8 Footer
- Links: Home, Features, Download, Help & Support, About, GitHub
- "Made with care by Professor David Meyers"
- "© 2026 Jobotta. Open source under MIT License."
- Small Phosphor icons for GitHub link

---

### Page 2: Help & Support (/help)

A comprehensive documentation page mirroring the in-app help but in a web-friendly format. Use a left sidebar table-of-contents layout (sticky on scroll) with these sections:

#### Sections:
1. **Getting Started**
   - System requirements (macOS 14+, Windows/Linux coming soon)
   - Installation instructions
   - First-run setup wizard walkthrough
   - Where to get API keys (with direct links):
     - Google Gemini: ai.google.dev (free)
     - OpenAI: platform.openai.com/api-keys
     - Anthropic: console.anthropic.com/settings/keys
     - JSearch/RapidAPI: rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch (free, 200/month)

2. **Resumes**
   - Master vs. Tailored resumes
   - Block types (Personal Info, Summary, Work Experience, Education, Skills, Projects, Certifications, References, Awards, Volunteer, Custom)
   - Form view vs. Code view
   - Drag-and-drop reordering
   - Preview, Print, PDF export, DOC export
   - Personal info auto-fill from Settings

3. **Job Targets**
   - Three ways to add (Search, URL import, Manual)
   - AI resume tailoring
   - Cover letter generation (3 styles)
   - Priority marking
   - "Add to Job Board" flow
   - Saving tailored resumes

4. **Job Search**
   - JSearch API setup (step-by-step with screenshots if possible)
   - Search filters (date, type, remote)
   - Importing results
   - Search quota tracking

5. **Job Board**
   - Kanban stages explained
   - Drag-and-drop
   - Collapsible columns
   - Application details (timeline, contacts, notes)
   - Priority cards (green highlight)
   - Retract vs. Archive

6. **Archive**
   - What gets archived
   - Returning to Job Board
   - Permanent deletion

7. **AI Features**
   - Provider comparison table
   - Resume tailoring strategies (Keyword Match, Balanced, Narrative)
   - Cover letter styles and signature
   - Q&A, Interview Prep, Salary Research
   - Error handling (rate limits, invalid keys)

8. **Settings**
   - Personal Information tab
   - Cover Letter Signature
   - AI Configuration
   - Job Search API
   - Theme (Light/Dark)
   - Browser Automation (future)

9. **Keyboard Shortcuts**
   - Full table of shortcuts

10. **FAQ**
    - Do I need API keys? (Not for basic features, yes for AI)
    - Is my data stored in the cloud? (No, local SQLite)
    - Which AI provider should I choose? (Gemini for free, etc.)
    - Can I use it on Windows? (Coming soon)
    - How do I export a PDF? (Preview → Download PDF)
    - Is it free? (Yes, open source, MIT license)
    - How do I report a bug? (GitHub Issues)

---

### Page 3: About (/about)

A personal, story-driven page about the founder and the project's mission.

#### Content:

**Headline:** "Built by a professor, for the people who need it most."

**The Story:**
Professor David Meyers has spent over two decades in higher education — teaching design, mentoring students, and watching talented graduates struggle with one of the hardest challenges they face after school: finding a job.

"Every semester, I'd see brilliant students paralyzed by the job application process," says Meyers. "They'd apply to dozens of positions, lose track of which company they'd heard back from, send the same generic resume everywhere, and wonder why they weren't getting callbacks."

The problem wasn't talent. It was the process. Job applications in 2026 are a full-time job themselves — each one demanding a tailored resume, a customized cover letter, answers to supplementary questions, and meticulous tracking across multiple platforms.

Meyers, who holds an MFA from Syracuse University and currently serves as a Senior Professor at the Savannah College of Art and Design (SCAD), decided to build the tool he wished existed for his students.

"I wanted something that would take the tedious parts off their plate — the reformatting, the keyword optimization, the cover letter writing — so they could focus on what actually matters: telling their story and finding the right fit."

Jobotta was born from that frustration. Built using modern web technologies (Electron, React, TypeScript) with AI integration (Google Gemini, OpenAI, Anthropic), it's a desktop application that does what no job board can: it sits on your computer, knows your full resume, and helps you put your best foot forward for every single application.

The name "Jobotta" reflects the app's mission — it's about the job, but it's also about giving people an edge (the "otta" — as in, you "oughta" have this tool in your corner).

**What makes it different:**
- It's local-first. Your data never leaves your computer.
- It's AI-powered but provider-agnostic. Use Gemini for free, or bring your own OpenAI/Anthropic key.
- It's built by an educator, not a startup. No tracking, no upsells, no premium tier. Just a tool that works.
- It's open source. MIT licensed. Anyone can inspect, modify, or contribute.

**Photo:** Include a space for a professional headshot of Professor Meyers (placeholder for now).

**Links:** Link to SCAD, Syracuse University, GitHub repo.

---

### Page 4: Download (/download)

A simple, focused download page with platform detection and clear installation instructions.

- **Headline:** "Download Jobotta"
- **Subheadline:** "Free. Local. Intelligent. No account required."
- **Current release:** v1.0.0

#### Platform Cards (side-by-side on desktop, stacked on mobile)

Use `navigator.platform` or `navigator.userAgent` to detect the user's OS and highlight their platform card with a "Recommended for your system" badge.

**macOS Card:**
- Icon: Apple logo or Monitor icon
- Title: "macOS"
- Subtitle: "macOS 14 (Sonoma) or later"
- Compatibility: "Apple Silicon (M1/M2/M3/M4) and Intel supported"
- Two download buttons:
  - Primary: "Download .zip" → `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-1.0.0-mac.zip`
  - Secondary: "Download .dmg" → `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-1.0.0.dmg`
- Installation steps (collapsible or below the card):
  1. Download the .zip or .dmg file
  2. For .zip: Unzip and drag **Jobotta.app** to your **Applications** folder
  3. For .dmg: Open the disk image and drag Jobotta to Applications
  4. On first launch, macOS may block the app. Right-click → **Open** to bypass, or go to **System Preferences → Privacy & Security → Open Anyway**
  5. The app will launch with a setup wizard to configure your API keys

**Windows Card:**
- Icon: Windows logo or Monitor icon
- Title: "Windows"
- Subtitle: "Windows 10 or later (64-bit)"
- One download button:
  - Primary: "Download Installer (.exe)" → `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-Setup-1.0.0.exe`
  - Secondary: "Download .zip (portable)" → `https://github.com/ovadeus/jobotta/releases/latest/download/Jobotta-1.0.0-win.zip`
- Installation steps:
  1. Download the .exe installer
  2. Run **Jobotta-Setup-1.0.0.exe** — you may see a SmartScreen warning since the app isn't code-signed yet. Click **"More info" → "Run anyway"**
  3. Choose your installation directory (defaults to Program Files)
  4. A desktop shortcut and Start Menu entry will be created
  5. Launch Jobotta and complete the setup wizard

**Linux Card:**
- Icon: Linux/Tux icon
- Title: "Linux"
- Subtitle: "Coming soon"
- Text: "Linux (AppImage and .deb) builds are planned for a future release. Star the GitHub repo to get notified."
- Link: "Watch on GitHub →" → `https://github.com/ovadeus/jobotta`

#### Below the cards:

- **All releases:** "View all versions on GitHub →" → `https://github.com/ovadeus/jobotta/releases`
- **Source code:** "Jobotta is open source (MIT License). View the source code →" → `https://github.com/ovadeus/jobotta`
- **System requirements summary table:**

| | macOS | Windows |
|---|---|---|
| OS | macOS 14 (Sonoma)+ | Windows 10/11 (64-bit) |
| RAM | 4 GB minimum | 4 GB minimum |
| Disk | ~200 MB | ~200 MB |
| Required | Internet for AI features | Internet for AI features |

- **Troubleshooting section** (collapsible):
  - "macOS says the app is damaged or can't be opened" → Right-click → Open, or `xattr -cr /Applications/Jobotta.app` in Terminal
  - "Windows SmartScreen blocks the installer" → Click "More info" → "Run anyway". This happens because the app isn't code-signed yet.
  - "The app launches but features don't work" → Make sure you've configured at least one AI API key in Settings → Application Settings → AI Configuration

---

## Technical Requirements

1. **Framework:** Next.js 14 with App Router, TypeScript
2. **Styling:** Tailwind CSS with custom color config matching the brand palette
3. **Icons:** @phosphor-icons/react (same set used in the desktop app)
4. **Responsive:** Fully responsive — mobile, tablet, desktop
5. **SEO:** Proper meta tags, Open Graph, Twitter cards, structured data
6. **Performance:** Static generation (SSG) where possible, optimized images
7. **Analytics:** Add a slot for Google Analytics or Plausible (comment placeholder)
8. **Accessibility:** Semantic HTML, proper heading hierarchy, alt text, keyboard navigation
9. **Dark mode:** Support system preference with a toggle (matching the app's dark theme)
10. **Smooth scrolling:** Smooth anchor scrolling for in-page navigation
11. **Animations:** Subtle fade-in on scroll for sections, no heavy animation libraries

## File Structure
```
app/
  layout.tsx          # Root layout with nav, footer
  page.tsx            # Homepage
  about/page.tsx      # About page
  download/page.tsx   # Download page
  help/page.tsx       # Help & Support
  help/[section]/     # Optional: deep-linked help sections
components/
  Nav.tsx             # Top navigation bar (sticky, glass effect)
  Footer.tsx          # Site footer
  Hero.tsx            # Homepage hero
  FeatureCard.tsx     # Feature grid card
  DownloadButton.tsx  # Platform-aware download CTA
  HelpSidebar.tsx     # Help page TOC
  Screenshot.tsx      # Product screenshot with window chrome
```

## Navigation Bar
Sticky top nav with glass/blur effect:
- Left: "Jobotta●" logo/wordmark
- Center: Home, Features, Help, About
- Right: "Download" (black button) + GitHub icon link
- Mobile: Hamburger menu

## Critical Design Notes
- The orange accent (#e8720c) should be used sparingly — for dots, underlines, hover states, and the brand mark. NOT for large surfaces.
- Primary buttons are BLACK (#1d1d1f), not blue or orange.
- Use ample whitespace. Sections should breathe.
- Headlines should be large (48-64px on desktop) with -0.02em letter-spacing.
- The overall feel should be: "This is a serious tool built by someone who cares, not a VC-backed startup trying to monetize your job search."
