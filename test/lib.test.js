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
