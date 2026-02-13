export async function moveBookmark(bookmarkId: string, destination: {
  parentId: string;
  index?: number;
}): Promise<void> {
  await chrome.bookmarks.move(bookmarkId, destination);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await chrome.bookmarks.remove(bookmarkId);
}

export async function updateBookmark(
  bookmarkId: string,
  changes: { title?: string; url?: string }
): Promise<void> {
  await chrome.bookmarks.update(bookmarkId, changes);
}

export async function deleteFolder(folderId: string): Promise<void> {
  await chrome.bookmarks.removeTree(folderId);
}
