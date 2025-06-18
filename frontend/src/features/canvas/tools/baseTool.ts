// tools/baseTool.ts
import * as Y from "yjs";

export interface Point {
  x: number;
  y: number;
  pathId: string;
  color?: string;
  toolType?: string;
}

export interface CanvasObject {
  id: string;
  type: string;
  [key: string]: any;
}

export interface AwarenessState {
  userId: string;
  username: string;
  cursorPosition: {
    x: number;
    y: number;
  };
  role: string;
}

export interface ToolHandlers {
  handleMouseDown: (e: any) => void;
  handleMouseMove: (e: any) => void;
  handleMouseUp: (e :any) => void;
  handleClick?: (e: any) => void;
  handleDblClick?: (e: any) => void;
  handleSelect?: (e: any) => void;
}

export interface ToolOptions {
  color: string;
  size: number;
  fontSize?: number;
  fontFamily?: string;
  [key: string]: any;
}

export interface Tool {
  create: (
    yObjects: Y.Map<any>,
    isDrawing: boolean,
    setIsDrawing: (drawing: boolean) => void,
    currentState: { current: any },
    options: { current: ToolOptions },
    updateObjectsFromYjs: () => void,
    activeTool: string,
    setSelectedId: (id: string) => void,
    userId: string,
  ) => ToolHandlers;
  
  processObjects: (objects: CanvasObject[]) => CanvasObject[];
}