# Chrome Web Store listing

## Name

Already

## Short description (max 132 chars)

Fades news teasers you have already seen. Counts real sightings,
then dims or hides them. 100% local.

## Category / language

Productivity (or News) / English

## Detailed description

Scanning the same news homepage all day means re-reading the same
teasers over and over. Already remembers what you have actually
seen and fades it out, so only the new survives.

HOW IT WORKS
- A teaser counts as "seen" only when it was really on screen:
  at least half visible for a dwell time you control.
- After a configurable number of sightings without a click, the
  teaser is dimmed (hover restores it) or hidden entirely.
- Articles you click or open are faded immediately.

YOU STAY IN CONTROL
- Works only on sites you enable, one by one.
- Tune sightings threshold, dwell time, fade mode, and how long
  data is kept. Wipe a site's data anytime.
- The popup shows live counts: tracked and faded per site.

PRIVATE BY DESIGN
- Everything stays in your browser's local storage.
- No accounts, no servers, no analytics, no tracking. The
  extension makes zero network requests.

## Permission justifications (dashboard fields)

- storage: saves per-site sighting counts and your settings
  locally.
- alarms: daily cleanup that deletes data older than your
  retention setting.
- scripting: registers the content script on exactly the sites
  you enable.
- activeTab: reads the current tab's hostname when you open the
  popup, to show and toggle that site.
- Host permissions (optional, per site): requested only when you
  enable a site; revoked when you disable it.

## Privacy practices

Already does not collect, transmit, or sell any user data. All
data (per-site article sighting counts, settings) is stored in
chrome.storage.local on the user's device and never leaves the
browser. No remote code is loaded.

## Single purpose

Fade news-site teasers the user has already seen.

## Assets

- Icon 128: icons/icon128.png
- Screenshots 1280x800: store-assets/screenshot-1.png,
  store-assets/screenshot-2.png
