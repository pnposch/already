// Daily cleanup and tab badge
importScripts("lib.js");

// Reload and update drop dynamic scripts
async function syncScripts() {
  const { sites = [] } = await chrome.storage.local.get("sites");
  const existing = await chrome.scripting.getRegisteredContentScripts(
    { ids: ["already"] }
  );
  if (sites.length === 0) {
    if (existing.length) {
      await chrome.scripting.unregisterContentScripts({ ids: ["already"] });
    }
    return;
  }
  const script = {
    id: "already",
    matches: sites.map((h) => "*://" + h + "/*"),
    js: ["lib.js", "content.js"],
    css: ["content.css"],
    runAt: "document_idle"
  };
  if (existing.length) await chrome.scripting.updateContentScripts([script]);
  else await chrome.scripting.registerContentScripts([script]);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("cleanup", { periodInMinutes: 1440 });
  syncScripts();
});

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === "local" && ch.sites) syncScripts();
});

async function runCleanup() {
  const all = await chrome.storage.local.get(null);
  const sites = all.sites || [];
  const retention = (all.settings || {}).retentionDays || 60;
  const today = AlreadyLib.dayNumber(Date.now());
  const updates = {};
  const removals = [];
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith("art:")) continue;
    if (!sites.includes(k.slice(4))) { removals.push(k); continue; }
    const pruned = AlreadyLib.pruneArticles(v, today, retention);
    if (Object.keys(pruned).length === 0) removals.push(k);
    else updates[k] = pruned;
  }
  if (Object.keys(updates).length) await chrome.storage.local.set(updates);
  if (removals.length) await chrome.storage.local.remove(removals);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") runCleanup();
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== "complete" || !tab.url) return;
  const { sites = [] } = await chrome.storage.local.get("sites");
  let on = false;
  try { on = sites.includes(new URL(tab.url).hostname); } catch { }
  chrome.action.setBadgeText({ tabId, text: on ? "on" : "" });
});
