<h1 align="center">Landingpage</h1>

<p align="center">
  <img src="icons/icon128.png" alt="Landingpage Icon" width="128" height="128">
</p>


<p align="center">
  Replace your Chrome new tab with a beautiful, organized bookmark dashboard featuring fuzzy search and drag-and-drop organization.
</p>

## Features

- Visual bookmark cards organized by folder
- Fuzzy search across all bookmarks (powered by Fuse.js)
- **Instant search** - Just start typing on the new tab page
- **Omnibox search** - Type `lp` + Tab in address bar to search bookmarks
- Drag-and-drop folder and bookmark reordering
- Edit mode for managing bookmarks
- Create and delete folders
- Rename bookmarks and folders inline
- Light and dark mode support

## Installation

### Quick Install (Recommended)

1. **[Download landingpage-extension.zip](https://github.com/benderskiy/landingpage/releases/latest/download/landingpage-extension.zip)**
2. Extract the zip file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked**
6. Select the extracted folder
7. Open a new tab to see your bookmarks dashboard

### Build from Source

1. Clone the repository
   ```bash
   git clone https://github.com/benderskiy/landingpage.git
   cd landingpage
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Build the extension
   ```bash
   npm run build
   ```

4. Load in Chrome
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` directory

5. Open a new tab to see your bookmarks

## Usage

### Searching Bookmarks

**On the new tab page:**
- Just start typing anywhere - the search activates automatically
- Press Enter to open the first result

**From any tab (Omnibox):**
1. Type `lp` in the address bar
2. Press Tab (you'll see "Search bookmarks for:")
3. Type your search query
4. Select a bookmark from suggestions or press Enter

### Edit Mode

Click the "Edit" button to:
- Drag and drop folders to reorder
- Drag bookmarks between folders
- Rename folders and bookmarks (click on title)
- Delete folders and bookmarks
- Create new folders

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

```
src/
├── features/          # Feature modules (organized by domain)
│   ├── bookmark-management/
│   ├── drag-drop/
│   ├── folder-management/
│   ├── search/
│   └── edit-mode.ts
├── services/          # Data fetching and storage
├── ui/                # UI utilities and rendering
│   ├── renderers/
│   └── notifications.ts
├── state/             # Application state management
├── types/             # TypeScript type definitions
├── background.ts      # Omnibox search service worker
├── constants.ts       # Centralized constants
└── main.ts            # Entry point and orchestration
```

## Tech Stack

- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast builds
- **Fuse.js** - Fuzzy search
- **SortableJS** - Drag & drop
- **Chrome Extension APIs** - Manifest V3

## License

MIT License

## Acknowledgments

- [Fuse.js](https://fusejs.io/) for fuzzy search
- [SortableJS](https://sortablejs.github.io/Sortable/) for drag & drop
