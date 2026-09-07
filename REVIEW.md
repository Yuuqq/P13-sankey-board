# Code Review Summary: P13-sankey-board

This document summarizes the findings from a comprehensive review of the `Yuuqq/P13-sankey-board` repository. The findings are categorized by severity and cover architecture, security, reliability, test coverage, performance, and documentation.

## CRITICAL

*(No critical issues found)*

## HIGH

### 1. Reliability (Edge Case Crash): Lack of cyclic graph detection
- **File:** `app.js` (lines 80-107, `draw()` function)
- **Impact:** ECharts Sankey diagrams do not support cyclic dependencies (e.g., A -> B, B -> A). If a user inputs cyclic data, ECharts will fail to render, potentially throwing an error and leaving the user with a blank chart or an unhelpful status, without clear feedback.
- **Fix Suggestion:** Implement a topological sort or simple depth-first search (DFS) to detect cycles before passing the nodes and links to ECharts. If a cycle is detected, abort rendering and display a clear error message via `setStatus()`.

### 2. Test Coverage: Lack of automated tests
- **File:** Entire repository (No `tests/` directory)
- **Impact:** Relying purely on manual testing (`QA.md`) increases the risk of regressions during future updates. Critical logic like regex-based line parsing (`parseLine`) and telemetry collection is currently untested.
- **Fix Suggestion:** Introduce a testing framework (e.g., Jest or Vitest) to test core logic functions (`parseLine`, `parseGraph`), and set up Playwright or Cypress for E2E user flow testing.

## MEDIUM

### 3. Architecture: Lack of modularity and global scope pollution
- **File:** `app.js`, `pm-metrics.js`
- **Impact:** Both files run in the global scope or expose objects globally (e.g., `window.pmMetrics`, `let chartInstance`, `chartEl`). This makes the codebase harder to maintain, increases the risk of naming collisions, and complicates unit testing.
- **Fix Suggestion:** Wrap the application logic in IIFEs or migrate to ES6 modules (`<script type="module">`). Explicitly pass dependencies rather than relying on the global `window` object.

### 4. Reliability: Silent failure on invalid input lines
- **File:** `app.js` (line 44, `parseLine()`)
- **Impact:** The regex `/^\s*(.+?)\s*->\s*(.+?)\s+([0-9.]+)\s*$/` strictly requires a specific format. If a user makes a typo (e.g., negative values, missing spaces, or non-numeric trailing characters), the line is silently ignored because `parseLine` returns `null` and `filter(Boolean)` drops it. Users get no feedback on why their data wasn't rendered.
- **Fix Suggestion:** Instead of silently filtering out invalid lines, capture them and update the status area (`setStatus`) or show a UI warning listing the lines that could not be parsed.

### 5. Performance: Un-debounced window resize handler
- **File:** `app.js` (line 67, `window.addEventListener("resize", ... )`)
- **Impact:** The `resize` event fires continuously while the browser window is being resized. Calling `chartInstance?.resize()` on every fire can lead to layout thrashing and high CPU usage.
- **Fix Suggestion:** Wrap the `chartInstance?.resize()` call in a debounce function (e.g., triggering only after 150-250ms of inactivity).

### 6. Security / Privacy: Raw URI Hash and Pathname in Telemetry
- **File:** `pm-metrics.js` (line 46)
- **Impact:** The payload includes `page_path: location.pathname + location.hash`. If this payload is sent to a dashboard and rendered insecurely, it could present an XSS vector. While not explicitly an XSS locally, it is an unsafe default for data collection.
- **Fix Suggestion:** Sanitize or truncate `location.hash` before adding it to the telemetry payload, or remove it entirely if not strictly necessary for analytics.

### 7. Documentation / DX: Missing Local Development Setup
- **File:** `README.md`
- **Impact:** The `sw.js` (Service Worker) and some browser APIs behave differently or are blocked when opened via the `file://` protocol. The README lacks instructions on how to properly serve the project locally for development.
- **Fix Suggestion:** Add a "Local Development" section in `README.md` advising contributors to use a local HTTP server (e.g., `npx serve .` or `python -m http.server`).

## LOW

### 8. Architecture: Fragile dependency paths
- **File:** `index.html` (lines 10, 52, 60), `sw.js` (lines 14, 15)
- **Impact:** The project hardcodes paths to `../shared/` (e.g., `../shared/design-tokens.css`). This tightly couples the tool to a specific monorepo structure. If the tool is deployed independently, it will break.
- **Fix Suggestion:** If `shared` is truly shared, consider publishing it as an npm package or using Git submodules, and bundle the assets using a build step, rather than relying on relative directory traversal out of the project root.

### 9. Reliability: Blind error swallowing in Service Worker installation
- **File:** `sw.js` (line 21)
- **Impact:** The service worker silently catches errors when caching optional files `cache.add(url).catch(() => {})`. If critical assets fail to load due to network issues, developers have no visibility into the issue during debugging.
- **Fix Suggestion:** Add a `console.warn` inside the `.catch()` block to log which specific asset failed to cache.
