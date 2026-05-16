// background.js — Minimal MV3 service worker for ApplyTrack
// Keeps the extension registered. All logic lives in popup.js.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[ApplyTrack] Installed. All data stored in chrome.storage.local.');
  }
});
