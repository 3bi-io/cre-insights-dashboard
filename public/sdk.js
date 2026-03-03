/**
 * ApplyAI External Dashboard SDK
 * Drop this into any website to display organization recruitment data.
 * 
 * Usage:
 *   <script src="https://applyai.jobs/sdk.js" data-api-key="YOUR_KEY"></script>
 *   <div id="applyai-dashboard"></div>
 * 
 * Options (data attributes on the script tag):
 *   data-api-key     — Required. Your organization API key.
 *   data-container   — Optional. CSS selector for the container (default: #applyai-dashboard)
 *   data-theme       — Optional. "light" or "dark" (default: light)
 *   data-accent      — Optional. Hex color for accent (default: #6366f1)
 *   data-sections    — Optional. Comma-separated: stats,clients,jobs,applications (default: all)
 */
(function () {
  'use strict';

  const SCRIPT = document.currentScript;
  const API_KEY = SCRIPT?.getAttribute('data-api-key');
  const CONTAINER_SEL = SCRIPT?.getAttribute('data-container') || '#applyai-dashboard';
  const THEME = SCRIPT?.getAttribute('data-theme') || 'light';
  const ACCENT = SCRIPT?.getAttribute('data-accent') || '#6366f1';
  const SECTIONS = (SCRIPT?.getAttribute('data-sections') || 'stats,clients,jobs,applications').split(',').map(s => s.trim());
  const API_BASE = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/organization-api';

  if (!API_KEY) {
    console.error('[ApplyAI SDK] Missing data-api-key attribute on script tag.');
    return;
  }

  // ── Styles ──
  const STYLES = `
    .aai-dashboard { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${THEME === 'dark' ? '#e2e8f0' : '#1e293b'}; }
    .aai-dashboard * { box-sizing: border-box; margin: 0; padding: 0; }
    .aai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .aai-card { background: ${THEME === 'dark' ? '#1e293b' : '#ffffff'}; border: 1px solid ${THEME === 'dark' ? '#334155' : '#e2e8f0'}; border-radius: 12px; padding: 20px; }
    .aai-card-title { font-size: 13px; font-weight: 500; color: ${THEME === 'dark' ? '#94a3b8' : '#64748b'}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .aai-card-value { font-size: 28px; font-weight: 700; color: ${ACCENT}; }
    .aai-section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${ACCENT}; display: inline-block; }
    .aai-section { margin-bottom: 32px; }
    .aai-table { width: 100%; border-collapse: collapse; background: ${THEME === 'dark' ? '#1e293b' : '#ffffff'}; border-radius: 12px; overflow: hidden; border: 1px solid ${THEME === 'dark' ? '#334155' : '#e2e8f0'}; }
    .aai-table th { background: ${THEME === 'dark' ? '#0f172a' : '#f8fafc'}; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: ${THEME === 'dark' ? '#94a3b8' : '#64748b'}; }
    .aai-table td { padding: 12px 16px; font-size: 14px; border-top: 1px solid ${THEME === 'dark' ? '#334155' : '#f1f5f9'}; }
    .aai-table tr:hover td { background: ${THEME === 'dark' ? '#334155' : '#f8fafc'}; }
    .aai-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .aai-badge-active { background: #dcfce7; color: #166534; }
    .aai-badge-pending { background: #fef9c3; color: #854d0e; }
    .aai-badge-reviewed { background: #dbeafe; color: #1e40af; }
    .aai-badge-hired { background: #d1fae5; color: #065f46; }
    .aai-badge-rejected { background: #fee2e2; color: #991b1b; }
    .aai-badge-default { background: ${THEME === 'dark' ? '#334155' : '#f1f5f9'}; color: ${THEME === 'dark' ? '#94a3b8' : '#64748b'}; }
    .aai-loading { text-align: center; padding: 40px; color: ${THEME === 'dark' ? '#64748b' : '#94a3b8'}; }
    .aai-error { text-align: center; padding: 24px; color: #ef4444; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca; }
    .aai-powered { text-align: center; margin-top: 24px; font-size: 12px; color: ${THEME === 'dark' ? '#475569' : '#94a3b8'}; }
    .aai-powered a { color: ${ACCENT}; text-decoration: none; }
    @media (max-width: 640px) { .aai-grid { grid-template-columns: 1fr 1fr; } .aai-table { font-size: 13px; } .aai-table th, .aai-table td { padding: 8px 12px; } }
  `;

  // ── API Helper ──
  async function apiFetch(endpoint) {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: { 'x-api-key': API_KEY },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API error ${res.status}`);
    }
    return res.json();
  }

  // ── Render Helpers ──
  function statusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    const cls = { active: 'active', pending: 'pending', reviewed: 'reviewed', hired: 'hired', rejected: 'rejected' }[s] || 'default';
    return `<span class="aai-badge aai-badge-${cls}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderStats(data) {
    return `
      <div class="aai-section">
        <div class="aai-grid">
          <div class="aai-card"><div class="aai-card-title">Total Clients</div><div class="aai-card-value">${data.total_clients}</div></div>
          <div class="aai-card"><div class="aai-card-title">Active Jobs</div><div class="aai-card-value">${data.active_jobs}</div></div>
          <div class="aai-card"><div class="aai-card-title">Total Applications</div><div class="aai-card-value">${data.total_applications?.toLocaleString()}</div></div>
          <div class="aai-card"><div class="aai-card-title">This Week</div><div class="aai-card-value">${data.applications_this_week}</div></div>
        </div>
      </div>`;
  }

  function renderClients(data) {
    if (!data.clients?.length) return '';
    const rows = data.clients.map(c => `
      <tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td>${esc(c.city || '')}${c.state ? ', ' + esc(c.state) : ''}</td>
        <td>${c.active_jobs}</td>
        <td>${c.total_applications}</td>
        <td>${c.applications_this_month}</td>
      </tr>`).join('');
    return `
      <div class="aai-section">
        <div class="aai-section-title">Clients</div>
        <table class="aai-table">
          <thead><tr><th>Name</th><th>Location</th><th>Active Jobs</th><th>Total Apps</th><th>This Month</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderJobs(data) {
    if (!data.jobs?.length) return '';
    const rows = data.jobs.map(j => `
      <tr>
        <td><strong>${esc(j.title)}</strong></td>
        <td>${esc(j.city || '')}${j.state ? ', ' + esc(j.state) : ''}</td>
        <td>${statusBadge(j.status)}</td>
        <td>${j.application_count}</td>
        <td>${formatDate(j.created_at)}</td>
      </tr>`).join('');
    return `
      <div class="aai-section">
        <div class="aai-section-title">Jobs</div>
        <table class="aai-table">
          <thead><tr><th>Title</th><th>Location</th><th>Status</th><th>Applications</th><th>Posted</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderApplications(data) {
    if (!data.applications?.length) return '';
    const rows = data.applications.slice(0, 25).map(a => `
      <tr>
        <td>${esc(a.first_name || '')} ${esc(a.last_name || '')}</td>
        <td>${esc(a.job_title)}</td>
        <td>${esc(a.client_name)}</td>
        <td>${statusBadge(a.status)}</td>
        <td>${esc(a.city || '')}${a.state ? ', ' + esc(a.state) : ''}</td>
        <td>${formatDate(a.applied_at)}</td>
      </tr>`).join('');
    return `
      <div class="aai-section">
        <div class="aai-section-title">Recent Applications</div>
        <table class="aai-table">
          <thead><tr><th>Name</th><th>Job</th><th>Client</th><th>Status</th><th>Location</th><th>Applied</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Main Init ──
  async function init() {
    const container = document.querySelector(CONTAINER_SEL);
    if (!container) {
      console.error(`[ApplyAI SDK] Container "${CONTAINER_SEL}" not found.`);
      return;
    }

    // Inject styles
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    container.innerHTML = '<div class="aai-dashboard"><div class="aai-loading">Loading dashboard…</div></div>';

    try {
      const fetches = {};
      const sectionMap = { stats: 'stats', clients: 'clients', jobs: 'jobs', applications: 'applications' };
      
      for (const s of SECTIONS) {
        if (sectionMap[s]) {
          fetches[s] = apiFetch(sectionMap[s]);
        }
      }

      const results = {};
      for (const [key, promise] of Object.entries(fetches)) {
        try {
          results[key] = await promise;
        } catch (e) {
          console.warn(`[ApplyAI SDK] Failed to load ${key}:`, e);
          results[key] = null;
        }
      }

      let html = '<div class="aai-dashboard">';
      if (results.stats) html += renderStats(results.stats);
      if (results.clients) html += renderClients(results.clients);
      if (results.jobs) html += renderJobs(results.jobs);
      if (results.applications) html += renderApplications(results.applications);
      html += '<div class="aai-powered">Powered by <a href="https://applyai.jobs" target="_blank" rel="noopener">ApplyAI</a></div>';
      html += '</div>';

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="aai-dashboard"><div class="aai-error">Failed to load dashboard: ${esc(err.message)}</div></div>`;
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
