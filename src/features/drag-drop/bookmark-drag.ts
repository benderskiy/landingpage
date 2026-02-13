import { moveBookmark } from '../../services/chrome-api.service';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';
import { AppState } from '../../state/app-state';
import { refreshFolders } from '../../main';

export function initBookmarkDrag(): void {
  const bookmarkItems = document.querySelectorAll<HTMLElement>('.bookmark-item');

  bookmarkItems.forEach((item) => {
    const bookmarkId = item.dataset.bookmarkId;
    if (!bookmarkId) return;

    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', (e: DragEvent) => {
      const appState = AppState.getInstance();
      appState.dragState.draggedElement = item;
      appState.dragState.draggedType = 'bookmark';
      appState.dragState.draggedId = bookmarkId;

      const parentNav = item.closest('nav[data-folder-id]');
      if (parentNav) {
        appState.dragState.sourceParentId = parentNav.getAttribute('data-folder-id');
      }

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.innerHTML);
      }

      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
      const appState = AppState.getInstance();
      appState.resetDragState();
    });
  });

  // Setup folder drop zones for bookmarks
  const folders = document.querySelectorAll<HTMLElement>('nav[data-folder-id]');
  folders.forEach((folder) => {
    folder.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      const appState = AppState.getInstance();

      if (appState.dragState.draggedType === 'bookmark') {
        folder.classList.add('bookmark-drop-target');
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }
      }
    });

    folder.addEventListener('dragleave', () => {
      folder.classList.remove('bookmark-drop-target');
    });

    folder.addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      folder.classList.remove('bookmark-drop-target');

      const appState = AppState.getInstance();
      const draggedId = appState.dragState.draggedId;
      const sourceParentId = appState.dragState.sourceParentId;
      const targetFolderId = folder.getAttribute('data-folder-id');

      if (
        appState.dragState.draggedType === 'bookmark' &&
        draggedId &&
        targetFolderId &&
        sourceParentId !== targetFolderId
      ) {
        try {
          await moveBookmark(draggedId, { parentId: targetFolderId });
          showSuccessMessage('Bookmark moved successfully');

          // Refresh the folders to show the bookmark in its new location
          await refreshFolders();
        } catch (error) {
          console.error('Failed to move bookmark:', error);
          showErrorMessage('Failed to move bookmark');
        }
      }

      appState.resetDragState();
    });
  });
}
