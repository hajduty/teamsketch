import { Tool, Point, ToolHandlers } from "./baseTool";

export const PenTool: Tool = {
  create: (
    yPoints,
    isDrawing,
    setIsDrawing,
    currentPath,
    currentPathId,
    options
  ): ToolHandlers => {
    const MIN_DISTANCE = 5;
    let lastPos: { x: number; y: number } | null = null;

    const handleMouseDown = (e: any) => {
      setIsDrawing(true);
      currentPathId.current = Date.now().toString();
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      currentPath.current = [pos.x, pos.y];
      lastPos = pos;

      const newPoint: Point = {
        x: pos.x,
        y: pos.y,
        pathId: currentPathId.current,
        color: options.current.color,
        toolType: 'pen'
      };
      yPoints.push([newPoint]);
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (!lastPos) {
        lastPos = pos;
        return;
      }

      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= MIN_DISTANCE) {
        currentPath.current.push(pos.x, pos.y);

        const newPoint: Point = {
          x: pos.x,
          y: pos.y,
          pathId: currentPathId.current,
          toolType: 'pen'
        };
        yPoints.push([newPoint]);
        lastPos = pos;
      }
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      console.log(currentPath.current.length);
      currentPath.current = [];
      lastPos = null;
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
      if (!pathMap.has(point.pathId)) {
        const firstPoint = allPoints.find(p => p.pathId === point.pathId);
        const color = firstPoint?.color || "black";
        const toolType = firstPoint?.toolType || "pen";
        pathMap.set(point.pathId, { points: [], color, toolType });
      }
      pathMap.get(point.pathId)!.points.push(point.x, point.y);
    });

    return Array.from(pathMap.entries()).map(([pathId, { color, points, toolType }]) => ({
      pathId,
      points,
      color,
      toolType
    }));
  }
};
