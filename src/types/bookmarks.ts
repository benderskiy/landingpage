export interface Bookmark {
  dateAdded?: number;
  id: string;
  index?: number;
  parentId?: string;
  title: string;
  url?: string;
}

export interface Folder {
  info: Bookmark;
  links: Bookmark[];
}

export interface BookmarksData {
  folders: Folder[];
  links: Bookmark[];
}
