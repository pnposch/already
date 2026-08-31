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

  function isCandidate(a) {
    const key = L.normalizeUrl(a.href);
    if (!key || !L.isArticleHref(key)) return null;
    if (!L.isHeadlineText(a.textContent)) return null;
    return key;
  }

  const STOP_TAGS = new Set(
    ["BODY", "MAIN", "NAV", "HEADER", "FOOTER", "FORM", "SECTION", "ASIDE"]
  );

  // Card: widest ancestor holding no foreign article
  function findCard(a, key, cands) {
    const semantic = a.closest("article, li");
    if (semantic) return semantic;
    let el = a;
    for (let i = 0; i < 6; i++) {
      const p = el.parentElement;
      if (!p || STOP_TAGS.has(p.tagName)) break;
      const foreign = cands.some(
        (c) => c[0] !== a && c[1] !== key && p.contains(c[0])
      );
      if (foreign) break;
      el = p;
    }
    return el;
  }

  function applyState(card, key) {
    if (L.shouldGrey(articles[key], settings.threshold)) {
      card.dataset.already = settings.mode;
    } else {
      delete card.dataset.already;
    }
  }

  const counted = new Set();
  const timers = new Map();

  const io = new IntersectionObserver(onIntersect, { threshold: 0.5 });

  function onIntersect(entries) {
    for (const e of entries) {
      const key = e.target.dataset.alreadyKey;
      if (!key || counted.has(key)) continue;
      if (e.isIntersecting) {
        timers.set(key, setTimeout(() => countImpression(key), settings.dwellMs));
      } else {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
    }
  }

  function countImpression(key) {
    if (counted.has(key)) return;
    counted.add(key);
    const en = entryFor(key);
    en.c += 1;
    en.t = L.dayNumber(Date.now());
    saveSoon();
  }

  function markRead(key) {
    const en = entryFor(key);
    en.r = 1;
    saveSoon();
  }

  let scanTimer = null;

  function debounceScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  }

  const mo = new MutationObserver(debounceScan);

  function scan() {
    const cands = [];
    for (const a of document.querySelectorAll("a[href]")) {
      const key = isCandidate(a);
      if (key) cands.push([a, key]);
    }
    for (const [a, key] of cands) {
      const card = findCard(a, key, cands);
      if (processed.has(card)) continue;
      processed.add(card);
      card.dataset.alreadyKey = key;
      card.addEventListener("mousedown", () => markRead(key));
      applyState(card, key);
      if (!card.dataset.already) io.observe(card);
    }
  }

  // Popup settings changes restyle immediately
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== "local" || !ch.settings) return;
    settings = { ...DEFAULTS, ...(ch.settings.newValue || {}) };
    for (const card of document.querySelectorAll("[data-already-key]")) {
      applyState(card, card.dataset.alreadyKey);
    }
  });

  async function main() {
    try {
      await loadState();
      const self = L.normalizeUrl(location.href);
      if (self && articles[self]) markRead(self);
      scan();
      mo.observe(document.body, { childList: true, subtree: true });
      addEventListener("pagehide", flush);
    } catch (e) {
      console.warn("Already: disabled on error", e);
    }
  }

  main();
})();
