const test = require("node:test");
const assert = require("node:assert");
const L = require("../lib.js");

test("normalizeUrl strips hash and tracking params", () => {
  assert.equal(
    L.normalizeUrl("https://ex.com/politics/story-one?utm_source=x&gclid=1&page=2#top"),
    "https://ex.com/politics/story-one?page=2"
  );
});

test("normalizeUrl strips trailing slash", () => {
  assert.equal(L.normalizeUrl("https://ex.com/a/b/"), "https://ex.com/a/b");
});

test("normalizeUrl keeps root path", () => {
  assert.equal(L.normalizeUrl("https://ex.com/"), "https://ex.com/");
});

test("normalizeUrl rejects non-http and garbage", () => {
  assert.equal(L.normalizeUrl("mailto:a@b.c"), null);
  assert.equal(L.normalizeUrl("not a url"), null);
});

test("isArticleHref accepts slug paths", () => {
  assert.equal(L.isArticleHref("https://ex.com/politics/new-tax-law-passes"), true);
  assert.equal(L.isArticleHref("https://ex.com/story-12345678.html"), true);
});

test("isArticleHref rejects sections and root", () => {
  assert.equal(L.isArticleHref("https://ex.com/"), false);
  assert.equal(L.isArticleHref("https://ex.com/politics"), false);
  assert.equal(L.isArticleHref("https://ex.com/politics/economy"), false);
  assert.equal(L.isArticleHref("garbage"), false);
});

test("isHeadlineText accepts real headlines", () => {
  assert.equal(L.isHeadlineText("New tax law passes after long debate"), true);
});

test("isHeadlineText rejects short or empty text", () => {
  assert.equal(L.isHeadlineText("More"), false);
  assert.equal(L.isHeadlineText(""), false);
  assert.equal(L.isHeadlineText(null), false);
  assert.equal(L.isHeadlineText("Supercalifragilistic"), false);
});

test("dayNumber converts ms to days", () => {
  assert.equal(L.dayNumber(0), 0);
  assert.equal(L.dayNumber(86400000 * 3 + 5), 3);
});

test("shouldGrey honors read flag and threshold", () => {
  assert.equal(L.shouldGrey(undefined, 3), false);
  assert.equal(L.shouldGrey({ c: 2, r: 0, t: 0 }, 3), false);
  assert.equal(L.shouldGrey({ c: 3, r: 0, t: 0 }, 3), true);
  assert.equal(L.shouldGrey({ c: 0, r: 1, t: 0 }, 3), true);
});

test("pruneArticles drops stale entries", () => {
  const map = {
    fresh: { c: 1, r: 0, t: 100 },
    stale: { c: 5, r: 1, t: 10 }
  };
  const out = L.pruneArticles(map, 100, 60);
  assert.deepEqual(Object.keys(out), ["fresh"]);
});

test("listingKey extracts classifieds IDs", () => {
  const cases = [
    ["suchen.mobile.de", "https://suchen.mobile.de/fahrzeuge/details.html?id=420206823&dam=false&ref=srp", "420206823"],
    ["suchen.mobile.de", "https://suchen.mobile.de/fahrzeuge/details.html?ref=srp&id=420206823", "420206823"],
    ["suchen.mobile.de", "https://suchen.mobile.de/auto-inserat/bmw-520da-touring-neuwied/419397745.html", "419397745"],
    ["www.autoscout24.de", "https://www.autoscout24.de/angebote/hyundai-ioniq-5-dynamiq-elektro-weiss-cat_ma33gr75824ge924va3320mt2267tr2682-7bdc5300-3a92-427a-8f02-2a8d1e83b9c7?sort=age&position=5", "7bdc5300-3a92-427a-8f02-2a8d1e83b9c7"],
    ["www.autoscout24.de", "https://www.autoscout24.de/smyle/details/08f1d0a5-cc3c-474b-816a-baa6f6a8cd7d/", "08f1d0a5-cc3c-474b-816a-baa6f6a8cd7d"],
    ["www.autouncle.de", "https://www.autouncle.de/de/d/225298031-gebraucht-2025-hyundai-ioniq-5-techniq-228-ps", "225298031"],
    ["www.autouncle.de", "https://www.autouncle.de/de/das_wiedersehen/auto-bayer-de/225298031/415105191?ref=x", "225298031"]
  ];
  for (const [host, href, id] of cases) {
    assert.equal(L.listingKey(L.listingSite(host), href), id, href);
  }
});

test("listingKey rejects non-listing links", () => {
  assert.equal(L.listingKey(L.listingSite("suchen.mobile.de"), "https://suchen.mobile.de/auto/hyundai-ioniq-5-2023.html"), null);
  assert.equal(L.listingKey(L.listingSite("www.autoscout24.de"), "https://www.autoscout24.de/haendler/autohaus-koerner-gmbh"), null);
  assert.equal(L.listingKey(L.listingSite("www.autouncle.de"), "https://www.autouncle.de/de/gebrauchtwagen/Hyundai/Ioniq-5"), null);
});

test("listingSite ignores news hosts", () => {
  assert.equal(L.listingSite("www.spiegel.de"), null);
  assert.equal(L.listingSite("notmobile.de"), null);
});
