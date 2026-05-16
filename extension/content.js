// content.js — Page reader for ApplyTrack (Manifest V3)
//
// Executed PROGRAMMATICALLY via chrome.scripting.executeScript()
// when the user clicks the extension icon. Never auto-injected.
//
// Contract: reads ONLY document.title and window.location.
// No DOM mutation. No event listeners. No visual injection.
//
// Returns: { company: string, role: string, url: string }

(function () {
  'use strict';

  const title = document.title || '';
  const url   = window.location.href || '';

  /**
   * Parse a job listing page title into { company, role, url }.
   * Handles common patterns from LinkedIn, Greenhouse, Lever, Workday, Indeed.
   */
  function parse(rawTitle, rawUrl) {
    // Cap length before regex to prevent ReDoS on adversarial page titles
    let t = rawTitle.slice(0, 200)
      .replace(/\s*[|\-–—]\s*(LinkedIn|Indeed|Greenhouse|Lever|Workday|Glassdoor|Monster|ZipRecruiter|Careers|Jobs|Job Board|Apply Now)\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    let company = '', role = '';

    // Pattern 1: "Role at Company"  →  most common on LinkedIn
    let m = t.match(/^(.+?)\s+at\s+(.+)$/i);
    if (m) return { company: m[2].trim(), role: m[1].trim(), url: rawUrl };

    // Pattern 2: "Company: Role"  →  Lever, some custom boards
    m = t.match(/^([^:–—|]{1,50})\s*[:]\s*(.+)$/);
    if (m && m[1].trim().split(' ').length <= 5) {
      return { company: m[1].trim(), role: m[2].trim(), url: rawUrl };
    }

    // Pattern 3: "Company — Role" or "Company - Role"  →  Greenhouse
    m = t.match(/^([^–—\-]{2,40})\s*[–—-]\s*(.+)$/);
    if (m) {
      const p1 = m[1].trim(), p2 = m[2].trim();
      // Heuristic: shorter, Title-Cased part is likely the company
      if (p1.length <= 30 && /^[A-Z]/.test(p1) && p1.split(' ').length <= 4) {
        return { company: p1, role: p2, url: rawUrl };
      }
      if (p2.length <= 30 && /^[A-Z]/.test(p2) && p2.split(' ').length <= 4) {
        return { company: p2, role: p1, url: rawUrl };
      }
      return { company: p1, role: p2, url: rawUrl };
    }

    // Fallback: extract company from hostname
    try {
      // Use the domain root (e.g. "stripe" from careers.stripe.com) not the first subdomain
      const parts = new URL(rawUrl).hostname.replace(/^www\./, '').split('.');
      const host = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      company = host.charAt(0).toUpperCase() + host.slice(1);
    } catch (_) {}

    return { company, role: t, url: rawUrl };
  }

  return parse(title, url);
}());
