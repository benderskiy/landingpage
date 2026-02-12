import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import 'modern-normalize/modern-normalize.css';
import './css/main.css';

// Type Definitions
interface Bookmark {
  title: string;
  url: string;
  id?: string;
}

interface Folder {
  info: chrome.bookmarks.BookmarkTreeNode;
  links: Bookmark[];
}

interface BookmarksData {
  folders: Folder[];
  links: Bookmark[];
}

// Constants
const IGNORED_FOLDERS: string[] = ['SAP IT Links', 'SAP Links', 'Concur Links'];

// Bookmarks API
async function getBookmarks(): Promise<BookmarksData> {
  try {
    const bookmarksTree: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getTree();

    if (!bookmarksTree.length) {
      throw new Error('No bookmarks found');
    }

    const root = bookmarksTree[0];
    return getFolders(root);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    showErrorMessage('Unable to load bookmarks. Please reload the page.');
    return { folders: [], links: [] };
  }
}

function getFolders(tree: chrome.bookmarks.BookmarkTreeNode): BookmarksData {
  const folders: Folder[] = [];
  const links: Bookmark[] = [];

  if (IGNORED_FOLDERS.includes(tree.title || '')) {
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
        info: tree,
        links: folderLinks,
      });
    }
  }

  return { folders, links };
}

// Favicon Utilities
function getFaviconUrl(pageUrl: string): string {
  try {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', pageUrl);
    url.searchParams.set('size', '32');
    return url.toString();
  } catch (error) {
    console.warn('Invalid URL for favicon:', pageUrl);
    return '';
  }
}

// Rendering Functions
function renderLinks(links: Bookmark[], container: HTMLElement): void {
  links.forEach((link) => {
    const linkElement = document.createElement('a');
    linkElement.textContent = link.title;
    linkElement.href = link.url;

    const favicon = document.createElement('img');
    favicon.height = 16;
    favicon.width = 16;
    favicon.src = getFaviconUrl(link.url);
    favicon.onerror = (): void => {
      favicon.style.display = 'none';
    };

    linkElement.prepend(favicon);
    container.appendChild(linkElement);
  });
}

function renderFoldersToContainer(folders: Folder[], container: HTMLElement): void {
  folders.forEach((folder) => {
    const folderNav = document.createElement('nav');

    const title = document.createElement('h1');
    title.textContent = folder.info.title || '';
    folderNav.appendChild(title);

    renderLinks(folder.links, folderNav);

    container.appendChild(folderNav);
  });
}

function renderFolders(folders: Folder[]): void {
  const main = document.querySelector<HTMLElement>('main#main');
  if (!main) return;

  main.innerHTML = '';

  if (folders.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <p>No bookmarks found</p>
      </div>
    `;
    return;
  }

  renderFoldersToContainer(folders, main);

  // Announce results for screen readers
  const resultsStatus = document.getElementById('results-status');
  if (resultsStatus) {
    const count = folders.reduce((sum, f) => sum + f.links.length, 0);
    resultsStatus.textContent = `Found ${count} bookmarks in ${folders.length} folders`;
  }
}

function showErrorMessage(message: string): void {
  const main = document.querySelector<HTMLElement>('main#main');
  if (main) {
    main.innerHTML = `<div class="error">${message}</div>`;
  }
}

function showLoading(): void {
  const main = document.querySelector<HTMLElement>('main#main');
  if (main) {
    main.innerHTML = '<div class="loading">Loading bookmarks...</div>';
  }
}

// Utility Functions
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return function (this: any, ...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Search Functionality
function initSearch(bookmarks: BookmarksData): void {
  const fuseOptions: IFuseOptions<Folder> = {
    keys: ['links.title', 'links.url'],
    threshold: 0.3,
  };

  const fuse = new Fuse<Folder>(bookmarks.folders, fuseOptions);

  function searchTitle(text: string): Folder[] {
    if (!text) {
      return bookmarks.folders;
    }

    const results = fuse.search(text);

    return results.map((result) => {
      const linkFuseOptions: IFuseOptions<Bookmark> = {
        keys: ['title', 'url'],
        threshold: 0.3,
      };
      const linkFuse = new Fuse<Bookmark>(result.item.links, linkFuseOptions);
      const linkResults = linkFuse.search(text);

      return {
        info: result.item.info,
        links: linkResults.length > 0 ? linkResults.map((r) => r.item) : result.item.links,
      };
    });
  }

  function startFirstLink(): void {
    const firstLink = document.querySelector<HTMLAnchorElement>('nav > a');
    if (firstLink) {
      firstLink.click();
    }
  }

  const searchInput = document.querySelector<HTMLInputElement>('#site-search');
  if (searchInput) {
    searchInput.addEventListener(
      'input',
      debounce((event: Event) => {
        const target = event.target as HTMLInputElement;
        renderFolders(searchTitle(target.value));
      }, 150)
    );

    searchInput.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        startFirstLink();
      }
    });
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();

  try {
    const bookmarks = await getBookmarks();
    renderFolders(bookmarks.folders);
    initSearch(bookmarks);
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorMessage('Failed to load bookmarks. Please reload the page.');
  }
});
