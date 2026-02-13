import { saveFolderOrder } from '../../services/storage.service';
import { AppState } from '../../state/app-state';
import { Folder, BookmarksData } from '../../types';

export async function reorderFolders(newOrder: string[]): Promise<void> {
  const appState = AppState.getInstance();

  newOrder.forEach((id, index) => {
    appState.folderOrder.set(id, index);
  });

  await saveFolderOrder(newOrder);
}

export function applyFolderOrder(bookmarks: BookmarksData): BookmarksData {
  const appState = AppState.getInstance();

  const sortedFolders = [...bookmarks.folders].sort((a, b) => {
    const orderA = appState.folderOrder.get(a.info.id) ?? Infinity;
    const orderB = appState.folderOrder.get(b.info.id) ?? Infinity;
    return orderA - orderB;
  });

  return {
    folders: sortedFolders,
    links: bookmarks.links,
  };
}
