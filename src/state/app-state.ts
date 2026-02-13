import { BookmarksData, DragState } from '../types';

export class AppState {
  private static instance: AppState;

  bookmarksData: BookmarksData | null = null;
  folderOrder: Map<string, number> = new Map();
  editMode: boolean = false;
  dragState: DragState = {
    draggedElement: null,
    draggedType: null,
    draggedId: null,
    sourceParentId: null,
    targetParentId: null,
    dropIndicator: null,
    visualIndicator: null,
    lastIndicatorPosition: null,
    folderSnapshots: [],
    calculatedInsertIndex: null,
    lastUpdateTime: 0,
  };

  private constructor() {}

  static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  resetDragState(): void {
    this.dragState = {
      draggedElement: null,
      draggedType: null,
      draggedId: null,
      sourceParentId: null,
      targetParentId: null,
      dropIndicator: null,
      visualIndicator: null,
      lastIndicatorPosition: null,
      folderSnapshots: [],
      calculatedInsertIndex: null,
      lastUpdateTime: 0,
    };
  }
}
