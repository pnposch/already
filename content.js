// Runs only on enabled hosts
(() => {
  const L = globalThis.AlreadyLib;
  const HOST = location.hostname;
  const KEY = "art:" + HOST;
  const DEFAULTS = { threshold: 3, dwellMs: 1000, mode: "dim", retentionDays: 60 };

  const processed = new WeakSet();
  let settings = { ...DEFAULTS };
  let articles = {};
  let dirty = false;
  let saveTimer = null;

  async function loadState() {
    const got = await chrome.storage.local.get(["settings", KEY]);
    settings = { ...DEFAULTS, ...(got.settings || {}) };
    articles = got[KEY] || {};
  }

  function saveSoon() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 2000);
  }

  async function flush() {
    if (!dirty) return;
    dirty = false;
    try {
      await chrome.storage.local.set({ [KEY]: articles });
    } catch {
      evictOldest();
      chrome.storage.local.set({ [KEY]: articles }).catch(() => { });
    }
  }

  function evictOldest() {
    const keys = Object.keys(articles)
      .sort((a, b) => articles[a].t - articles[b].t);
    for (const k of keys.slice(0, Math.ceil(keys.length / 2))) {
      delete articles[k];
    }
  }

  function entryFor(key) {
    if (!articles[key]) {
      articles[key] = { c: 0, r: 0, t: L.dayNumber(Date.now()) };
    }
    return articles[key];
  }

  function hasTwinSibling(el) {
    const cls = el.className;
    if (typeof cls !== "string" || !cls) return false;
    for (const sib of el.parentElement?.children || []) {
      if (sib !== el && sib.tagName === el.tagName && sib.className === cls) {
        return true;
      }
    }
    return false;
  }

  function findCard(a) {
    const semantic = a.closest("article, li");
    if (semantic) return semantic;
    let el = a;
    for (let i = 0; i < 4 && el.parentElement; i++) {
      el = el.parentElement;
      if (hasTwinSibling(el)) return el;
    }
    return a;
  }

  function scan() {
    for (const a of document.querySelectorAll("a[href]")) {
      const key = L.normalizeUrl(a.href);
      if (!key || !L.isArticleHref(key)) continue;
      if (!L.isHeadlineText(a.textContent)) continue;
      const card = findCard(a);
      if (processed.has(card)) continue;
      processed.add(card);
      card.dataset.alreadyKey = key;
      if (L.shouldGrey(articles[key], settings.threshold)) {
        card.dataset.already = settings.mode;
      }
    }
  }

  async function main() {
    try {
      await loadState();
      scan();
      addEventListener("pagehide", flush);
    } catch (e) {
      console.warn("Already: disabled on error", e);
    }
  }

  main();
})();
