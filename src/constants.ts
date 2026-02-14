/**
 * Chrome Bookmarks Root Folder IDs
 */
export const ROOT_FOLDER_ID = '1'; // Bookmarks Bar

/**
 * System folders to exclude from display
 * These are Chrome's built-in bookmark folders
 */
export const SYSTEM_FOLDERS = [
  'bookmarks bar',
  'bookmarks toolbar',
  'other bookmarks',
  'mobile bookmarks',
  'reading list',
] as const;

/**
 * Local storage keys used by the extension
 */
export const STORAGE_KEYS = {
  FOLDER_ORDER: 'folder_order_v1',
} as const;

/**
 * UI timing constants
 */
export const ANIMATION_DURATION = 300; // ms
export const DOM_INIT_DELAY = 100; // ms - wait for DOM to fully render
