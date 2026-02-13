import { Bookmark, Folder, BookmarksData } from '../types';

export async function getBookmarks(): Promise<BookmarksData> {
  try {
    const bookmarksTree: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getTree();

    if (!bookmarksTree.length) {
      throw new Error('No bookmarks found');
    }

    const root = bookmarksTree[0];
    return getFolders(root);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return { folders: [], links: [] };
  }
}

function getFolders(tree: chrome.bookmarks.BookmarkTreeNode): BookmarksData {
  const folders: Folder[] = [];
  const links: Bookmark[] = [];

  // Filter out system folders that can't be deleted
  const isSystemFolder = (title: string | undefined): boolean => {
    if (!title) return true; // Folders without title are system folders
    const lowerTitle = title.toLowerCase();
    const systemFolderNames = [
      'bookmarks bar',
      'bookmarks toolbar',
      'other bookmarks',
      'mobile bookmarks',
      'reading list'
    ];
    return systemFolderNames.some(name => lowerTitle.includes(name));
  };

  if (tree.children) {
    const folderLinks: Bookmark[] = [];

    tree.children.forEach((subtree) => {
      if (!subtree.children && subtree.url) {
        // It's a bookmark
        folderLinks.push({
          title: subtree.title || '',
          url: subtree.url,
          id: subtree.id,
        });
      } else {
        // It's a folder, recurse
        const subFolders = getFolders(subtree);
        folders.push(...subFolders.folders);
      }
    });

    // Skip system folders when adding to results
    if (!isSystemFolder(tree.title)) {
      // Always include folders, even if empty
      links.push(...folderLinks);
      folders.unshift({
        info: tree as Bookmark,
        links: folderLinks,
      });
    }
  }

  return { folders, links };
}
