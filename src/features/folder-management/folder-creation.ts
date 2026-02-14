import { ROOT_FOLDER_ID } from '../../constants';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

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

async function handleCreateFolder(
  input: HTMLInputElement,
  card: HTMLElement,
  onFolderCreated: () => Promise<void>
): Promise<void> {
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

    const newFolder = await chrome.bookmarks.create({
      parentId: ROOT_FOLDER_ID,
      title: folderName,
    });

    console.log('Created folder:', newFolder);

    hideCreateFolderForm(card);
    await onFolderCreated();
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

export function renderCreateFolderCard(
  container: HTMLElement,
  onFolderCreated: () => Promise<void>
): void {
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
  confirmBtn?.addEventListener('click', () => handleCreateFolder(input!, createCard, onFolderCreated));
  cancelBtn?.addEventListener('click', () => hideCreateFolderForm(createCard));

  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCreateFolder(input, createCard, onFolderCreated);
    } else if (e.key === 'Escape') {
      hideCreateFolderForm(createCard);
    }
  });
}
