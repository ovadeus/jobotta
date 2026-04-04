import { net, BrowserWindow } from 'electron';
import { callAI } from './ai.service';

export interface ScrapedJob {
  jobTitle: string;
  company: string;
  jobDescriptionText: string;
  notes: string;
  deadline?: string;
}

// ─── HTTP Fetch ────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => resolve(body));
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    request.end();
  });
}

// ─── Decode HTML entities ──────────────────────────────────────

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

// ─── Extract ALL useful content from page source ───────────────
// This reads the full HTML and pulls content from every useful
// source: JSON-LD, meta tags, title, and visible body text.

function extractAllContent(html: string): {
  jsonLd: any | null;
  metaTitle: string;
  metaDescription: string;
  pageTitle: string;
  bodyText: string;
} {
  // 1. JSON-LD structured data (schema.org)
  let jsonLd: any = null;
  const jsonLdBlocks = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    try {
      const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      const data = JSON.parse(jsonStr);
      if (data['@type'] === 'JobPosting') {
        jsonLd = data;
        break;
      }
      // Some sites wrap in @graph
      if (data['@graph']) {
        const posting = data['@graph'].find((item: any) => item['@type'] === 'JobPosting');
        if (posting) { jsonLd = posting; break; }
      }
    } catch {}
  }

  // 2. Meta tags (og:title, og:description, standard meta description)
  const metaTitle =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1]
    || html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || '';

  const metaDescription =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1]
    || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || '';

  // 3. Page title
  const pageTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';

  // 4. Body text — strip scripts/styles, then tags
  let bodyText = html;
  bodyText = bodyText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  bodyText = bodyText.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  bodyText = bodyText.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  bodyText = bodyText.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ');
  bodyText = bodyText.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ');
  bodyText = bodyText.replace(/<[^>]+>/g, ' ');
  bodyText = decodeEntities(bodyText);
  bodyText = bodyText.replace(/\s+/g, ' ').trim();

  return {
    jsonLd,
    metaTitle: decodeEntities(metaTitle),
    metaDescription: decodeEntities(metaDescription),
    pageTitle: decodeEntities(pageTitle),
    bodyText,
  };
}

// ─── Convert JSON-LD directly to ScrapedJob ────────────────────

function jsonLdToJob(data: any): ScrapedJob {
  const notes: string[] = [];
  const loc = data.jobLocation;
  if (loc) {
    const addr = loc.address || loc;
    const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
    if (parts.length) notes.push(`Location: ${parts.join(', ')}`);
  }
  if (data.employmentType) notes.push(`Type: ${data.employmentType}`);
  if (data.datePosted) notes.push(`Posted: ${data.datePosted}`);
  if (data.validThrough) notes.push(`Deadline: ${data.validThrough}`);
  if (data.identifier?.value) notes.push(`Job ID: ${data.identifier.value}`);
  if (data.baseSalary) {
    const s = data.baseSalary;
    if (s.value) {
      const min = s.value.minValue;
      const max = s.value.maxValue;
      if (min && max) notes.push(`Salary: $${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`);
      else if (s.value.value) notes.push(`Salary: ${s.value.value}`);
    }
  }

  return {
    jobTitle: decodeEntities(data.title || data.name || ''),
    company: decodeEntities(data.hiringOrganization?.name || ''),
    jobDescriptionText: decodeEntities(data.description || ''),
    notes: notes.join('\n'),
    deadline: data.validThrough || undefined,
  };
}

// ─── Headless browser fallback ─────────────────────────────────

async function fetchWithBrowser(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const win = new BrowserWindow({
      width: 1280, height: 900, show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        win.webContents.executeJavaScript('document.body.innerText')
          .then(text => { win.close(); resolve(text || ''); })
          .catch(() => { win.close(); reject(new Error('Page load timed out')); });
      }
    }, 20000);

    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try {
          // Get both the rendered text AND the page source for maximum coverage
          const text = await win.webContents.executeJavaScript('document.body.innerText');
          win.close();
          resolve(text || '');
        } catch (err) { win.close(); reject(err); }
      }, 5000);
    });

    win.webContents.on('did-fail-load', (_e, code, desc) => {
      if (!settled) { settled = true; clearTimeout(timeout); win.close(); reject(new Error(`Page load failed: ${desc}`)); }
    });

    win.loadURL(url).catch(err => {
      if (!settled) { settled = true; clearTimeout(timeout); win.close(); reject(err); }
    });
  });
}

// ─── AI extraction prompt ──────────────────────────────────────

function buildExtractionPrompt(pageText: string): string {
  const truncated = pageText.slice(0, 15000);
  return `You are reading the text content of a job posting web page. Extract the job information and return ONLY a valid JSON object:

{
  "jobTitle": "the exact job title",
  "company": "the company or organization name",
  "jobDescriptionText": "the FULL job description — include the role overview, responsibilities, qualifications, requirements, and any other job details. Preserve structure with \\n line breaks between sections.",
  "notes": "other useful info: salary/pay range, benefits, location, job type (full-time/part-time/contract), application instructions, contact info, job ID, posted date. Use \\n between items.",
  "deadline": "application deadline in YYYY-MM-DD format, or null if not found"
}

Rules:
- Extract as much detail as possible — do not summarize or shorten the description
- Return ONLY valid JSON, no markdown, no code fences, no explanation
- If a field is not found, use an empty string

PAGE CONTENT:
${truncated}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCRAPE FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function scrapeJobUrl(url: string): Promise<ScrapedJob> {
  // Step 1: Fetch the page source
  let html = '';
  try {
    html = await fetchPage(url);
  } catch (err: any) {
    throw new Error(`Could not reach URL: ${err.message}`);
  }

  if (!html || html.length < 50) {
    throw new Error('Empty response from URL. Check that the link is correct.');
  }

  // Step 2: Extract everything we can from the page source
  const extracted = extractAllContent(html);

  // Step 3: If we got clean JSON-LD structured data, use it directly (no AI needed)
  if (extracted.jsonLd && extracted.jsonLd.title && extracted.jsonLd.description?.length > 50) {
    console.log('[Scraper] Using JSON-LD structured data — no AI call needed');
    return jsonLdToJob(extracted.jsonLd);
  }

  // Step 4: Combine all available text sources for AI extraction
  // Priority: meta description (often has full JD) > body text > page title
  const textParts: string[] = [];

  if (extracted.pageTitle) {
    textParts.push(`PAGE TITLE: ${extracted.pageTitle}`);
  }
  if (extracted.metaTitle && extracted.metaTitle !== extracted.pageTitle) {
    textParts.push(`JOB TITLE: ${extracted.metaTitle}`);
  }
  if (extracted.metaDescription) {
    textParts.push(`META DESCRIPTION:\n${extracted.metaDescription}`);
  }
  if (extracted.bodyText && extracted.bodyText.length > 50) {
    textParts.push(`PAGE BODY:\n${extracted.bodyText}`);
  }

  let pageText = textParts.join('\n\n');

  // Step 5: If page source had almost nothing, try headless browser as last resort
  if (pageText.length < 100) {
    try {
      console.log('[Scraper] Page source too thin, trying headless browser');
      const browserText = await fetchWithBrowser(url);
      if (browserText && browserText.length > 50) {
        pageText = browserText;
      }
    } catch (err: any) {
      throw new Error(`Could not load page: ${err.message}`);
    }
  }

  if (pageText.length < 50) {
    throw new Error('Could not extract content from that URL. The page may require login or block automated access.');
  }

  // Step 6: Send to AI for intelligent extraction
  const prompt = buildExtractionPrompt(pageText);
  const aiResponse = await callAI(prompt);

  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI could not extract job information. Try pasting the job description manually.');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    jobTitle: parsed.jobTitle || extracted.metaTitle || '',
    company: parsed.company || '',
    jobDescriptionText: parsed.jobDescriptionText || '',
    notes: parsed.notes || '',
    deadline: parsed.deadline || undefined,
  };
}
