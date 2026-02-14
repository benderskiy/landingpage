import Fuse, { IFuseOptions } from 'fuse.js';
import { Bookmark, Folder, BookmarksData } from '../../types';

export function initSearch(bookmarks: BookmarksData, renderFolders: (folders: Folder[], isSearchResult?: boolean) => void, debounce: <T extends (...args: any[]) => void>(func: T, wait: number) => (...args: Parameters<T>) => void): void {
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
    const firstLink = document.querySelector<HTMLAnchorElement>('.bookmark-item a');
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
        const query = target.value;
        const folders = searchTitle(query);
        // Pass true for isSearchResult if there's a search query
        renderFolders(folders, query.length > 0);
      }, 150)
    );

    searchInput.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        startFirstLink();
      }
    });
  }
}
