# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome/Chromium browser extension (Manifest V3) that replaces the new tab page with an organized bookmark dashboard featuring fuzzy search functionality, drag-and-drop organization, and edit mode.

## Architecture

**Chrome Extension Structure (Manifest V3):**
- `manifest.json` - Extension manifest with bookmarks & storage permissions
- `src/index.html` - Entry point loaded on new tab
- `src/main.ts` - Main orchestration layer (~79 lines)
- `src/features/` - Feature modules organized by domain
- `src/services/` - Chrome API wrappers and storage
- `src/ui/` - Rendering and notifications
- `src/constants.ts` - Centralized constants (ROOT_FOLDER_ID, SYSTEM_FOLDERS, etc.)

**Key Dependencies:**
- Fuse.js (fuzzy search)
- SortableJS (drag & drop)
- modern-normalize (CSS reset)
- TypeScript + Vite (build tooling)

**Data Flow:**
1. On new tab, `getBookmarks()` from bookmarks.service.ts fetches Chrome bookmarks tree
2. System folders (defined in SYSTEM_FOLDERS constant) are filtered out
3. Folders are ordered using saved order from chrome.storage.local
4. Bookmarks rendered as card-based navigation via folder-renderer and bookmark-renderer
5. Search initialized with Fuse.js via search.ts

**Chrome APIs Used:**
- `chrome.bookmarks.getTree()` - Retrieves entire bookmark hierarchy
- `chrome.bookmarks.create/update/remove/move()` - Manages bookmarks
- `chrome.storage.local.get/set()` - Persists folder order
- `chrome.runtime.getURL("/_favicon/")` - Generates favicon URLs for bookmarks

**Filtering Behavior:**
- The `SYSTEM_FOLDERS` constant in constants.ts defines bookmark folders to exclude from display
- Default excluded folders: "bookmarks bar", "bookmarks toolbar", "other bookmarks", "mobile bookmarks", "reading list"

## Module Structure

**Feature Modules (`src/features/`):**
- `bookmark-management/rename.ts` - Inline renaming for bookmarks/folders
- `drag-drop/folder-drag.ts` - Folder reordering with SortableJS
- `drag-drop/bookmark-drag.ts` - Bookmark drag between folders
- `folder-management/folder-creation.ts` - Create new folders UI
- `folder-management/folder-deletion.ts` - Delete folders/bookmarks
- `folder-management/folder-order.ts` - Persist folder order
- `search/search.ts` - Fuzzy search with Fuse.js
- `edit-mode.ts` - Toggle edit mode on/off

**Services (`src/services/`):**
- `bookmarks.service.ts` - Fetch and process Chrome bookmarks tree
- `storage.service.ts` - Persist folder order to chrome.storage.local

**UI Layer (`src/ui/`):**
- `renderers/bookmark-renderer.ts` - Render bookmark cards with actions
- `renderers/folder-renderer.ts` - Render folder grid layout
- `notifications.ts` - Toast messages (success, error, loading)
- `utils.ts` - Favicon URLs, debounce utility

**State Management (`src/state/`):**
- `app-state.ts` - Singleton holding bookmarks data, edit mode, drag state, folder order

## Development Workflow

**Building the Extension:**
- **CRITICAL**: Always run `npm run build` after making any code changes (TypeScript, HTML, CSS)
- The build process compiles TypeScript with Vite and copies files to the `dist/` directory
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

**TypeScript:**
- Strict mode enabled (`strict: true`)
- Explicit return types on all functions
- No `any` type usage

**Function Naming Patterns:**
- `handle*()` - Event handlers (e.g., `handleDeleteBookmark`)
- `render*()` - DOM rendering (e.g., `renderFolders`)
- `init*()` - Initialization (e.g., `initSearch`)
- `toggle*()` - State toggles (e.g., `toggleEditMode`)

**File Naming:**
- kebab-case for all files (e.g., `folder-creation.ts`)
- No `.controller` suffix (removed for consistency)

**Bookmark Structure:**
- Folders are objects with `info` (metadata) and `links` (array of bookmarks)
- Each link has `title`, `url`, `id`, and optionally other Chrome bookmark properties

**Rendering Pattern:**
- `renderFolders()` in folder-renderer.ts clears and re-renders the entire bookmark grid
- Called on initial load and after each search query change
- Each folder becomes a `<nav>` element with folder header and bookmark links
- Bookmark rendering delegated to `renderLinks()` in bookmark-renderer.ts

**Search Implementation:**
- Fuzzy search threshold is 0.3 (configurable in Fuse.js options in search.ts)
- Pressing Enter in search field opens the first matched bookmark
- Empty search returns all bookmarks
- Search is debounced (150ms) to reduce Fuse.js calls

**Constants:**
- All magic strings/numbers defined in `/src/constants.ts`
- `ROOT_FOLDER_ID` - Bookmarks Bar folder ID
- `SYSTEM_FOLDERS` - Array of system folder names to filter out
- `STORAGE_KEYS` - Local storage keys used by extension
- `ANIMATION_DURATION`, `DOM_INIT_DELAY` - UI timing constants

## Architecture Documentation

For detailed architecture documentation including data flow diagrams, module responsibilities, and feature deep-dives, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Important Notes

- **Edit Mode**: Users toggle edit mode to enable drag-and-drop and deletion features
- **Drag & Drop**: Uses SortableJS library, not native HTML5 drag-drop
- **State Management**: Singleton pattern in app-state.ts; don't create multiple instances
- **Refreshing**: Call `refreshFolders()` from main.ts after modifying bookmarks to re-render UI
- **Type Safety**: All Chrome API calls use direct calls (no wrapper service layer)
