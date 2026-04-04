import { net } from 'electron';
import { getSettings, updateSettings } from '../database/repositories/settings.repo';
import { getDb } from '../database/db';

export interface JobSearchResult {
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location: string;
  description: string;
  applyLink: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  employmentType?: string;
  datePosted?: string;
  source?: string;
  isRemote?: boolean;
}

export interface JobSearchParams {
  query: string;
  location?: string;
  page?: number;
  datePosted?: 'all' | 'today' | '3days' | 'week' | 'month';
  remoteOnly?: boolean;
  employmentType?: string; // FULLTIME, PARTTIME, CONTRACTOR, INTERN
}

export interface JobSearchResponse {
  results: JobSearchResult[];
  totalResults: number;
  page: number;
  hasMore: boolean;
}

// ─── Usage Tracking ────────────────────────────────────────────

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsage(): { used: number; limit: number; month: string } {
  const db = getDb();
  const monthKey = getMonthKey();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(`_jsearch_usage_${monthKey}`) as any;
  const used = row ? parseInt(row.value, 10) : 0;
  return { used, limit: 200, month: monthKey };
}

function incrementUsage(): void {
  const db = getDb();
  const monthKey = getMonthKey();
  const key = `_jsearch_usage_${monthKey}`;
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any;
  const current = row ? parseInt(row.value, 10) : 0;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(current + 1));
}

export function getSearchUsage(): { used: number; limit: number; remaining: number; month: string } {
  const usage = getUsage();
  return { ...usage, remaining: Math.max(0, usage.limit - usage.used) };
}

// ─── JSearch API (via RapidAPI) ────────────────────────────────

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
  const settings = getSettings();
  const apiKey = settings.rapidApiKey;
  if (!apiKey) {
    throw new Error('RapidAPI key not configured. Add it in Settings → Application Settings → Job Search API.');
  }

  // Build query string — JSearch expects "job title in location" format
  let searchQuery = params.query;
  if (params.location) {
    searchQuery += ` in ${params.location}`;
  }

  const queryParams = new URLSearchParams({
    query: searchQuery,
    page: String(params.page || 1),
    num_pages: '1',
  });

  if (params.datePosted && params.datePosted !== 'all') {
    queryParams.set('date_posted', params.datePosted);
  }
  if (params.remoteOnly) {
    queryParams.set('remote_jobs_only', 'true');
  }
  if (params.employmentType) {
    queryParams.set('employment_types', params.employmentType);
  }

  const url = `https://jsearch.p.rapidapi.com/search?${queryParams.toString()}`;

  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';

    request.on('response', (response) => {
      if (response.statusCode === 429) {
        reject(new Error('JSearch API rate limit reached. Free tier allows 200 requests/month. Upgrade at rapidapi.com.'));
        return;
      }
      if (response.statusCode === 403) {
        reject(new Error('Invalid RapidAPI key. Check your key in Settings.'));
        return;
      }
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.status === 'ERROR') {
            reject(new Error(data.message || 'JSearch API error'));
            return;
          }
          const jobs: JobSearchResult[] = (data.data || []).map((job: any) => ({
            jobId: job.job_id || '',
            jobTitle: job.job_title || '',
            company: job.employer_name || '',
            companyLogo: job.employer_logo || undefined,
            location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
            description: job.job_description || '',
            applyLink: job.job_apply_link || '',
            salaryMin: job.job_min_salary || undefined,
            salaryMax: job.job_max_salary || undefined,
            salaryPeriod: job.job_salary_period || undefined,
            employmentType: job.job_employment_type || undefined,
            datePosted: job.job_posted_at_datetime_utc || undefined,
            source: job.job_publisher || undefined,
            isRemote: job.job_is_remote || false,
          }));

          incrementUsage();
          resolve({
            results: jobs,
            totalResults: data.total_count || jobs.length,
            page: params.page || 1,
            hasMore: jobs.length >= 10,
          });
        } catch (err) {
          reject(new Error('Failed to parse JSearch response'));
        }
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setHeader('x-rapidapi-key', apiKey);
    request.setHeader('x-rapidapi-host', 'jsearch.p.rapidapi.com');
    request.end();
  });
}
