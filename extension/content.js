// content.js — Page reader for ApplyTrack v1.1.0
// Executed programmatically via chrome.scripting.executeScript() on icon click.
// Priority: JSON-LD → DOM selectors → OpenGraph meta → title parse → URL hostname
// Returns: { company: string, role: string, url: string }

(function () {
  'use strict';

  const url  = window.location.href;
  const host = window.location.hostname.replace(/^www\./, '');

  // ── 1. JSON-LD structured data ────────────────────────────────────────────
  // Most job boards embed JobPosting schema — this is the gold standard.
  function fromJsonLd() {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const items = [].concat(JSON.parse(s.textContent));
        for (const d of items) {
          if (d['@type'] === 'JobPosting') {
            const role    = d.title || d.name || '';
            const company = d.hiringOrganization?.name || d.employer?.name || '';
            if (role || company) return { role, company, url };
          }
        }
      } catch (_) {}
    }
    return null;
  }

  // ── 2. Site-specific DOM selectors ────────────────────────────────────────
  function fromDom() {
    // Greenhouse  (greenhouse.io, job-boards.greenhouse.io)
    if (host.includes('greenhouse.io')) return pick(
      q('.job-post h1, #main-content h1, .posting-headline h1, [class*="job-title"] h1'),
      q('.company-name, .job-header .company') || urlSlug(/greenhouse\.io\/([^/?#]+)/)
    );

    // Lever  (jobs.lever.co)
    if (host.includes('lever.co')) return pick(
      q('.posting-headline h2'),
      q('.main-header-text .large-category-label') || urlSlug(/lever\.co\/([^/?#]+)/)
    );

    // LinkedIn
    if (host.includes('linkedin.com')) return pick(
      q('.job-details-jobs-unified-top-card__job-title h1, .top-card-layout__title, h1.job-title'),
      q('.job-details-jobs-unified-top-card__company-name a, .topcard__org-name-link, .job-details-jobs-unified-top-card__company-name')
    );

    // Indeed
    if (host.includes('indeed.com')) return pick(
      q('[data-testid="jobsearch-JobInfoHeader-title"] span, h1.jobsearch-JobInfoHeader-title'),
      q('[data-testid="inlineHeader-companyName"] a, .jobsearch-CompanyInfoContainer a, [data-testid="inlineHeader-companyName"]')
    );

    // Ashby  (jobs.ashbyhq.com/company/...)
    if (host.includes('ashbyhq.com')) return pick(
      q('h1'),
      urlSlug(/ashbyhq\.com\/([^/?#]+)/)
    );

    // Workday  (company.myworkdayjobs.com)
    if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) return pick(
      q('[data-automation-id="jobPostingHeader"], [class*="job-title"] h1'),
      cap(host.split('.')[0])
    );

    // Glassdoor
    if (host.includes('glassdoor.com')) return pick(
      q('[data-test="job-title"], .job-title, h1[class*="title"]'),
      q('[data-test="employer-name"], .employer-name, [class*="employer"] [class*="name"]')
    );

    // SmartRecruiters
    if (host.includes('smartrecruiters.com')) return pick(
      q('.job-title h1, [data-qa="job-title"]'),
      q('.company-name, [data-qa="company-name"]') || urlSlug(/smartrecruiters\.com\/([^/?#]+)/)
    );

    // iCIMS
    if (host.includes('icims.com')) return pick(
      q('#iCIMS_Header h1, .iCIMS_Header h1, h1[class*="title"]'),
      fromHostname()
    );

    // Taleo
    if (host.includes('taleo.net')) return pick(
      q('.Title h1, .requisitionTitle, h1[class*="title"]'),
      fromHostname()
    );

    // Wellfound / AngelList
    if (host.includes('wellfound.com') || host.includes('angel.co')) return pick(
      q('h1[class*="title"], .job-listing-name'),
      q('[class*="startup-link"], [class*="company-name"]')
    );

    // Jobvite
    if (host.includes('jobvite.com')) return pick(
      q('h1.jv-header, h1[class*="title"]'),
      urlSlug(/jobvite\.com\/([^/?#]+)/)
    );

    // BambooHR  (company.bamboohr.com)
    if (host.includes('bamboohr.com')) return pick(
      q('h2.Resume__jobTitle, h1[class*="title"]'),
      cap(host.split('.')[0])
    );

    // Workable
    if (host.includes('workable.com')) return pick(
      q('h1.title, h1[class*="job"]'),
      q('[class*="company"] h2') || urlSlug(/workable\.com\/([^/?#]+)/)
    );

    // Recruitee
    if (host.includes('recruitee.com')) return pick(
      q('h1.job-title, .offer-title h1'),
      fromHostname()
    );

    // Builtin
    if (host.includes('builtin.com')) return pick(
      q('h1[class*="title"], .job-info h1'),
      q('[class*="company-name"], a[class*="company"]')
    );

    // Dice
    if (host.includes('dice.com')) return pick(
      q('h1[data-cy="jobTitle"], h1.jobTitle'),
      q('[data-cy="companyNameLink"], .employer-name a')
    );

    // ZipRecruiter
    if (host.includes('ziprecruiter.com')) return pick(
      q('h1[class*="title"], .job_title'),
      q('[class*="company_name"], [class*="hiring_company"]')
    );

    // Handshake
    if (host.includes('joinhandshake.com')) return pick(
      q('h1[class*="title"], [class*="job-title"]'),
      q('[class*="employer-name"], [class*="company-name"]')
    );

    // Otta
    if (host.includes('otta.com')) return pick(
      q('h1'),
      q('[class*="company"] h2, [class*="employer"]')
    );

    // Monster
    if (host.includes('monster.com')) return pick(
      q('h1[class*="title"], .job-title'),
      q('[class*="company"], .employer')
    );

    // SimplyHired
    if (host.includes('simplyhired.com')) return pick(
      q('h2[class*="title"], h1[class*="title"]'),
      q('[class*="company"], .employer')
    );

    // CareerBuilder
    if (host.includes('careerbuilder.com')) return pick(
      q('h1[class*="title"]'),
      q('[class*="company-name"]')
    );

    // MyNextHire  (company.careers.mynexthire.io)
    if (host.includes('mynexthire.io')) return pick(
      q('h1, h2.job-title, [class*="job-title"], [class*="job_title"]'),
      q('[class*="company-name"], [class*="employer"]') || cap(host.split('.')[0])
    );

    // Rippling / Rippling ATS  (app.rippling.com/job-listings, *.rippling.com)
    if (host.includes('rippling.com')) return pick(
      q('h1[class*="title"], h1'),
      q('[class*="company"], [class*="employer"]') || fromHostname()
    );

    // Gem  (jobs.gem.com / company.gem.com)
    if (host.includes('gem.com')) return pick(
      q('h1, [class*="job-title"]'),
      q('[class*="company-name"]') || urlSlug(/gem\.com\/([^/?#]+)/)
    );

    // Pinpoint  (company.pinpointhq.com)
    if (host.includes('pinpointhq.com')) return pick(
      q('h1, [class*="job-title"]'),
      cap(host.split('.')[0])
    );

    // Breezy HR  (company.breezy.hr)
    if (host.includes('breezy.hr')) return pick(
      q('h1, [class*="position"]'),
      cap(host.split('.')[0])
    );

    return null;
  }

  // ── 3. OpenGraph / meta tags ──────────────────────────────────────────────
  function fromMeta() {
    const ogTitle = meta('og:title') || meta('twitter:title', 'name');
    const ogSite  = meta('og:site_name');
    if (!ogTitle) return null;

    const atM = ogTitle.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atM) return { role: atM[1].trim(), company: atM[2].trim(), url };

    if (ogSite) {
      const clean = ogTitle.replace(new RegExp(`\\s*[-–—|]\\s*${reEsc(ogSite)}\\s*$`, 'i'), '').trim();
      return { role: clean || ogTitle, company: ogSite, url };
    }
    return null;
  }

  // ── 4. Title parse fallback ───────────────────────────────────────────────
  const GENERIC_WORDS = new Set(['careers', 'career', 'jobs', 'job', 'apply', 'hiring', 'mynexthire', 'greenhouse', 'lever', 'workday', 'taleo', 'icims', 'smartrecruiters', 'jobvite', 'workable', 'recruitee', 'ashby', 'bamboohr']);

  function isGeneric(s) { return GENERIC_WORDS.has(s.toLowerCase().trim()); }

  function fromTitle() {
    let t = (document.title || '').slice(0, 300)
      .replace(/\s*[|\-–—]\s*(LinkedIn|Indeed|Greenhouse|Lever|Workday|Glassdoor|Builtin|Dice|ZipRecruiter|SmartRecruiters|Wellfound|AngelList|Handshake|Ashby|Otta|Monster|Recruitee|Jobvite|Workable|BambooHR|MyNextHire|Careers?|Jobs?|Apply Now)\s*$/i, '')
      .replace(/\s+/g, ' ').trim();

    let m = t.match(/^(.+?)\s+at\s+(.+)$/i);
    if (m) return { role: m[1].trim(), company: m[2].trim(), url };

    m = t.match(/^([^:–—|]{1,50})\s*[:]\s*(.+)$/);
    if (m && m[1].trim().split(' ').length <= 5) return { role: m[2].trim(), company: m[1].trim(), url };

    m = t.match(/^([^–—\-]{2,50})\s*[–—-]\s*(.+)$/);
    if (m) {
      const [p1, p2] = [m[1].trim(), m[2].trim()];
      // Shorter, fewer-word segment is more likely the company name
      if (p1.split(' ').length <= 4 && p1.length < p2.length) {
        return isGeneric(p1) ? { role: p2, company: fromHostname(), url } : { role: p2, company: p1, url };
      }
      if (p2.split(' ').length <= 4 && p2.length < p1.length) {
        return isGeneric(p2) ? { role: p1, company: fromHostname(), url } : { role: p1, company: p2, url };
      }
      return { role: p2, company: p1, url };
    }

    return { role: t, company: fromHostname(), url };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function q(sel)             { return document.querySelector(sel)?.textContent?.trim() || ''; }
  function meta(prop, a = 'property') { return document.querySelector(`meta[${a}="${prop}"]`)?.content?.trim() || ''; }
  function urlSlug(re)        { const m = url.match(re); return m ? cap(m[1]) : ''; }
  function cap(s)             { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function reEsc(s)           { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function fromHostname() {
    const skip = new Set(['careers','jobs','job','apply','hire','work','com','io','co','net','org','us']);
    return cap(host.split('.').find(p => !skip.has(p.toLowerCase())) || host.split('.')[0]);
  }
  function pick(role, company) {
    if (!role && !company) return null;
    return { role: role || '', company: company || '', url };
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return fromJsonLd() || fromDom() || fromMeta() || fromTitle();
}());
