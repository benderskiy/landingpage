import { Folder } from '../../types';
import { AppState } from '../../state/app-state';
import { renderLinks } from './bookmark-renderer';
import { handleRenameFolder } from '../../features/bookmark-management/rename';
import { handleDeleteFolder } from '../../features/folder-management/folder-deletion';

export function renderFoldersToContainer(
  folders: Folder[],
  container: HTMLElement,
  renderCreateFolderCard?: (container: HTMLElement) => void
): void {
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

    // Add click-to-edit in edit mode
    title.addEventListener('click', (e: Event) => {
      const appState = AppState.getInstance();
      if (appState.editMode && folder.info.id) {
        e.preventDefault();
        e.stopPropagation();
        handleRenameFolder(folder.info.id, title);
      }
    });

    // Create folder actions container
    const folderActions = document.createElement('div');
    folderActions.className = 'folder-actions';

    // Create folder delete button
    const deleteFolderBtn = document.createElement('button');
    deleteFolderBtn.className = 'action-btn action-btn-delete';
    deleteFolderBtn.innerHTML = '×';
    deleteFolderBtn.setAttribute('aria-label', `Delete folder ${folder.info.title || ''}`);
    deleteFolderBtn.type = 'button';

    deleteFolderBtn.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (folder.info.id) {
        await handleDeleteFolder(folder.info.id, folderNav, folder.info.title || '');
      }
    });

    folderActions.appendChild(deleteFolderBtn);

    // Assemble header
    folderHeader.appendChild(dragHandle);
    folderHeader.appendChild(title);
    folderHeader.appendChild(folderActions);
    folderNav.appendChild(folderHeader);

    renderLinks(folder.links, folderNav);

    container.appendChild(folderNav);
  });

  // Render create folder card if callback provided
  if (renderCreateFolderCard) {
    renderCreateFolderCard(container);
  }
}

export function renderFolders(
  folders: Folder[],
  isSearchResult: boolean = false,
  createFolderCardCallback?: (container: HTMLElement) => void
): void {
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

  // Only render create folder card if in edit mode
  const appState = AppState.getInstance();
  const shouldRenderCreateCard = appState.editMode ? createFolderCardCallback : undefined;

  renderFoldersToContainer(folders, main, shouldRenderCreateCard);

  // Highlight first bookmark as selected ONLY during search
  if (isSearchResult) {
    const firstBookmark = main.querySelector<HTMLElement>('.bookmark-item');
    if (firstBookmark) {
      firstBookmark.classList.add('selected');
    }
  }

  // Announce results for screen readers
  const resultsStatus = document.getElementById('results-status');
  if (resultsStatus) {
    const count = folders.reduce((sum, f) => sum + f.links.length, 0);
    resultsStatus.textContent = `Found ${count} bookmarks in ${folders.length} folders`;
  }
}
