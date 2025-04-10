// tools/eraserTool.ts
import { Tool, Point, ToolHandlers } from "./baseTool";

export const EraserTool: Tool = {
  create: (
    yPoints,
    isDrawing,
    setIsDrawing,
    currentPath,
    currentPathId,
    options
  ): ToolHandlers => {
    const handleMouseDown = (e: any) => {
      setIsDrawing(true);
      currentPathId.current = Date.now().toString();
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      currentPath.current = [pos.x, pos.y];

      const newPoint: Point = {
        x: pos.x,
        y: pos.y,
        pathId: currentPathId.current,
        color: '#ffffff', // White color for eraser
        toolType: 'eraser'
      };
      yPoints.push([newPoint]);
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      currentPath.current.push(pos.x, pos.y);

      const newPoint: Point = {
        x: pos.x,
        y: pos.y,
        pathId: currentPathId.current,
        toolType: 'eraser'
      };
      yPoints.push([newPoint]);
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      currentPath.current = [];
    };

    return {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp
    };
  },

  updatePaths: (allPoints: Point[]) => {
    const pathMap = new Map<string, { points: number[]; color: string; toolType: string }>();

    allPoints.forEach((point) => {
      if (point.toolType === 'eraser') {
        if (!pathMap.has(point.pathId)) {
          pathMap.set(point.pathId, { points: [], color: '#ffffff', toolType: 'eraser' });
        }
        pathMap.get(point.pathId)!.points.push(point.x, point.y);
      }
    });

    return Array.from(pathMap.entries()).map(([pathId, { color, points, toolType }]) => ({
      pathId,
      points,
      color,
      toolType
    }));
  }
};