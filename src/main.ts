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
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorMessage('Failed to load bookmarks. Please reload the page.');
  }
});
