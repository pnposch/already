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

const AlreadyLib = { STRIP_PARAMS, normalizeUrl };
globalThis.AlreadyLib = AlreadyLib;
// CJS export for node tests
if (typeof module !== "undefined") module.exports = AlreadyLib;
