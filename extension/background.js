// background.js — ApplyTrack MV3 service worker  v1.1.0
// Handles: install logging · follow-up reminder alarms · notifications

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[ApplyTrack] Installed. All data stored in chrome.storage.local.');
  }
  if (reason === 'update') {
    console.log('[ApplyTrack] Updated to v1.1.0.');
  }
});

// ── Follow-up Reminder Alarms ─────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('remind_')) return;

  const jobId = alarm.name.slice('remind_'.length);

  const [jobsData, remindersData] = await Promise.all([
    new Promise(r => chrome.storage.local.get(['jobs'],      d => r(d.jobs      || []))),
    new Promise(r => chrome.storage.local.get(['reminders'], d => r(d.reminders || {}))),
  ]);

  const job      = jobsData.find(j => j.id === jobId);
  const reminder = remindersData[alarm.name];

  const company = job?.company || reminder?.company || 'a company';
  const role    = job?.role    || reminder?.role    || 'a role';
  const days    = reminder?.days || '?';

  chrome.notifications.create(`notif_${jobId}_${Date.now()}`, {
    type:     'basic',
    iconUrl:  'icons/icon48.png',
    title:    'ApplyTrack — Follow-Up Reminder',
    message:  `You applied to ${company} for ${role} ${days} day${days !== 1 ? 's' : ''} ago. Any update?`,
    priority: 1,
    requireInteraction: false,
  });

  // Clean up reminder metadata — alarm has fired
  delete remindersData[alarm.name];
  chrome.storage.local.set({ reminders: remindersData });

  // Clear reminderDays + reminderSet from the job so the clock dot disappears
  if (job) {
    const updated = jobsData.map(j =>
      j.id === jobId ? { ...j, reminderDays: null, reminderSet: null } : j
    );
    chrome.storage.local.set({ jobs: updated });
  }
});

// ── Notification click — open the popup ───────────────────────────────────────
chrome.notifications.onClicked.addListener(notifId => {
  chrome.notifications.clear(notifId);
  chrome.action.openPopup?.().catch(() => {});
});
