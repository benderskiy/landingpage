import { FolderOrderState } from '../types';

const STORAGE_KEY = 'folder_order_v1';

export async function saveFolderOrder(order: string[]): Promise<void> {
  const orderState: FolderOrderState = {
    order,
    version: '1.0'
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: orderState });
}

export async function loadFolderOrder(): Promise<Map<string, number>> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const orderState = result[STORAGE_KEY] as FolderOrderState | undefined;

  const orderMap = new Map<string, number>();
  if (orderState?.order) {
    orderState.order.forEach((id, index) => {
      orderMap.set(id, index);
    });
  }

  return orderMap;
}
