import { AppState } from '../state/app-state';
import { toggleFolderSortable } from './drag-drop/folder-drag';
import { toggleBookmarkDrag } from './drag-drop/bookmark-drag';
import { renderCreateFolderCard } from './folder-management/folder-creation';
import { refreshFolders } from '../main';

export function toggleEditMode(enabled: boolean): void {
  const appState = AppState.getInstance();
  appState.editMode = enabled;

  // Update body class for CSS styling
  if (enabled) {
    document.body.classList.add('edit-mode');

    // Disable all bookmark links by removing href
    const bookmarkLinks = document.querySelectorAll<HTMLAnchorElement>('.bookmark-item a');
    bookmarkLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        link.dataset.originalHref = href;
        link.removeAttribute('href');
        link.style.cursor = 'text';
      }
    });

    // Add create folder button if not exists
    const mainContainer = document.querySelector<HTMLElement>('main#main');
    if (mainContainer && !mainContainer.querySelector('.folder-create-card')) {
      renderCreateFolderCard(mainContainer, refreshFolders);
    }
  } else {
    document.body.classList.remove('edit-mode');

    // Re-enable all bookmark links by restoring href
    const bookmarkLinks = document.querySelectorAll<HTMLAnchorElement>('.bookmark-item a');
    bookmarkLinks.forEach((link) => {
      const originalHref = link.dataset.originalHref;
      if (originalHref) {
        link.setAttribute('href', originalHref);
        link.removeAttribute('data-original-href');
        link.style.cursor = '';
      }
    });

    // Remove create folder button
    const createCard = document.querySelector('.folder-create-card');
    if (createCard) {
      createCard.remove();
    }
  }

  // Toggle drag & drop functionality
  toggleFolderSortable(enabled);
  toggleBookmarkDrag(enabled);

  // Update button aria-pressed state
  const toggleButton = document.querySelector<HTMLButtonElement>('#edit-mode-toggle');
  if (toggleButton) {
    toggleButton.setAttribute('aria-pressed', enabled.toString());
  }
}

export function initEditModeToggle(): void {
  const toggleButton = document.querySelector<HTMLButtonElement>('#edit-mode-toggle');
  if (!toggleButton) {
    console.error('Edit mode toggle button not found');
    return;
  }

  toggleButton.addEventListener('click', () => {
    const appState = AppState.getInstance();
    const newState = !appState.editMode;
    toggleEditMode(newState);
  });
}
