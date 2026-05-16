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

## 💡 How to Use

| Action | How |
|--------|-----|
| **Save a job** | Open any job listing → click the ApplyTrack icon → confirm/edit → Save |
| **View board** | Click the icon on any tab (non-job pages open the dashboard) |
| **Move stage** | Use the stage dropdown on each card, or drag cards between columns |
| **Edit a job** | Click the pencil icon or anywhere on a card |
| **Export** | Click "Export CSV" in the footer — downloads a `.csv` file |
| **Theme** | Toggle dark/light with the sun/moon icon in the header |

---

## 🌐 Supported Job Boards (auto-parsing)

Title parsing works on most job sites including:

- LinkedIn (`Role at Company | LinkedIn`)
- Greenhouse (`Company - Role`)
- Lever (`Company: Role`)
- Workday, Indeed, Glassdoor
- Any site where job title is in the browser tab

---

## 🛂 Visa Sponsor Detection

When you type a company name, ApplyTrack checks it against a curated list of ~100 known H1B sponsors (stored in `sponsors.js`). The badge is:

- ✓ **Sponsors H1B** (green) — known H1B sponsor
- ? **Unknown** (grey) — not in database
- ✗ **No Sponsorship** (slate) — manually marked

You can always override the badge manually when saving/editing a job.

> ⚠️ The sponsor list is a community-curated snapshot. Always verify with official [USCIS H1B disclosure data](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub).

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
