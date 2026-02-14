import Sortable from 'sortablejs';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';
import { refreshFolders } from '../../main';

// Store Sortable instances for each folder
const bookmarkSortableInstances = new Map<HTMLElement, Sortable>();

export function initBookmarkDrag(): void {
  // Clean up existing instances first
  destroyBookmarkDrag();

  // Initialize SortableJS for bookmark items in each folder
  const folders = document.querySelectorAll<HTMLElement>('nav[data-folder-id]');

  folders.forEach((folder) => {
    const folderId = folder.getAttribute('data-folder-id');
    if (!folderId) return;

    // Create Sortable instance for this folder's bookmarks
    const sortableInstance = Sortable.create(folder, {
      group: 'bookmarks', // Allow dragging between folders
      animation: 0,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      draggable: '.bookmark-item', // Only bookmark items are draggable
      handle: '.bookmark-drag-handle', // Only drag via handle
      filter: '.folder-header, .create-folder-card', // Exclude these elements
      forceFallback: true,
      fallbackOnBody: true,
      swapThreshold: 0.65,

      // Note: Do NOT manipulate opacity in onStart/onEnd
      // The CSS classes handle all visual feedback to prevent flicker

      onEnd: async (evt) => {

        // Get bookmark and folder information
        const bookmarkId = evt.item.getAttribute('data-bookmark-id');
        const sourceFolderId = evt.from.getAttribute('data-folder-id');
        const targetFolderId = evt.to.getAttribute('data-folder-id');

        if (!bookmarkId || !targetFolderId) {
          console.error('Missing bookmark or folder ID');
          return;
        }

        // Check if anything actually changed
        const positionChanged = evt.oldIndex !== evt.newIndex;
        const folderChanged = sourceFolderId !== targetFolderId;

        if (!positionChanged && !folderChanged) {
          return;
        }

        // Calculate the actual bookmark index (excluding folder header and non-bookmark elements)
        // SortableJS newIndex includes all children, but we need index relative to bookmarks only
        let actualIndex = 0;

        if (evt.newIndex !== undefined) {
          // Count how many bookmark items come before the new position
          for (let i = 0; i < evt.newIndex && i < evt.to.children.length; i++) {
            const child = evt.to.children[i];
            if (child.classList.contains('bookmark-item')) {
              actualIndex++;
            }
          }
        }

        try {
          // Move bookmark to new position/folder
          await chrome.bookmarks.move(bookmarkId, {
            parentId: targetFolderId,
            index: actualIndex,
          });

          if (folderChanged) {
            showSuccessMessage('Bookmark moved to another folder');
            // Refresh only when moving between folders to update counts
            await refreshFolders();
          } else {
            showSuccessMessage('Bookmark reordered');
            // Don't refresh when reordering within same folder - DOM is already correct
          }
        } catch (error) {
          console.error('Failed to move bookmark:', error);
          showErrorMessage('Failed to move bookmark');

          // Revert the DOM change on error
          if (evt.from === evt.to && typeof evt.oldIndex === 'number' && typeof evt.newIndex === 'number') {
            const items = Array.from(evt.to.children);
            const item = items[evt.newIndex];
            if (item && items[evt.oldIndex]) {
              evt.to.insertBefore(item, items[evt.oldIndex]);
            }
          } else if (evt.from !== evt.to) {
            // Move back to original folder
            evt.from.appendChild(evt.item);
          }
        }
      },
    });

    // Store instance for cleanup
    bookmarkSortableInstances.set(folder, sortableInstance);
  });
}

export function destroyBookmarkDrag(): void {
  // Destroy all Sortable instances
  bookmarkSortableInstances.forEach((instance, folder) => {
    instance.destroy();

    // Clean up any leftover styling
    const bookmarks = folder.querySelectorAll<HTMLElement>('.bookmark-item');
    bookmarks.forEach((bookmark) => {
      bookmark.style.opacity = '1';
    });
  });

  bookmarkSortableInstances.clear();
}

export function toggleBookmarkDrag(enabled: boolean): void {
  if (enabled) {
    initBookmarkDrag();
  } else {
    destroyBookmarkDrag();
  }
}
