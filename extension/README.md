# ApplyTrack Chrome Extension

Track job applications with H1B visa sponsorship detection — right from your browser.

---

## 📁 File Structure

```
extension/
├── manifest.json      Chrome Extension Manifest V3
├── background.js      Minimal MV3 service worker
├── content.js         Page reader (programmatic, no auto-injection)
├── sponsors.js        H1B sponsor database (~100 companies)
├── popup.html         Extension popup entry point
├── popup.css          All styles (dark + light themes)
├── popup.js           Full application logic
└── icons/
    ├── icon16.png     16×16
    ├── icon32.png     32×32
    ├── icon48.png     48×48
    └── icon128.png    128×128
```

---

## 🚀 Load Unpacked in Chrome

1. Clone / download this repo and locate the `extension/` folder.
2. Add your icons to `extension/icons/` (see `icons/ICONS_NEEDED.md`).
3. Open Chrome → navigate to `chrome://extensions`
4. Toggle **Developer mode** on (top-right switch).
5. Click **Load unpacked** → select the `extension/` folder.
6. The ApplyTrack icon appears in your toolbar. Pin it for easy access.

### To reload after edits
Click the ↺ refresh icon on the extension card in `chrome://extensions`.

---

## 🧭 Step-by-Step Usage Flow (Optimal)

### Step 1 — Install the extension
Follow the **Load Unpacked in Chrome** steps below. Pin the icon to your toolbar so it's one click away.

### Step 2 — Open a job listing
Navigate to any job posting on LinkedIn, Greenhouse, Lever, Indeed, Glassdoor, Workday, or a company careers page. **Make sure the full job detail page is loaded** — not just a search results page.

> Tip: The tab title is your signal. If it shows "Software Engineer at Google" you're on the right page.

### Step 3 — Click the ApplyTrack icon
The extension reads the **tab title** and **URL** only — nothing else. It auto-fills:
- **Company** — parsed from the title (or domain name as fallback)
- **Role** — parsed from the title
- **URL** — the current page address
- **H1B badge** — auto-detected from the sponsor list

### Step 4 — Review and correct the pre-filled fields
The parser is accurate but not perfect. Always glance at the fields before saving:
- Fix typos in company or role name
- Adjust the H1B badge if you know better
- Add notes (interview date, recruiter name, salary range)

### Step 5 — Save
Click **Save**. The job appears on your Kanban board under **Applied**.

### Step 6 — Track progress
As your application moves forward, update the stage:
- `Applied` → `Interviewing` → `Offer` / `Rejected` / `Ghosted`
- Use the dropdown on each card or drag the card to the right column

### Step 7 — Export when needed
Click **Export CSV** in the footer at any time. Share it with a recruiter, import it into a spreadsheet, or keep it as a backup.

---

## 💡 Quick Reference

| Action | How |
|--------|-----|
| **Save a job** | Open any job listing → click the ApplyTrack icon → confirm/edit → Save |
| **View board** | Click the icon on any tab (non-job pages open the dashboard) |
| **Move stage** | Use the stage dropdown on each card, or drag cards between columns |
| **Edit a job** | Click the pencil icon or anywhere on a card |
| **Export** | Click "Export CSV" in the footer — downloads a `.csv` file |
| **Theme** | Toggle dark/light with the sun/moon icon in the header |

---

## 🔍 How the Page Reading Works (Technical)

When you click the icon, the extension reads exactly **two things** from the current tab:

| What it reads | Where it comes from |
|---|---|
| `document.title` | The browser tab title |
| `window.location.href` | The URL in your address bar |

It reads **nothing else** — no job description, no salary, no DOM elements, no cookies, no login state.

### How it parses the title into Company + Role

The tab title is split using these patterns (tried in order):

| Pattern | Example title | Result |
|---|---|---|
| `"Role at Company"` | `Software Engineer at Google \| LinkedIn` | Role=Software Engineer, Company=Google |
| `"Company: Role"` | `Stripe: Backend Engineer` | Company=Stripe, Role=Backend Engineer |
| `"Company — Role"` | `Shopify — iOS Developer` | Company=Shopify, Role=iOS Developer |
| Fallback | Unrecognizable title | Company=domain name (e.g. `careers.stripe.com` → `stripe`) |

The site suffix (LinkedIn, Indeed, Glassdoor, etc.) is stripped before parsing so it never pollutes the company name.

---

## 🌐 Supported Job Boards (auto-parsing)

| Job Board | Works? | Tab title pattern |
|---|---|---|
| **LinkedIn** | ✅ Best | `Software Engineer at Google \| LinkedIn` |
| **Greenhouse** | ✅ Best | `Stripe - Backend Engineer` |
| **Lever** | ✅ Best | `Shopify: iOS Developer` |
| **Indeed** | ✅ Good | `SWE - Google \| Indeed.com` |
| **Glassdoor** | ✅ Good | `Google Software Engineer \| Glassdoor` |
| **Workday** | ⚠️ Partial | Titles are inconsistent — check and correct before saving |
| **Company career pages** | ⚠️ Fallback | Company name guessed from domain; role filled from title |
| **Generic job boards** | ⚠️ Fallback | Same as above — always verify before saving |

**Rule of thumb:** If the tab title clearly shows the job role and company name, the extension will parse it correctly. If the tab title just says "Careers" or "Job Application", the fields will need manual input.

**Pages that will NOT work:**
- Search results pages (e.g. LinkedIn job search listing, Indeed search results) — open the individual job posting first
- Pages behind a broken login redirect
- PDFs or job postings embedded in iframes with a different domain title

---

## 🛂 Visa Sponsor Detection

When you type a company name, ApplyTrack checks it against a curated list of ~100 known H1B sponsors (stored in `sponsors.js`). The badge is:

- ✓ **Sponsors H1B** (green) — known H1B sponsor
- ? **Unknown** (grey) — not in database
- ✗ **No Sponsorship** (slate) — manually marked

You can always override the badge manually when saving/editing a job.

> ⚠️ The sponsor list is a community-curated snapshot. Always verify with official [USCIS H1B disclosure data](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub).

---

## ⚖️ Is This Legal?

**Yes — completely legal.** Here is why:

| Concern | Reality |
|---|---|
| "Is reading the page title scraping?" | No. The tab title is the same text your OS taskbar already displays. It requires zero special access. |
| "Does it bypass any login or CAPTCHA?" | No. It only runs when *you* are already logged in and viewing the page. |
| "Does it violate LinkedIn / Greenhouse ToS?" | No. ToS restrictions on scraping target automated bots that make mass requests. This extension makes zero network requests to any job site — it just reads text you can already see. |
| "Does it send my data anywhere?" | No. All data stays in `chrome.storage.local` on your own machine. No server ever receives it. |
| "Could I get banned for using it?" | Extremely unlikely. It behaves like a human reading the tab title — because that is all it does. |

**What would make it illegal (and what this extension does NOT do):**
- Sending automated HTTP requests to scrape job listings at scale
- Bypassing paywalls or login walls
- Reselling or republishing the scraped data commercially
- Accessing data you are not authorized to view

---

## 🔒 Privacy

- **Zero backend** — all data lives in `chrome.storage.local` on your device.
- **No network requests** — no tracking, no analytics, no telemetry.
- **Minimal permissions** — `storage`, `activeTab`, `scripting` only.
- Content script is **programmatically injected** only when you click the icon — never auto-runs.

---

## 📦 Submit to Chrome Web Store

### Prerequisites
- A [Google Developer account](https://chrome.google.com/webstore/devconsole) ($5 one-time fee)
- Your icon set (see `icons/ICONS_NEEDED.md`)
- A 1280×800 or 640×400 screenshot of the popup

### Steps
1. Zip the entire `extension/` folder (not the parent directory).
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Click **New Item** → upload the zip.
4. Fill in store listing details (suggested below).
5. Upload screenshots, icon, and promotional images.
6. Submit for review (usually 1–3 business days).

### Suggested Store Description

**Short description (132 chars max):**
```
Track job applications in a Kanban board with H1B visa sponsorship detection. Export CSV. Zero backend.
```

**Full description:**
```
ApplyTrack is a privacy-first job application tracker for international job seekers on H1B or other work visas.

✦ ONE-CLICK SAVING
Open any job listing on LinkedIn, Greenhouse, Lever, Indeed, or Workday — click the icon, and the company and role are auto-filled. Confirm and save in seconds.

✦ KANBAN BOARD
Visualize your pipeline across five stages: Applied → Interviewing → Offer → Rejected → Ghosted. Drag cards or use the stage picker to move applications.

✦ H1B VISA SPONSOR DETECTION
ApplyTrack checks your company against a curated list of 100+ known H1B sponsors and shows a prominent badge on every card — so you always know where you stand.

✦ EXPORT TO CSV
Download your entire job log as a CSV for spreadsheet analysis or sharing with a recruiter.

✦ FULLY PRIVATE
All data stays on your device in chrome.storage.local. No account required. No servers. No tracking. Ever.
```

### Review tips
- Make sure the `description` in `manifest.json` clearly explains what content scripts access.
- The reviewer will want to see the `activeTab` + `scripting` permissions justified — your description above covers this.

---

## 🔧 Customizing the Sponsor List

Edit `sponsors.js` to add or remove companies from the H1B detection list:

```js
const H1B_SPONSORS = new Set([
  'your company',    // add entries in lowercase
  // ...
]);
```

---

## 📐 Icon Sizes Needed

See `icons/ICONS_NEEDED.md` for design specs.

---

## License

MIT — free to use, modify, and distribute.
