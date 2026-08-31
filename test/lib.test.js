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
