import { Bookmark, Folder, BookmarksData } from '../types';

const IGNORED = ['SAP IT Links', 'SAP Links', 'Concur Links'];

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

  if (IGNORED.includes(tree.title || '')) {
    return { folders: [], links: [] };
  }

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

    if (folderLinks.length > 0) {
      links.push(...folderLinks);
      folders.unshift({
        info: tree as Bookmark,
        links: folderLinks,
      });
    }
  }

  return { folders, links };
}
