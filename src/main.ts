import 'modern-normalize/modern-normalize.css';
import './css/main.css';

// Module imports
import { Bookmark, Folder } from './types';
import { AppState } from './state/app-state';
import { getBookmarks } from './services/bookmarks.service';
import { loadFolderOrder } from './services/storage.service';
import { getFaviconUrl, debounce } from './ui/utils';
import { showSuccessMessage, showErrorMessage, showLoading } from './ui/notifications';
import { applyFolderOrder } from './features/folder-management/folder-order';
import { initSearch } from './features/search/search.controller';
import { initFolderSortable } from './features/drag-drop/sortable.controller';
import { initBookmarkDrag } from './features/drag-drop/bookmark-drag';

// Rendering Functions
function renderLinks(links: Bookmark[], container: HTMLElement): void {
  links.forEach((link) => {
    // Create wrapper div for bookmark + delete button
    const bookmarkWrapper = document.createElement('div');
    bookmarkWrapper.className = 'bookmark-item';
    bookmarkWrapper.dataset.bookmarkId = link.id || '';

    // Create the link element
    const linkElement = document.createElement('a');
    linkElement.textContent = link.title || '';
    linkElement.href = link.url || '';

    // Create favicon
    const favicon = document.createElement('img');
    favicon.height = 16;
    favicon.width = 16;
    favicon.src = getFaviconUrl(link.url || '');
    favicon.onerror = (): void => {
      favicon.style.display = 'none';
    };

    linkElement.prepend(favicon);

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.innerHTML = '×';
    deleteButton.setAttribute('aria-label', `Delete ${link.title}`);
    deleteButton.type = 'button';
    deleteButton.tabIndex = -1;

    // Attach delete handler
    deleteButton.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (link.id) {
        await handleDeleteBookmark(link.id, bookmarkWrapper);
      }
    });

    // Assemble the structure
    bookmarkWrapper.appendChild(linkElement);
    bookmarkWrapper.appendChild(deleteButton);
    container.appendChild(bookmarkWrapper);
  });
}

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
    }, 300);
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

function renderFoldersToContainer(folders: Folder[], container: HTMLElement): void {
  folders.forEach((folder) => {
    const folderNav = document.createElement('nav');

    // Add data attribute for folder ID
    folderNav.dataset.folderId = folder.info.id;

    // Create folder header with drag handle
    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';

    // Create drag handle (div instead of button for reliable dragging)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.setAttribute('role', 'button');
    dragHandle.setAttribute('tabindex', '0');
    dragHandle.setAttribute('aria-label', `Drag to reorder ${folder.info.title || 'folder'}`);

    const dragIcon = document.createElement('span');
    dragIcon.className = 'drag-handle-icon';
    dragIcon.textContent = '⋮⋮';
    dragHandle.appendChild(dragIcon);

    // Create folder title
    const title = document.createElement('h1');
    title.textContent = folder.info.title || '';
    title.className = 'folder-title';

    // Assemble header
    folderHeader.appendChild(dragHandle);
    folderHeader.appendChild(title);
    folderNav.appendChild(folderHeader);

    renderLinks(folder.links, folderNav);

    container.appendChild(folderNav);
  });

  // Render create folder card
  renderCreateFolderCard(container);
}

function renderFolders(folders: Folder[]): void {
  const main = document.querySelector<HTMLElement>('main#main');
  if (!main) return;

  main.innerHTML = '';

  if (folders.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <p>No bookmarks found</p>
      </div>
    `;
    return;
  }

  renderFoldersToContainer(folders, main);

  // Highlight first bookmark as selected
  const firstBookmark = main.querySelector<HTMLElement>('.bookmark-item');
  if (firstBookmark) {
    firstBookmark.classList.add('selected');
  }

  // Announce results for screen readers
  const resultsStatus = document.getElementById('results-status');
  if (resultsStatus) {
    const count = folders.reduce((sum, f) => sum + f.links.length, 0);
    resultsStatus.textContent = `Found ${count} bookmarks in ${folders.length} folders`;
  }
}

export async function refreshFolders(): Promise<void> {
  const appState = AppState.getInstance();

  const bookmarks = await getBookmarks();
  appState.bookmarksData = bookmarks;

  const orderedBookmarks = applyFolderOrder(bookmarks);
  renderFolders(orderedBookmarks.folders);
  initSearch(bookmarks, renderFolders, debounce);

  // Reinitialize drag & drop after refresh
  setTimeout(() => {
    initFolderSortable();
    initBookmarkDrag();
  }, 100);
}

// Folder Creation UI
function renderCreateFolderCard(container: HTMLElement): void {
  const createCard = document.createElement('div');
  createCard.className = 'folder-create-card';
  createCard.innerHTML = `
    <button type="button" class="create-folder-btn" aria-label="Create new folder">
      <svg class="create-folder-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        <line x1="12" y1="11" x2="12" y2="17"></line>
        <line x1="9" y1="14" x2="15" y2="14"></line>
      </svg>
      <span class="create-folder-label">Create Folder</span>
    </button>
    <div class="create-folder-form hidden">
      <input type="text" class="folder-name-input" placeholder="Folder name" maxlength="100" aria-label="Folder name">
      <div class="form-actions">
        <button type="button" class="btn-confirm">Create</button>
        <button type="button" class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  container.appendChild(createCard);

  const createBtn = createCard.querySelector<HTMLButtonElement>('.create-folder-btn');
  const input = createCard.querySelector<HTMLInputElement>('.folder-name-input');
  const confirmBtn = createCard.querySelector<HTMLButtonElement>('.btn-confirm');
  const cancelBtn = createCard.querySelector<HTMLButtonElement>('.btn-cancel');

  createBtn?.addEventListener('click', () => showCreateFolderForm(createCard));
  confirmBtn?.addEventListener('click', () => handleCreateFolder(input!, createCard));
  cancelBtn?.addEventListener('click', () => hideCreateFolderForm(createCard));

  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCreateFolder(input, createCard);
    } else if (e.key === 'Escape') {
      hideCreateFolderForm(createCard);
    }
  });
}

function showCreateFolderForm(card: HTMLElement): void {
  const btn = card.querySelector('.create-folder-btn');
  const form = card.querySelector<HTMLElement>('.create-folder-form');
  const input = card.querySelector<HTMLInputElement>('.folder-name-input');

  btn?.classList.add('hidden');
  form?.classList.remove('hidden');
  input?.focus();
}

function hideCreateFolderForm(card: HTMLElement): void {
  const btn = card.querySelector('.create-folder-btn');
  const form = card.querySelector<HTMLElement>('.create-folder-form');
  const input = card.querySelector<HTMLInputElement>('.folder-name-input');

  form?.classList.add('hidden');
  btn?.classList.remove('hidden');
  if (input) input.value = '';
}

async function handleCreateFolder(input: HTMLInputElement, card: HTMLElement): Promise<void> {
  const folderName = input.value.trim();

  if (!folderName) {
    input.focus();
    showErrorMessage('Folder name cannot be empty');
    return;
  }

  if (folderName.length > 100) {
    showErrorMessage('Folder name is too long (max 100 characters)');
    return;
  }

  try {
    const confirmBtn = card.querySelector<HTMLButtonElement>('.btn-confirm');
    const cancelBtn = card.querySelector<HTMLButtonElement>('.btn-cancel');
    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    input.disabled = true;

    const ROOT_FOLDER_ID = '1'; // Bookmarks Bar

    const newFolder = await chrome.bookmarks.create({
      parentId: ROOT_FOLDER_ID,
      title: folderName,
    });

    console.log('Created folder:', newFolder);

    hideCreateFolderForm(card);
    await refreshFolders();
    showSuccessMessage(`Folder "${folderName}" created successfully`);
  } catch (error) {
    console.error('Failed to create folder:', error);
    showErrorMessage('Failed to create folder. Please try again.');

    const confirmBtn = card.querySelector<HTMLButtonElement>('.btn-confirm');
    const cancelBtn = card.querySelector<HTMLButtonElement>('.btn-cancel');
    if (confirmBtn) confirmBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    input.disabled = false;
  }
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
    renderFolders(orderedBookmarks.folders);
    initSearch(bookmarks, renderFolders, debounce);

    // Initialize drag & drop
    // Use setTimeout to ensure DOM is fully rendered before initializing
    setTimeout(() => {
      initFolderSortable(); // SortableJS for folder reordering
      initBookmarkDrag(); // Native drag for moving bookmarks between folders
    }, 100);
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorMessage('Failed to load bookmarks. Please reload the page.');
  }
});
