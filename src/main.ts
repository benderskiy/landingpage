import 'modern-normalize/modern-normalize.css';
import './css/main.css';

// Module imports
import { AppState } from './state/app-state';
import { DOM_INIT_DELAY } from './constants';
import { getBookmarks } from './services/bookmarks.service';
import { loadFolderOrder } from './services/storage.service';
import { debounce } from './ui/utils';
import { showErrorMessage, showLoading } from './ui/notifications';
import { renderFolders } from './ui/renderers/folder-renderer';
import { renderCreateFolderCard } from './features/folder-management/folder-creation';
import { applyFolderOrder } from './features/folder-management/folder-order';
import { initSearch } from './features/search/search';
import { initFolderSortable } from './features/drag-drop/folder-drag';
import { initBookmarkDrag } from './features/drag-drop/bookmark-drag';
import { initEditModeToggle } from './features/edit-mode';

export async function refreshFolders(): Promise<void> {
  const appState = AppState.getInstance();

  const bookmarks = await getBookmarks();
  appState.bookmarksData = bookmarks;

  const orderedBookmarks = applyFolderOrder(bookmarks);
  renderFolders(orderedBookmarks.folders, false, (container) => renderCreateFolderCard(container, refreshFolders));
  initSearch(bookmarks, (folders, isSearchResult) => {
    renderFolders(folders, isSearchResult, (container) => renderCreateFolderCard(container, refreshFolders));
  }, debounce);

  // Reinitialize drag & drop after refresh ONLY if edit mode is active
  setTimeout(() => {
    if (appState.editMode) {
      initFolderSortable();
      initBookmarkDrag();
    }
  }, DOM_INIT_DELAY);
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();

  try {
    const appState = AppState.getInstance();

    // Load folder order from storage
    appState.folderOrder = await loadFolderOrder();

    const bookmarks = await getBookmarks();
    appState.bookmarksData = bookmarks;

    const orderedBookmarks = applyFolderOrder(bookmarks);
    renderFolders(orderedBookmarks.folders, false, (container) => renderCreateFolderCard(container, refreshFolders));
    initSearch(bookmarks, (folders, isSearchResult) => {
      renderFolders(folders, isSearchResult, (container) => renderCreateFolderCard(container, refreshFolders));
    }, debounce);

    // Initialize edit mode toggle (drag & drop disabled by default)
    // Use setTimeout to ensure DOM is fully rendered before initializing
    setTimeout(() => {
      initEditModeToggle();
    }, DOM_INIT_DELAY);

    // Remove selected state when tab key is used for navigation
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const selectedBookmark = document.querySelector('.bookmark-item.selected');
        if (selectedBookmark) {
          selectedBookmark.classList.remove('selected');
        }
      }
    });

    // Auto-focus search when typing anywhere on the page
    // This allows users to just start typing without clicking the search field
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const searchInput = document.querySelector<HTMLInputElement>('#site-search');
      if (!searchInput) return;

      // Skip if already focused on an input or if modifier keys are pressed
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      if (isInputFocused || e.ctrlKey || e.metaKey || e.altKey) return;

      // Skip special keys
      const skipKeys = ['Tab', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'];
      if (skipKeys.includes(e.key)) return;

      // Focus search and let the key event pass through
      searchInput.focus();
    });
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorMessage('Failed to load bookmarks. Please reload the page.');
  }
});
