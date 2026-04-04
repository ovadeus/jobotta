import React, { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import type { MasterResume } from '../../../shared/types';

interface JobSearchResult {
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

interface Props {
  resumes: MasterResume[];
  onCreateTarget: (data: any) => void;
  onClose: () => void;
}

export default function JobSearch({ resumes, onCreateTarget, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<JobSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);

  // Load usage on mount and after each search
  const loadUsage = async () => {
    try {
      const u = await window.jobotta.getSearchUsage();
      setUsage(u);
    } catch {}
  };
  React.useEffect(() => { loadUsage(); }, []);
  const [datePosted, setDatePosted] = useState<string>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [employmentType, setEmploymentType] = useState<string>('');

  // Create target state
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');

  const handleSearch = async (newPage = 1) => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    if (newPage === 1) setResults([]);

    try {
      const data = await window.jobotta.searchJobs({
        query: query.trim(),
        location: location.trim() || undefined,
        page: newPage,
        datePosted: datePosted !== 'all' ? datePosted : undefined,
        remoteOnly: remoteOnly || undefined,
        employmentType: employmentType || undefined,
      });
      if (newPage === 1) {
        setResults(data.results);
      } else {
        setResults(prev => [...prev, ...data.results]);
      }
      setPage(newPage);
      setHasMore(data.hasMore);
      setTotalResults(data.totalResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
      loadUsage();
    }
  };

  const handleCreateFromResult = async (job: JobSearchResult) => {
    const notes = [
      job.location && `Location: ${job.location}`,
      job.employmentType && `Type: ${job.employmentType}`,
      job.isRemote && 'Remote: Yes',
      job.salaryMin && job.salaryMax && `Salary: $${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}${job.salaryPeriod ? ` (${job.salaryPeriod})` : ''}`,
      job.salaryMin && !job.salaryMax && `Salary: $${job.salaryMin.toLocaleString()}+`,
      job.source && `Source: ${job.source}`,
      job.datePosted && `Posted: ${new Date(job.datePosted).toLocaleDateString()}`,
    ].filter(Boolean).join('\n');

    onCreateTarget({
      jobTitle: job.jobTitle,
      company: job.company,
      masterResumeId: selectedResumeId || undefined,
      jobDescriptionUrl: job.applyLink,
      jobDescriptionText: job.description,
      notes,
      status: 'draft',
    });
  };

  const formatSalary = (job: JobSearchResult) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const min = job.salaryMin ? `$${Math.round(job.salaryMin).toLocaleString()}` : '';
    const max = job.salaryMax ? `$${Math.round(job.salaryMax).toLocaleString()}` : '';
    if (min && max) return `${min} - ${max}`;
    return min || max;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return d.toLocaleDateString();
  };

  return (
    <div>
      {/* Search header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-sm" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>←</span> Back
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 600, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          Search Jobs
          {usage && (
            <span style={{
              fontSize: 11, fontWeight: 400, padding: '2px 8px', borderRadius: 999,
              background: usage.remaining <= 20 ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
              color: usage.remaining <= 20 ? 'var(--accent-red)' : 'var(--accent-indigo)',
            }}>
              {usage.remaining}/{usage.limit} searches left
            </span>
          )}
        </h2>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by JSearch (Google for Jobs)</span>
      </div>

      {/* Search form */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 2 }}>
            <input
              className="form-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Job title, keywords, or company..."
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ fontSize: 14 }}
              autoFocus
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              className="form-input"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, state, or remote"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          {searching && (
            <span style={{
              display: 'inline-block', width: 16, height: 16,
              border: '2px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)',
              borderTopColor: 'var(--accent-indigo)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }} />
          )}
          <button className="btn btn-primary" onClick={() => handleSearch()} disabled={searching || !query.trim()}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Posted:</label>
            <select className="form-select" style={{ padding: '3px 6px', fontSize: 11, width: 'auto' }} value={datePosted} onChange={e => setDatePosted(e.target.value)}>
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="3days">Last 3 days</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type:</label>
            <select className="form-select" style={{ padding: '3px 6px', fontSize: 11, width: 'auto' }} value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
              <option value="">All types</option>
              <option value="FULLTIME">Full-time</option>
              <option value="PARTTIME">Part-time</option>
              <option value="CONTRACTOR">Contract</option>
              <option value="INTERN">Internship</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
            Remote only
          </label>
          {/* Resume selector for creating targets */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resume:</label>
            <select className="form-select" style={{ padding: '3px 6px', fontSize: 11, width: 'auto' }} value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
              <option value="">None</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {/* Results count */}
      {results.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Showing {results.length} of {totalResults} results
        </div>
      )}

      {/* Results list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map(job => {
          const isExpanded = expandedId === job.jobId;
          const salary = formatSalary(job);
          return (
            <div key={job.jobId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Compact row */}
              <div
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                onClick={() => setExpandedId(isExpanded ? null : job.jobId)}
              >
                {/* Company logo */}
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{job.jobTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>{job.company}</span>
                    {job.location && <span style={{ color: 'var(--text-muted)' }}>· {job.location}</span>}
                    {job.isRemote && <span className="badge badge-green" style={{ fontSize: 10 }}>Remote</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {salary && <span className="badge badge-green" style={{ fontSize: 10 }}>{salary}</span>}
                    {job.employmentType && <span className="badge badge-blue" style={{ fontSize: 10 }}>{job.employmentType.replace('FULLTIME', 'Full-time').replace('PARTTIME', 'Part-time').replace('CONTRACTOR', 'Contract')}</span>}
                    {job.source && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>via {job.source}</span>}
                    {job.datePosted && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(job.datePosted)}</span>}
                  </div>
                </div>

                {/* Quick add button */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, alignSelf: 'center' }}
                  onClick={e => { e.stopPropagation(); handleCreateFromResult(job); }}
                >
                  + Target
                </button>
              </div>

              {/* Expanded description */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: 300, overflow: 'auto', marginTop: 12 }}>
                    {job.description}
                  </pre>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleCreateFromResult(job)}>
                      + Add as Job Target
                    </button>
                    {job.applyLink && (
                      <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ textDecoration: 'none' }}>
                        View Original →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && results.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn" onClick={() => handleSearch(page + 1)} disabled={searching}>
            {searching ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!searching && results.length === 0 && query && !error && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <MagnifyingGlass size={40} />
          <p>No results found</p>
          <p style={{ fontSize: 11 }}>Try different keywords or broaden your search</p>
        </div>
      )}

      {/* Initial state */}
      {!searching && results.length === 0 && !query && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <MagnifyingGlass size={40} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Search for Jobs</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '8px auto', lineHeight: 1.6, fontSize: 13 }}>
            Search across LinkedIn, Indeed, Glassdoor, ZipRecruiter, and thousands of company career pages. Click "+ Target" to add any result as a job target.
          </p>
        </div>
      )}
    </div>
  );
}
