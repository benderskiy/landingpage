export async function moveBookmark(bookmarkId: string, destination: {
  parentId: string;
  index?: number;
}): Promise<void> {
  await chrome.bookmarks.move(bookmarkId, destination);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await chrome.bookmarks.remove(bookmarkId);
}
