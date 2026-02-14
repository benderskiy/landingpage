import Sortable from 'sortablejs';
import { reorderFolders } from '../folder-management/folder-order';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

// Store the Sortable instance
let sortableInstance: Sortable | null = null;

export function initFolderSortable(): void {
  // Destroy existing instance if any
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  const mainContainer = document.querySelector<HTMLElement>('main#main');
  if (!mainContainer) {
    console.error('Main container not found for SortableJS');
    return;
  }

  sortableInstance = Sortable.create(mainContainer, {
    animation: 0,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.drag-handle',
    draggable: 'nav[data-folder-id]',
    forceFallback: true,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    direction: 'vertical',

    // Note: Do NOT manipulate opacity/visibility in onStart/onEnd
    // The CSS classes (sortable-chosen, sortable-ghost) handle all visual feedback
    // Inline style changes cause flickering when combined with CSS

    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) {
        return;
      }

      const folders = mainContainer.querySelectorAll<HTMLElement>('nav[data-folder-id]');
      const newOrder = Array.from(folders).map(folder => folder.dataset.folderId!);

      try {
        await reorderFolders(newOrder);
        showSuccessMessage('Folder reordered successfully');
      } catch (error) {
        console.error('Failed to save folder order:', error);
        showErrorMessage('Failed to save folder order');

        // Revert DOM order on error
        if (evt.from === evt.to && typeof evt.oldIndex === 'number' && typeof evt.newIndex === 'number') {
          const items = Array.from(evt.from.children);
          const item = items[evt.newIndex];
          const targetItem = items[evt.oldIndex];
          if (item && targetItem) {
            evt.from.insertBefore(item, targetItem);
          }
        }
      }
    },
  });
}

export function destroyFolderSortable(): void {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

export function toggleFolderSortable(enabled: boolean): void {
  if (enabled) {
    initFolderSortable();
  } else {
    destroyFolderSortable();
  }
}
