import { getSettings, updateSettings } from '../database/repositories/settings.repo';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

let jwtToken: string | null = null;
let refreshToken: string | null = null;

export class JobottaAPIClient {
  private getBaseUrl(): string {
    const settings = getSettings();
    return settings.syncApiUrl || '';
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) throw new Error('Sync API URL not configured');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && refreshToken) {
      // Try to refresh token
      const refreshed = await this.refreshAuth();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
        const retry = await fetch(`${baseUrl}${path}`, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!retry.ok) throw new Error(`API error: ${retry.status} ${retry.statusText}`);
        return retry.json();
      }
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ─── Auth ────────────────────────────────────────────────

  async login(email: string, password: string): Promise<{ token: string }> {
    const result = await this.request<{ token: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    jwtToken = result.token;
    refreshToken = result.refreshToken;
    return result;
  }

  async refreshAuth(): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        jwtToken = data.token;
        if (data.refreshToken) refreshToken = data.refreshToken;
        return true;
      }
    } catch {}
    jwtToken = null;
    refreshToken = null;
    return false;
  }

  // ─── Resumes ─────────────────────────────────────────────

  async getResumes(): Promise<any[]> {
    return this.request('/api/resumes');
  }

  async createResume(data: any): Promise<any> {
    return this.request('/api/resumes', { method: 'POST', body: data });
  }

  async updateResume(id: string, data: any): Promise<any> {
    return this.request(`/api/resumes/${id}`, { method: 'PUT', body: data });
  }

  async deleteResume(id: string): Promise<void> {
    await this.request(`/api/resumes/${id}`, { method: 'DELETE' });
  }

  // ─── Job Targets ────────────────────────────────────────

  async getJobTargets(): Promise<any[]> {
    return this.request('/api/job-targets');
  }

  async createJobTarget(data: any): Promise<any> {
    return this.request('/api/job-targets', { method: 'POST', body: data });
  }

  async updateJobTarget(id: string, data: any): Promise<any> {
    return this.request(`/api/job-targets/${id}`, { method: 'PUT', body: data });
  }

  async deleteJobTarget(id: string): Promise<void> {
    await this.request(`/api/job-targets/${id}`, { method: 'DELETE' });
  }

  // ─── Applications ───────────────────────────────────────

  async getApplications(): Promise<any[]> {
    return this.request('/api/applications');
  }

  async createApplication(data: any): Promise<any> {
    return this.request('/api/applications', { method: 'POST', body: data });
  }

  async updateApplication(id: string, data: any): Promise<any> {
    return this.request(`/api/applications/${id}`, { method: 'PUT', body: data });
  }

  async deleteApplication(id: string): Promise<void> {
    await this.request(`/api/applications/${id}`, { method: 'DELETE' });
  }

  // ─── Settings ───────────────────────────────────────────

  async getServerSettings(): Promise<any> {
    return this.request('/api/settings');
  }

  async updateServerSettings(data: any): Promise<any> {
    return this.request('/api/settings', { method: 'PUT', body: data });
  }

  // ─── Sync ───────────────────────────────────────────────

  async getSyncStatus(): Promise<any> {
    return this.request('/api/sync/status');
  }

  async getChangesSince(since: string): Promise<any> {
    return this.request(`/api/sync/changes?since=${encodeURIComponent(since)}`);
  }

  async batchPush(changes: any[]): Promise<any> {
    return this.request('/api/sync/batch-push', { method: 'POST', body: { changes } });
  }
}
