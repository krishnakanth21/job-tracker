// sponsors.js — Known visa-sponsoring companies (100+ companies)
// Normalized to lowercase. Matched against user-entered company name.
// Covers US, EU, UK, Australia and other major hiring markets.
// Last updated: 2026. Always verify with the employer directly.

const VISA_SPONSORS = new Set([
  // ── FAANG & Tier-1 Tech ───────────────────────────────────────────────────
  'google', 'alphabet', 'microsoft', 'amazon', 'apple', 'meta', 'facebook',
  'netflix', 'nvidia',

  // ── Cloud & Enterprise ────────────────────────────────────────────────────
  'salesforce', 'oracle', 'ibm', 'cisco', 'adobe', 'sap', 'vmware',
  'workday', 'servicenow', 'splunk', 'veeva', 'nutanix', 'elastic',
  'cloudera', 'twilio', 'okta', 'zendesk', 'hubspot', 'atlassian',
  'intuit', 'autodesk', 'ansys', 'cadence', 'synopsys',

  // ── Cybersecurity ─────────────────────────────────────────────────────────
  'crowdstrike', 'palo alto networks', 'palo alto', 'zscaler', 'fortinet',
  'sentinelone', 'rapid7', 'qualys', 'tenable',

  // ── Dev Tools, Data & Infrastructure ─────────────────────────────────────
  'github', 'gitlab', 'hashicorp', 'confluent', 'databricks', 'mongodb',
  'snowflake', 'datadog', 'new relic', 'sentry', 'postman', 'jfrog',
  'cloudflare', 'fastly', 'grafana', 'vercel', 'netlify', 'supabase',

  // ── Consumer & Social ─────────────────────────────────────────────────────
  'uber', 'lyft', 'airbnb', 'doordash', 'instacart', 'pinterest',
  'snap', 'snapchat', 'twitter', 'x corp', 'tiktok', 'bytedance',
  'linkedin', 'reddit', 'discord', 'spotify',

  // ── Fintech & Payments ────────────────────────────────────────────────────
  'stripe', 'coinbase', 'robinhood', 'square', 'block', 'paypal',
  'brex', 'ramp', 'chime', 'affirm', 'klarna', 'plaid', 'marqeta',
  'adyen', 'checkout',

  // ── Investment Banks & Quant ──────────────────────────────────────────────
  'jpmorgan', 'jp morgan', 'goldman sachs', 'morgan stanley', 'citigroup',
  'bank of america', 'wells fargo', 'blackrock', 'two sigma', 'de shaw',
  'jane street', 'citadel', 'hudson river trading', 'jump trading',
  'point72', 'bridgewater', 'millennium', 'aqr',

  // ── Payments Networks ─────────────────────────────────────────────────────
  'visa', 'mastercard', 'american express', 'amex',

  // ── AI & Machine Learning ─────────────────────────────────────────────────
  'openai', 'anthropic', 'cohere', 'scale ai', 'scale', 'hugging face',
  'stability ai', 'inflection', 'adept', 'mistral', 'perplexity',

  // ── Design, Productivity & Collaboration ──────────────────────────────────
  'figma', 'notion', 'airtable', 'canva', 'miro', 'zoom', 'slack',
  'dropbox', 'box', 'asana', 'monday',

  // ── E-commerce & Retail ───────────────────────────────────────────────────
  'shopify', 'ebay', 'walmart', 'target', 'wayfair', 'etsy',

  // ── Semiconductors & Hardware ─────────────────────────────────────────────
  'intel', 'qualcomm', 'broadcom', 'amd', 'texas instruments', 'arm',
  'applied materials', 'lam research', 'kla', 'asml', 'micron',
  'western digital', 'seagate', 'netapp', 'pure storage', 'marvell',

  // ── Defense & Aerospace ───────────────────────────────────────────────────
  'boeing', 'lockheed martin', 'raytheon', 'northrop grumman',
  'general dynamics', 'spacex', 'tesla', 'rivian', 'lucid',
  'anduril', 'l3harris',

  // ── Autonomous & Robotics ─────────────────────────────────────────────────
  'waymo', 'cruise', 'aurora', 'nuro', 'zoox', 'motional',

  // ── Healthcare & Biotech ──────────────────────────────────────────────────
  'illumina', 'genentech', 'roche', 'biogen', 'pfizer', 'merck',
  'abbott', 'medtronic', 'boston scientific', 'intuitive surgical',
  'tempus', 'recursion', 'moderna',

  // ── Consulting & Professional Services ───────────────────────────────────
  'deloitte', 'accenture', 'mckinsey', 'bcg', 'bain', 'pwc', 'kpmg',
  'ey', 'ernst & young', 'booz allen', 'leidos', 'saic',

  // ── Gaming & Media ────────────────────────────────────────────────────────
  'epic games', 'roblox', 'unity', 'riot games', 'activision',
  'electronic arts', 'ea', 'take-two', 'niantic',

  // ── Other Notable Sponsors ────────────────────────────────────────────────
  'palantir', 'qualtrics', 'zenefits', 'gusto', 'rippling', 'deel',
]);
