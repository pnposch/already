const $ = (id) => document.getElementById(id);
let host = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url = null;
  try { url = new URL(tab.url); } catch { }
  if (!url || !url.protocol.startsWith("http")) {
    $("site").textContent = "Not available on this page";
    $("toggle").disabled = true;
  } else {
    host = url.hostname;
    $("site").textContent = host;
  }
  const { sites = [] } = await chrome.storage.local.get("sites");
  $("toggle").checked = host !== null && sites.includes(host);
  const { settings = {} } = await chrome.storage.local.get("settings");
  const s = {
    threshold: 3, dwellMs: 1000, mode: "dim", retentionDays: 60,
    ...settings
  };
  $("threshold").value = s.threshold;
  $("dwellMs").value = s.dwellMs;
  $("mode").value = s.mode;
  $("retentionDays").value = s.retentionDays;
}

async function syncScripts(sites) {
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

$("toggle").addEventListener("change", async (e) => {
  const { sites = [] } = await chrome.storage.local.get("sites");
  if (e.target.checked) {
    const ok = await chrome.permissions.request({ origins: ["*://" + host + "/*"] });
    if (!ok) { e.target.checked = false; return; }
    if (!sites.includes(host)) sites.push(host);
  } else {
    const i = sites.indexOf(host);
    if (i >= 0) sites.splice(i, 1);
    // Revoke host permission best-effort.
    try {
      await chrome.permissions.remove({ origins: ["*://" + host + "/*"] });
    } catch { }
  }
  await chrome.storage.local.set({ sites });
  try {
    await syncScripts(sites);
  } catch { }
});

async function saveSettings() {
  await chrome.storage.local.set({ settings: {
    threshold: +$("threshold").value,
    dwellMs: +$("dwellMs").value,
    mode: $("mode").value,
    retentionDays: +$("retentionDays").value
  }});
}

for (const id of ["threshold", "dwellMs", "mode", "retentionDays"]) {
  $(id).addEventListener("change", saveSettings);
}

$("reset").addEventListener("click", async () => {
  if (host === null) return;
  await chrome.storage.local.remove("art:" + host);
  $("reset").textContent = "Data cleared";
});

init();
