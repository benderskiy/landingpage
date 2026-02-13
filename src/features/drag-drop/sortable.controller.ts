import Sortable from 'sortablejs';
import { reorderFolders } from '../folder-management/folder-order';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

export function initFolderSortable(): void {
  const mainContainer = document.querySelector<HTMLElement>('main#main');
  if (!mainContainer) {
    console.error('Main container not found for SortableJS');
    return;
  }

  Sortable.create(mainContainer, {
    animation: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.drag-handle',
    draggable: 'nav[data-folder-id]',
    forceFallback: true,

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
