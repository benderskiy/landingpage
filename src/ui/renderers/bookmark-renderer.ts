import { Bookmark } from '../../types';
import { AppState } from '../../state/app-state';
import { getFaviconUrl } from '../utils';
import { showErrorMessage } from '../notifications';
import { handleRenameBookmark } from '../../features/bookmark-management/rename';
import { ANIMATION_DURATION } from '../../constants';

async function handleDeleteBookmark(bookmarkId: string, element: HTMLElement): Promise<void> {
  try {
    // Confirm deletion
    const bookmark = element.querySelector('a');
    const title = bookmark?.textContent || 'this bookmark';

    if (!confirm(`Delete "${title}"?`)) {
      return;
    }

    // Show deleting state
    element.style.opacity = '0.5';
    element.style.pointerEvents = 'none';

    // Delete via Chrome API
    await chrome.bookmarks.remove(bookmarkId);

    // Animate removal
    element.style.transition = 'opacity 0.3s, max-height 0.3s';
    element.style.opacity = '0';
    element.style.maxHeight = '0';
    element.style.marginTop = '0';
    element.style.marginBottom = '0';

    // Remove from DOM after animation
    setTimeout(() => {
      element.remove();

      // Check if parent folder is now empty
      const parentNav = element.closest('nav');
      if (parentNav) {
        const remainingBookmarks = parentNav.querySelectorAll('.bookmark-item');
        if (remainingBookmarks.length === 0) {
          // Remove empty folder
          parentNav.remove();
        }
      }
    }, ANIMATION_DURATION);
  } catch (error) {
    console.error('Failed to delete bookmark:', error);

    // Restore element state
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';

    // Show error message
    showErrorMessage('Failed to delete bookmark. Please try again.');

    // Auto-hide error after 3 seconds
    setTimeout(() => {
      const errorDiv = document.querySelector('.error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }, 3000);
  }
}

export function renderLinks(links: Bookmark[], container: HTMLElement): void {
  links.forEach((link) => {
    // Create wrapper div for bookmark + delete button
    const bookmarkWrapper = document.createElement('div');
    bookmarkWrapper.className = 'bookmark-item';
    bookmarkWrapper.dataset.bookmarkId = link.id || '';

    // Create drag handle for bookmarks
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle bookmark-drag-handle';
    dragHandle.setAttribute('role', 'button');
    dragHandle.setAttribute('tabindex', '0');
    dragHandle.setAttribute('aria-label', `Drag to reorder ${link.title || 'bookmark'}`);

    const dragIcon = document.createElement('span');
    dragIcon.className = 'drag-handle-icon';
    dragIcon.textContent = '⋮⋮';
    dragHandle.appendChild(dragIcon);

    // Create the link element
    const linkElement = document.createElement('a');
    linkElement.textContent = link.title || '';
    linkElement.href = link.url || '';

    // Prevent navigation in edit mode, enable click-to-edit
    linkElement.addEventListener('click', (e: Event) => {
      const appState = AppState.getInstance();
      if (appState.editMode) {
        e.preventDefault();
        e.stopPropagation();
        if (link.id) {
          handleRenameBookmark(link.id, linkElement);
        }
        return false;
      } else {
        // Show full-page loading overlay when navigating to bookmark
        const overlay = document.createElement('div');
        overlay.className = 'page-loading-overlay';
        overlay.innerHTML = '<div class="page-loading-spinner"></div>';
        document.body.appendChild(overlay);
      }
    });

    // Create favicon
    const favicon = document.createElement('img');
    favicon.height = 16;
    favicon.width = 16;
    favicon.src = getFaviconUrl(link.url || '');
    favicon.onerror = (): void => {
      favicon.style.display = 'none';
    };

    linkElement.prepend(favicon);

    // Create bookmark actions container
    const bookmarkActions = document.createElement('div');
    bookmarkActions.className = 'bookmark-actions';

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-btn action-btn-delete';
    deleteButton.innerHTML = '×';
    deleteButton.setAttribute('aria-label', `Delete ${link.title}`);
    deleteButton.type = 'button';

    // Attach delete handler
    deleteButton.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (link.id) {
        await handleDeleteBookmark(link.id, bookmarkWrapper);
      }
    });

    bookmarkActions.appendChild(deleteButton);

    // Assemble the structure
    bookmarkWrapper.appendChild(dragHandle);
    bookmarkWrapper.appendChild(linkElement);
    bookmarkWrapper.appendChild(bookmarkActions);
    container.appendChild(bookmarkWrapper);
  });
}
