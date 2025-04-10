// tools/baseTool.ts
import * as Y from "yjs";

export interface Point {
  x: number;
  y: number;
  pathId: string;
  color?: string;
  toolType?: string;
}

export interface Stroke {
  pathId: string;
  color: string;
  toolType: string;
  
}

export interface ToolHandlers {
  handleMouseDown: (e: any) => void;
  handleMouseMove: (e: any) => void;
  handleMouseUp: () => void;
}

export interface ToolOptions {
  color: string;
  size: number;
}

export interface Tool {
  create: (
    yPoints: Y.Array<Point>,
    isDrawing: boolean,
    setIsDrawing: (drawing: boolean) => void,
    currentPath: { current: number[] },
    currentPathId: { current: string },
    options: { current: ToolOptions }
  ) => ToolHandlers;
  updatePaths: (allPoints: Point[]) => { pathId: string; points: number[]; color: string; toolType: string }[];
}