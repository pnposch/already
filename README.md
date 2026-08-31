# Already

Chromium extension that greys out news teasers you saw already.

It counts how often an article teaser was actually visible on a
news page. After a configurable number of views without a click,
the teaser is dimmed (hover restores it) or hidden. Clicked or
visited articles grey out immediately. All data stays local.

## Install

1. Open `chrome://extensions`, enable Developer mode.
2. "Load unpacked", select this folder.

## Use

1. Open a news site, click the Already toolbar icon.
2. Check "Enable on this site" and grant the permission.
3. Adjust threshold, dwell time, mode, and retention in the popup.
4. "Reset data for this site" clears its history.

## Development

- No build step. Pure logic lives in `lib.js`.
- Tests: `node --test`
- Manual fixture: `python3 -m http.server 8000 --directory test`,
  then enable Already on `http://localhost:8000/fixture.html`.

Design: [spec](docs/superpowers/specs/2026-08-31-already-design.md)
