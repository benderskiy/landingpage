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
    animation: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    fallbackClass: 'sortable-fallback',
    handle: '.drag-handle',
    draggable: 'nav[data-folder-id]',
    forceFallback: true,
    fallbackOnBody: true,
    swapThreshold: 0.65,

    onStart: (evt) => {
      evt.item.classList.add('dragging');
    },

    onEnd: async (evt) => {
      evt.item.classList.remove('dragging');

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

        if (evt.from === evt.to && typeof evt.oldIndex === 'number') {
          const items = Array.from(evt.from.children);
          const item = items[evt.newIndex!];
          evt.from.insertBefore(item, items[evt.oldIndex]);
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
