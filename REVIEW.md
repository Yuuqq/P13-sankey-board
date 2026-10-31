# Code Review Status: P13-sankey-board

Status after the third-pass fixes. This is not a full audit of `styles.css` or of every file loaded by `../shared/releases/v2.6/loader.js`. Line numbers match the tree that contains this file.

Run `node tests/graph.test.js` for the parser and cycle checks.

## Resolved

### Cyclic input, self-loops, duplicate edges, empty names, non-positive values
- **File:** `graph.js` (`parseLine` line 12, `parseGraphText` line 26, `hasCycle` line 77); `app.js` (`draw` line 135, `invalidateChart` line 72)
- **Behavior:** `#` comments are skipped. `1.2.3`, `.`, `.5`, negatives, and `value <= 0` are invalid lines. Empty names (`A ->   100`) are invalid. Self-loops increment `selfLoopCount` and are included in the status warning, including when they are the only input. Duplicate `source → target` values are summed with a nested `Map`, so `A::B -> C` and `A -> B::C` stay distinct. Cycles abort rendering. Failure, including a cycle or an empty graph, disposes the chart and blocks SVG/PNG export until the next successful draw.

### Invalid lines are reported
- **File:** `graph.js` `issueWarning` line 109; `app.js` `draw` line 135
- **Behavior:** A mix of good and bad lines still draws, and the status counts ignored lines. All-invalid input counts them too, instead of the generic “no relations” line alone.

### Resize
- **File:** `app.js` `bindResize` line 84
- **Behavior:** One `resize` listener, 200ms debounce. Re-creating the chart does not add another listener.

### Service worker cache scope and offline shell
- **File:** `sw.js` lines 13–33 and 63
- **Behavior:** Cache name is `p13-sankey-board-v3`. `activate` deletes only caches with the `p13-sankey-board-` prefix, not every cache on `https://yuuqq.github.io`. Pre-cache includes `echarts.min.js`, `favicon.svg`, `design-tokens.css`, `modern-styles.css`, `tool-chrome.css`, `graph.js`, `loader.js`, and the v2.6 modules declared on `index.html` (`dark`, `cmd`, `toast`, `onboarding`, `pedagogy-p1`, `pedagogy-p2`, `nav`, `kbd`). A failed asset logs `console.warn` and does not fail the others. Non-document fetch failures respond with HTTP 504 instead of `undefined`. Cross-origin requests are not intercepted (the old “network-first for APIs” comment was wrong).

### Dead CSV auto-fill
- **File:** `app.js` (removed)
- **Behavior:** The 500ms IIFE that looked up `#dataInput` and could fill the textarea with CSV is gone.

### Button accessible names
- **File:** `index.html` lines 48–52
- **Behavior:** The draw/export buttons no longer override their Chinese labels with `aria-label="draw"` / `"export Svg"` / `"export Png"`. Print CSS hides `.actions` in `styles.css`.

### Telemetry is not an XSS sink
- **File:** `pm-metrics.js` line 48
- **Behavior:** `page_path` is `location.pathname + location.hash`, stored with `localStorage` only. There is no `fetch` or `sendBeacon` in this repo. That is local telemetry, not XSS.

## Open

### SPEC does not match the page
- **File:** `SPEC.md`; noted in `QA.md`
- **Impact:** SPEC still says form input, a node cap, and ECharts from a CDN. The page is a textarea, has no node cap, and loads `../shared/vendor/echarts.min.js` (`index.html` line 66).
- **Severity:** Low

### Offline coverage is the current loader list, not “any future shared file”
- **File:** `sw.js` `CORE_ASSETS`; `index.html` line 70
- **Impact:** Modules the loader adds later will not be pre-cached until `CORE_ASSETS` is updated. `loader.js` itself is not in this repository (`index.html` line 70).
- **Severity:** Low

### No browser-level test runner
- **File:** `tests/graph.test.js`
- **Impact:** Parser and cycle detection have Node assertions. Drawing, export, and the service worker are still manual.
- **Severity:** Low

### Global script, not a module
- **File:** `app.js`, `graph.js`, `pm-metrics.js`
- **Impact:** `graph.js` attaches `window.SankeyGraph`. `app.js` is still a classic script. Fine at this size.
- **Severity:** Low

### Local telemetry has no consent UI
- **File:** `pm-metrics.js` (`page_path` line 48, `document.referrer` in the `page_view` handler)
- **Impact:** Events stay in `localStorage` (capped at 500) and include referrer, path/hash, button text, and status text. The footer claim that nothing is uploaded matches the code. Not an XSS bug.
- **Severity:** Low

## Not reviewed here

`styles.css` polish, and the security of SVG text inside a file the user later re-opens, were not re-audited in this pass.
