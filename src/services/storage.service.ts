import { FolderOrderState } from '../types';
import { STORAGE_KEYS } from '../constants';

// Check if Chrome extension APIs are available
function isChromeExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && chrome.storage?.local !== undefined;
}

export async function saveFolderOrder(order: string[]): Promise<void> {
  if (!isChromeExtensionContext()) {
    console.warn('Chrome storage API not available');
    return;
  }

  const orderState: FolderOrderState = {
    order,
    version: '1.0'
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.FOLDER_ORDER]: orderState });
}

export async function loadFolderOrder(): Promise<Map<string, number>> {
  if (!isChromeExtensionContext()) {
    console.warn('Chrome storage API not available');
    return new Map<string, number>();
  }

  const result = await chrome.storage.local.get(STORAGE_KEYS.FOLDER_ORDER);
  const orderState = result[STORAGE_KEYS.FOLDER_ORDER] as FolderOrderState | undefined;

  const orderMap = new Map<string, number>();
  if (orderState?.order) {
    orderState.order.forEach((id, index) => {
      orderMap.set(id, index);
    });
  }

  return orderMap;
}
