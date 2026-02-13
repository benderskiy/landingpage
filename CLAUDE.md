# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome/Chromium browser extension (Manifest V3) that replaces the new tab page with an organized bookmark dashboard featuring fuzzy search functionality.

## Architecture

**Chrome Extension Structure:**
- `manifest.json` - Defines extension as a new tab override with bookmarks, history, and favicon permissions
- `src/index.html` - Entry point that loads when opening a new tab
- `src/js/main.js` - Main application logic (vanilla JS with jQuery)
- `src/css/main.css` - Custom styles
- `src/css/normalize.css` - CSS reset
- `icons/` - Extension icons (16x16, 48x48, 128x128)

**Key Dependencies:**
- jQuery 3.3.1 (DOM manipulation)
- Fuse.js (fuzzy search implementation)

**Data Flow:**
1. On new tab open, `getBookmarks()` fetches the Chrome bookmarks tree and recent history
2. `_getFolders()` recursively processes the bookmark tree, filtering out folders in the `IGNORED` array
3. Bookmarks are organized by folder and rendered as card-based navigation elements
4. Search is initialized with Fuse.js for fuzzy matching on bookmark titles and URLs

**Chrome APIs Used:**
- `chrome.bookmarks.getTree()` - Retrieves entire bookmark hierarchy
- `chrome.history.search()` - Gets recent browsing history (currently commented out in UI)
- `chrome.runtime.getURL("/_favicon/")` - Generates favicon URLs for bookmarks

**Filtering Behavior:**
- The `IGNORED` constant in main.js:2 defines bookmark folders to exclude from display
- Default ignored folders: "SAP IT Links", "SAP Links", "Concur Links"

## Development Workflow

**Building the Extension:**
- **CRITICAL**: Always run `npm run build` after making any code changes (TypeScript, HTML, CSS)
- The build process compiles TypeScript, bundles with Vite, and copies files to the `dist/` directory
- Build command: `npm run build`
- Type checking only (no build): `npm run type-check`

**Testing the Extension:**
1. **Build first**: Run `npm run build` to compile and bundle the extension
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the **`dist/` directory** (not the repository root)
6. Open a new tab to see changes
7. After code changes: Run `npm run build` again → Click reload icon on extension card → Refresh new tab

**Debugging:**
- Right-click on the new tab page and select "Inspect" to open DevTools
- Console logs and errors appear in the DevTools console
- Chrome bookmarks API calls can be tested in the console

## Code Conventions

**jQuery Usage:**
- Global jQuery objects are prefixed with `$` (e.g., `$container`, `$link`)
- Event handlers use jQuery's `.on()` method

**Bookmark Structure:**
- Folders are objects with `info` (metadata) and `links` (array of bookmarks)
- Each link has `title`, `url`, and optionally other Chrome bookmark properties

**Rendering Pattern:**
- The `renderFolders()` function clears and re-renders the entire bookmark grid
- Called on initial load and after each search query change
- Each folder becomes a `<nav>` element with an `<h1>` title and bookmark `<a>` links

**Search Implementation:**
- Fuzzy search threshold is 0.3 (configurable in Fuse.js options)
- Pressing Enter in search field opens the first matched bookmark
- Empty search returns all bookmarks
