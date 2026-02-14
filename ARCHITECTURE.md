# Architecture Documentation

## Overview

This Chrome extension (Manifest V3) replaces the new tab page with an organized bookmark dashboard. Built with TypeScript and modern web standards.

## Project Structure

```
landingpage/
├── src/
│   ├── features/          # Feature modules (organized by domain)
│   │   ├── bookmark-management/
│   │   │   └── rename.ts          # Bookmark renaming logic
│   │   ├── drag-drop/
│   │   │   ├── folder-drag.ts     # Folder drag & drop
│   │   │   └── bookmark-drag.ts   # Bookmark drag & drop
│   │   ├── folder-management/
│   │   │   ├── folder-creation.ts # Folder creation UI
│   │   │   ├── folder-deletion.ts # Folder deletion logic
│   │   │   └── folder-order.ts    # Folder ordering persistence
│   │   ├── search/
│   │   │   └── search.ts          # Fuzzy search with Fuse.js
│   │   └── edit-mode.ts           # Edit mode toggle and state
│   ├── services/          # Data fetching and storage
│   │   ├── bookmarks.service.ts   # Chrome bookmarks API wrapper
│   │   └── storage.service.ts     # Chrome storage API wrapper
│   ├── ui/                # UI utilities and rendering
│   │   ├── renderers/
│   │   │   ├── bookmark-renderer.ts # Bookmark card rendering
│   │   │   └── folder-renderer.ts   # Folder grid rendering
│   │   ├── notifications.ts       # Toast messages
│   │   └── utils.ts               # Favicon URLs, debounce
│   ├── state/             # Application state management
│   │   └── app-state.ts           # Singleton state container
│   ├── types/             # TypeScript type definitions
│   │   ├── bookmarks.ts           # Bookmark/Folder types
│   │   ├── state.ts               # State interfaces
│   │   └── index.ts               # Type exports
│   ├── css/
│   │   └── main.css               # All styles (CSS custom properties)
│   ├── constants.ts       # Centralized constants
│   ├── main.ts            # Entry point and orchestration (~79 lines)
│   └── index.html         # HTML template
├── icons/                 # Extension icons (16, 48, 128)
├── manifest.json          # Chrome extension manifest V3
├── dist/                  # Build output (ignored in git)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── fix-paths.cjs          # Post-build path correction
└── README.md              # User-facing documentation
```

## Module Responsibilities

### `/src/features/` - Feature Modules

Organized by domain, each feature handles specific functionality:
- **bookmark-management/** - Renaming bookmarks
- **drag-drop/** - Drag & drop for folders and bookmarks (uses SortableJS)
- **folder-management/** - Creating, deleting, and ordering folders
- **search/** - Fuzzy search implementation (Fuse.js)
- **edit-mode.ts** - Toggle between view and edit modes

### `/src/services/` - Data Layer

- **bookmarks.service.ts** - Fetches Chrome bookmarks tree, filters system folders
- **storage.service.ts** - Persists folder order to chrome.storage.local

### `/src/ui/` - UI Layer

- **renderers/** - DOM rendering functions (bookmarks, folders)
- **notifications.ts** - Toast notification system (success, error, loading)
- **utils.ts** - Favicon URL generation, debounce helper

### `/src/state/` - State Management

- **app-state.ts** - Singleton pattern holding:
  - Current bookmarks data
  - Edit mode state
  - Drag state (coordinates, IDs)
  - Folder order

### `/src/types/` - Type Definitions

- **bookmarks.ts** - `Bookmark`, `Folder`, `BookmarksData` interfaces
- **state.ts** - State interfaces (`FolderOrderState`, `DragState`)

## Data Flow

### 1. Initial Load (DOMContentLoaded)

```
main.ts:41
  → getBookmarks() [bookmarks.service]
    → chrome.bookmarks.getTree()
    → Filter system folders (SYSTEM_FOLDERS constant)
    → Transform to Folder[] structure
  → loadFolderOrder() [storage.service]
    → chrome.storage.local.get()
  → applyFolderOrder() [folder-order]
    → Reorder folders based on saved order
  → renderFolders() [folder-renderer]
    → renderFoldersToContainer()
      → renderLinks() for each folder [bookmark-renderer]
      → renderCreateFolderCard() [folder-creation]
  → initSearch() [search]
    → Initialize Fuse.js with bookmark data
  → initEditModeToggle() [edit-mode]
```

### 2. Search Flow

```
User types in search bar
  → debounced handler (150ms)
  → Fuse.js search
  → renderFolders() with filtered results
  → First bookmark highlighted with .selected class
  → Enter key opens first result
```

### 3. Edit Mode Flow

```
User clicks "Edit" button
  → toggleEditMode(true) [edit-mode]
    → Set AppState.editMode = true
    → Add .edit-mode class to body
    → Disable all bookmark links (remove href)
    → Enable drag & drop (initFolderSortable, initBookmarkDrag)
    → Show delete buttons and drag handles
```

### 4. Drag & Drop Flow (Folders)

```
User drags folder
  → SortableJS onStart [folder-drag]
    → Update AppState.dragState
  → SortableJS onChange
    → Update drag state coordinates
  → SortableJS onEnd
    → Calculate new order
    → saveFolderOrder() [storage.service]
      → chrome.storage.local.set()
    → Reset drag state
```

### 5. Bookmark Deletion Flow

```
User clicks delete button
  → handleDeleteBookmark() [bookmark-renderer]
    → Show confirmation dialog (native confirm)
    → Animate opacity & height
    → chrome.bookmarks.remove()
    → Remove from DOM
    → Check if folder is now empty → remove folder
```

## Chrome Extension Architecture

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "permissions": [
    "bookmarks",
    "storage"
  ]
}
```

### Key Chrome APIs Used

- `chrome.bookmarks.getTree()` - Fetch entire bookmark hierarchy
- `chrome.bookmarks.create()` - Create new folders
- `chrome.bookmarks.remove()` - Delete bookmarks
- `chrome.bookmarks.removeTree()` - Delete folders with contents
- `chrome.bookmarks.update()` - Rename bookmarks/folders
- `chrome.bookmarks.move()` - Reorder bookmarks/folders
- `chrome.storage.local.get/set()` - Persist folder order
- `chrome.runtime.getURL('/_favicon/')` - Get bookmark favicons

### Permissions Justification

- **bookmarks**: Required to read, create, update, and delete bookmarks
- **storage**: Required to remember folder order across sessions

## Build Process

### Build Pipeline

```
npm run build
  → vite build
    - Compile TypeScript to JavaScript
    - Bundle all modules (tree-shaking)
    - Minify code
    - Generate hashed filenames (cache busting)
    - Output to dist/assets/
  → copy-files script
    - Copy manifest.json to dist/
    - Copy icons/ to dist/
    - Move index.html to dist/ root
  → fix-paths.cjs
    - Update asset paths in index.html
```

### Vite Configuration

- Entry point: `src/main.ts`
- Output: `dist/`
- TypeScript: Handled by Vite (esbuild)
- CSS: Bundled and minified
- Source maps: Disabled in production

## Code Conventions

### TypeScript

- **Strict mode enabled** (`strict: true` in tsconfig.json)
- **Explicit return types** on all functions
- **No `any`** type (use generics or proper types)
- **Type imports** separated from value imports

### Naming Conventions

- **Files**: kebab-case (e.g., `folder-creation.ts`)
- **Functions**: camelCase with verb prefix (e.g., `handleDeleteBookmark`, `renderFolders`)
- **Interfaces**: PascalCase (e.g., `Bookmark`, `FolderOrderState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ROOT_FOLDER_ID`, `SYSTEM_FOLDERS`)
- **CSS classes**: kebab-case (e.g., `.bookmark-item`, `.folder-header`)

### Function Naming Patterns

- `handle*()` - Event handlers (e.g., `handleDeleteBookmark`)
- `render*()` - DOM rendering (e.g., `renderFolders`)
- `init*()` - Initialization (e.g., `initSearch`)
- `toggle*()` - State toggles (e.g., `toggleEditMode`)
- `show*/hide*()` - UI visibility (e.g., `showCreateFolderForm`)

### DOM Manipulation

- Use `document.createElement()` for dynamic elements
- Set `className` for CSS classes (not `classList.add` chains)
- Use `dataset.*` for data attributes
- Query with specific types: `document.querySelector<HTMLElement>()`

### Error Handling

```typescript
try {
  await chrome.bookmarks.remove(id);
  showSuccessMessage('Deleted successfully');
} catch (error) {
  console.error('Failed:', error);
  showErrorMessage('Failed to delete. Please try again.');
}
```

### Constants

- All magic strings/numbers in `/src/constants.ts`
- Export as `const` or `as const` for literal types
- Document purpose with JSDoc comments

## Feature Modules Deep Dive

### Search (Fuse.js)

**Configuration:**
```typescript
{
  keys: ['title', 'url'],  // Search in both fields
  threshold: 0.3,          // 0.0 = perfect match, 1.0 = match anything
  ignoreLocation: true     // Search entire string
}
```

**User Experience:**
- Debounced input (150ms delay)
- Highlights first result with `.selected` class
- Enter key opens first result
- Tab key removes highlight

### Drag & Drop (SortableJS)

**Folder Drag:**
- Handle: `.drag-handle` element
- Animation: 150ms
- Ghost class: `.sortable-ghost`
- Persists order to chrome.storage.local

**Bookmark Drag:**
- Handle: `.bookmark-drag-handle`
- Can drag between folders
- Updates Chrome bookmarks tree via `chrome.bookmarks.move()`

### Edit Mode

**Visual Changes:**
- Body gets `.edit-mode` class
- Bookmark links become unclickable (href removed)
- Delete buttons and drag handles appear
- Folder and bookmark titles become editable on click

**State Synchronization:**
- `AppState.editMode` tracks current state
- All event listeners check edit mode before acting
- Exit edit mode restores original hrefs

## Testing Workflow

### Manual Testing Checklist

1. **Load Extension**
   - Build: `npm run build`
   - Load unpacked from `dist/`
   - Open new tab

2. **Core Features**
   - ✓ Bookmarks display organized by folder
   - ✓ Search finds bookmarks (type query)
   - ✓ Enter opens first search result
   - ✓ Clicking bookmark opens URL

3. **Edit Mode**
   - ✓ Toggle edit mode button
   - ✓ Drag folders to reorder
   - ✓ Drag bookmarks between folders
   - ✓ Click folder title to rename
   - ✓ Click bookmark title to rename
   - ✓ Delete bookmark (confirm dialog)
   - ✓ Delete folder (confirm dialog)
   - ✓ Create new folder

4. **Persistence**
   - ✓ Folder order persists after reload
   - ✓ Bookmark changes sync with Chrome bookmarks
   - ✓ Deleted items stay deleted

### Type Checking

```bash
npm run type-check
```
No errors should appear.

### Linting

```bash
npm run lint
```
All files should pass ESLint rules.

## Common Patterns

### Refreshing After Changes

Most operations call `refreshFolders()` after modifying bookmarks:
```typescript
await chrome.bookmarks.create({ ... });
await refreshFolders();  // Re-fetch and re-render
```

### Toast Notifications

```typescript
showSuccessMessage('Folder created');
showErrorMessage('Failed to delete bookmark');
showLoading();  // Shows spinner overlay
```

### Accessing Singleton State

```typescript
const appState = AppState.getInstance();
console.log(appState.editMode);  // Current edit mode state
```

## Performance Considerations

- **Debouncing**: Search input debounced (150ms) to reduce Fuse.js calls
- **Lazy Favicon Loading**: Favicons loaded via `<img>` with `onerror` fallback
- **CSS Transitions**: All animations use CSS (hardware accelerated)
- **Tree Shaking**: Vite removes unused code during build
- **Bundle Size**: ~72KB JS + ~24KB CSS (production)

## Browser Compatibility

- **Chrome**: ✅ 88+ (Manifest V3 support)
- **Edge**: ✅ 88+ (Chromium-based)
- **Firefox**: ❌ (Manifest V3 differences)
- **Safari**: ❌ (No Manifest V3 support)

## Known Limitations

1. **System Folders**: Cannot manage Chrome's built-in folders (Bookmarks Bar, Other Bookmarks, etc.)
2. **Bookmark Bar**: Can only add folders to Bookmarks Bar (ROOT_FOLDER_ID = '1')
3. **Native Dialogs**: Uses browser `confirm()` - cannot be styled

## Future Enhancements

- Custom modal dialogs (replace native confirm)
- Keyboard navigation (arrow keys through bookmarks)
- Bookmark tags/labels
- Export/import bookmark data
- Themes and customization
- Multi-select for bulk operations
