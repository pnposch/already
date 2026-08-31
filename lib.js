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

const AlreadyLib = { STRIP_PARAMS, normalizeUrl, isArticleHref, isHeadlineText };
globalThis.AlreadyLib = AlreadyLib;
// CJS export for node tests
if (typeof module !== "undefined") module.exports = AlreadyLib;
