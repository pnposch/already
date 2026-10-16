// Pure logic, shared with node tests
const STRIP_PARAMS = ["gclid", "fbclid", "ref", "wt_mc"];

function normalizeUrl(href) {
  let u;
  try { u = new URL(href); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) {
    if (k.startsWith("utm_") || STRIP_PARAMS.includes(k)) {
      u.searchParams.delete(k);
    }
  }
  const path = u.pathname.replace(/\/$/, "") || "/";
  const q = u.searchParams.toString();
  return u.origin + path + (q ? "?" + q : "");
}

function isArticleHref(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  const segs = u.pathname.split("/").filter(Boolean);
  if (segs.length === 0) return false;
  const last = segs[segs.length - 1].replace(/\.\w+$/, "");
  if (/\d{4,}/.test(last)) return true;
  return last.split("-").filter(Boolean).length >= 3;
}

function isHeadlineText(text) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (t.length < 15 || t.length > 300) return false;
  return t.includes(" ");
}

function dayNumber(ms) {
  return Math.floor(ms / 86400000);
}

function shouldGrey(entry, threshold) {
  return !!entry && (entry.r === 1 || entry.c >= threshold);
}

function pruneArticles(map, today, retentionDays) {
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (today - v.t <= retentionDays) out[k] = v;
  }
  return out;
}

// Listing ID patterns per classifieds site
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const LISTING_SITES = [
  { host: /(^|\.)mobile\.de$/,
    urls: [/\/details\.html\?(?:.*&)?id=(\d+)/, /\/auto-inserat\/[^/]+\/(\d+)\.html/] },
  // Cards link via JS, not href
  { host: /(^|\.)autoscout24\.\w+$/,
    urls: [new RegExp("\\/(?:angebote|smyle\\/details)\\/(?:.*-)?(" + UUID + ")")],
    card: "article[data-guid]", attr: "data-guid" },
  { host: /(^|\.)autouncle\.\w+$/,
    urls: [/\/d\/(\d+)/, /\/das_wiedersehen\/[^/]+\/(\d+)/] }
];

function listingSite(host) {
  return LISTING_SITES.find((s) => s.host.test(host)) || null;
}

function listingKey(site, href) {
  let u;
  try { u = new URL(href); } catch { return null; }
  const s = u.pathname + u.search;
  for (const re of site.urls) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

const AlreadyLib = { STRIP_PARAMS, normalizeUrl, isArticleHref, isHeadlineText,
  dayNumber, shouldGrey, pruneArticles, listingSite, listingKey
};
globalThis.AlreadyLib = AlreadyLib;
// CJS export for node tests
if (typeof module !== "undefined") module.exports = AlreadyLib;
