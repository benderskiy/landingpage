import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

export async function handleDeleteFolder(
  folderId: string,
  folderElement: HTMLElement,
  folderTitle: string
): Promise<void> {
  try {
    // Count bookmarks in folder
    const bookmarkCount = folderElement.querySelectorAll('.bookmark-item').length;

    // Confirm deletion
    const message = bookmarkCount > 0
      ? `Delete folder "${folderTitle}" and all ${bookmarkCount} bookmarks?`
      : `Delete empty folder "${folderTitle}"?`;

    if (!confirm(message)) {
      return;
    }

    // Show deleting state
    folderElement.style.transition = 'all 0.3s ease';
    folderElement.style.opacity = '0.5';
    folderElement.style.pointerEvents = 'none';

    // Wait for visual feedback
    await new Promise(resolve => setTimeout(resolve, 200));

    // Delete via Chrome API
    await chrome.bookmarks.removeTree(folderId);

    // Animate removal
    folderElement.style.opacity = '0';
    folderElement.style.maxHeight = '0';
    folderElement.style.marginBottom = '0';
    folderElement.style.overflow = 'hidden';

    // Remove from DOM after animation
    setTimeout(() => {
      folderElement.remove();
      const countText = bookmarkCount > 0 ? ` and ${bookmarkCount} bookmarks` : '';
      showSuccessMessage(`Folder deleted${countText}`);
    }, 300);

  } catch (error) {
    console.error('Failed to delete folder:', error);
    showErrorMessage('Failed to delete folder');

    // Restore element state
    folderElement.style.opacity = '1';
    folderElement.style.pointerEvents = 'auto';
  }
}
