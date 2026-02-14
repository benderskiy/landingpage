export interface FolderOrderState {
  order: string[];
  version: string;
}

export interface DragState {
  draggedElement: HTMLElement | null;
  draggedType: 'bookmark' | 'folder' | null;
  draggedId: string | null;
  sourceParentId: string | null;
  targetParentId: string | null;
  dropIndicator: HTMLElement | null; // For bookmark drag
  visualIndicator: HTMLElement | null; // For folder drag
  lastIndicatorPosition: string | null;
}
