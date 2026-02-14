import { Bookmark, Folder, BookmarksData } from '../types';
import { SYSTEM_FOLDERS } from '../constants';

// Check if Chrome extension APIs are available
function isChromeExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && chrome.bookmarks?.getTree !== undefined;
}

export async function getBookmarks(): Promise<BookmarksData> {
  try {
    if (!isChromeExtensionContext()) {
      throw new Error('Chrome bookmarks API not available. This extension must be loaded as a Chrome extension.');
    }

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
    return SYSTEM_FOLDERS.some(name => lowerTitle.includes(name));
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
