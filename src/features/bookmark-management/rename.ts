import { updateBookmark } from '../../services/chrome-api.service';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

/**
 * Validates a bookmark/folder title
 */
function validateTitle(title: string): { valid: boolean; error?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Title must be 100 characters or less' };
  }

  return { valid: true };
}

/**
 * Converts an element to an editable input field
 */
function makeElementEditable(
  element: HTMLElement,
  currentValue: string,
  onSave: (newValue: string) => Promise<void>,
  onCancel: () => void
): void {
  // Store original element
  const originalElement = element.cloneNode(true) as HTMLElement;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-input';
  input.value = currentValue;

  // Replace element with input
  element.replaceWith(input);

  // Focus and select text
  input.focus();
  input.select();

  let isProcessing = false;

  // Handle save
  const handleSave = async () => {
    if (isProcessing) return;

    const newValue = input.value.trim();

    // Validate
    const validation = validateTitle(newValue);
    if (!validation.valid) {
      showErrorMessage(validation.error || 'Invalid title');
      input.focus();
      input.select();
      return;
    }

    // No change
    if (newValue === currentValue) {
      input.replaceWith(originalElement);
      onCancel();
      return;
    }

    isProcessing = true;
    input.disabled = true;
    input.style.opacity = '0.6';

    try {
      await onSave(newValue);

      // Update the original element with new value
      if (originalElement instanceof HTMLHeadingElement || originalElement.tagName === 'A') {
        originalElement.textContent = newValue;
      }

      input.replaceWith(originalElement);
    } catch (error) {
      isProcessing = false;
      input.disabled = false;
      input.style.opacity = '1';
      input.focus();
      input.select();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isProcessing) return;
    input.replaceWith(originalElement);
    onCancel();
  };

  // Event listeners
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  });

  input.addEventListener('blur', () => {
    // Delay to allow click events on buttons to fire first
    setTimeout(() => {
      if (!isProcessing && document.body.contains(input)) {
        handleSave();
      }
    }, 100);
  });
}

/**
 * Handle renaming a folder
 */
export async function handleRenameFolder(
  folderId: string,
  titleElement: HTMLElement
): Promise<void> {
  const currentTitle = titleElement.textContent || '';

  const onSave = async (newTitle: string) => {
    try {
      await updateBookmark(folderId, { title: newTitle });
      showSuccessMessage(`Renamed to "${newTitle}"`);
    } catch (error) {
      console.error('Failed to rename folder:', error);
      showErrorMessage('Failed to rename folder');
      throw error;
    }
  };

  const onCancel = () => {
    // No action needed on cancel
  };

  makeElementEditable(titleElement, currentTitle, onSave, onCancel);
}

/**
 * Handle renaming a bookmark
 */
export async function handleRenameBookmark(
  bookmarkId: string,
  linkElement: HTMLElement
): Promise<void> {
  const currentTitle = linkElement.textContent || '';

  const onSave = async (newTitle: string) => {
    try {
      await updateBookmark(bookmarkId, { title: newTitle });
      showSuccessMessage(`Renamed to "${newTitle}"`);
    } catch (error) {
      console.error('Failed to rename bookmark:', error);
      showErrorMessage('Failed to rename bookmark');
      throw error;
    }
  };

  const onCancel = () => {
    // No action needed on cancel
  };

  makeElementEditable(linkElement, currentTitle, onSave, onCancel);
}
