const $ = (id) => document.getElementById(id);
let host = null;

function setLamp(on) {
  $("lamp").textContent = on ? "Running" : "Idle";
  $("lamp").classList.toggle("on", on);
}

function modeValue() {
  return document.querySelector("input[name=mode]:checked").value;
}

async function loadStats() {
  if (host === null) {
    $("statTracked").textContent = "–";
    $("statFaded").textContent = "–";
    $("needle").style.visibility = "hidden";
    return;
  }
  $("needle").style.visibility = "visible";
  const key = "art:" + host;
  const got = await chrome.storage.local.get([key, "settings"]);
  const th = (got.settings || {}).threshold || 3;
  const arts = got[key] || {};
  const keys = Object.keys(arts);
  const faded = keys.filter(
    (k) => arts[k].r === 1 || arts[k].c >= th
  ).length;
  $("statTracked").textContent = keys.length;
  $("statFaded").textContent = faded;
  const spent = keys.length ? faded / keys.length : 0;
  const pct = (spent * 100).toFixed(1);
  $("needle").style.left = "min(" + pct + "%, calc(100% - 2px))";
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let url = null;
  try { url = new URL(tab.url); } catch { }
  if (!url || !url.protocol.startsWith("http")) {
    $("site").textContent = "Not available on this page";
    $("toggle").disabled = true;
    $("reset").disabled = true;
  } else {
    host = url.hostname;
    $("site").textContent = host;
  }
  const { sites = [] } = await chrome.storage.local.get("sites");
  const on = host !== null && sites.includes(host);
  $("toggle").checked = on;
  setLamp(on);
  const { settings = {} } = await chrome.storage.local.get("settings");
  const s = {
    threshold: 3, dwellMs: 1000, mode: "dim", retentionDays: 60,
    ...settings
  };
  $("threshold").value = s.threshold;
  $("dwellMs").value = s.dwellMs;
  $("retentionDays").value = s.retentionDays;
  document.querySelector(
    'input[name=mode][value="' + (s.mode === "hide" ? "hide" : "dim") + '"]'
  ).checked = true;
  loadStats();
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
    const ok = await chrome.permissions.request(
      { origins: ["*://" + host + "/*"] }
    );
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
  setLamp(e.target.checked);
});

async function saveSettings() {
  await chrome.storage.local.set({ settings: {
    threshold: +$("threshold").value || 3,
    dwellMs: +$("dwellMs").value || 0,
    mode: modeValue(),
    retentionDays: +$("retentionDays").value || 60
  }});
}

for (const id of ["threshold", "dwellMs", "retentionDays"]) {
  $(id).addEventListener("change", async () => {
    await saveSettings();
    loadStats();
  });
}
for (const r of document.querySelectorAll("input[name=mode]")) {
  r.addEventListener("change", saveSettings);
}

for (const b of document.querySelectorAll(".step")) {
  b.addEventListener("click", async () => {
    const input = $(b.dataset.for);
    const step = +input.step || 1;
    const raw = (+input.value || 0) + step * +b.dataset.dir;
    input.value = Math.min(+input.max, Math.max(+input.min, raw));
    await saveSettings();
    loadStats();
  });
}

$("reset").addEventListener("click", async () => {
  if (host === null) return;
  await chrome.storage.local.remove("art:" + host);
  const el = $("reset");
  el.textContent = "Plate wiped";
  setTimeout(() => { el.textContent = "Wipe this site’s data"; }, 1600);
  loadStats();
});

init();
