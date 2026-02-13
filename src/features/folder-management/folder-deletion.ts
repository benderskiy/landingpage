import { deleteBookmark } from '../../services/chrome-api.service';
import { showSuccessMessage, showErrorMessage } from '../../ui/notifications';

export async function handleDeleteBookmark(
  bookmarkId: string,
  linkElement: HTMLElement
): Promise<void> {
  try {
    linkElement.style.transition = 'all 0.3s ease';
    linkElement.style.opacity = '0';
    linkElement.style.transform = 'translateX(-20px)';

    await new Promise(resolve => setTimeout(resolve, 300));

    await deleteBookmark(bookmarkId);

    linkElement.remove();

    showSuccessMessage('Bookmark deleted successfully');
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
    showErrorMessage('Failed to delete bookmark');

    linkElement.style.opacity = '1';
    linkElement.style.transform = 'translateX(0)';
  }
}
