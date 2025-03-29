import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line } from "react-konva";
import useWindowDimensions from "../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface Point {
  x: number;
  y: number;
  pathId: string;
  color?: string;
}

export interface CanvasRef {
  clearCanvas: () => void;
  setColor: (color: string) => void;
}

export const Canvas = forwardRef<CanvasRef>((_, ref) => {
  const { width, height } = useWindowDimensions();
  const [paths, setPaths] = useState<{ pathId: string; points: number[], color: string }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPath = useRef<number[]>([]);
  const currentPathId = useRef<string>("");
  const currentColor = useRef<string>("black");

  const ydoc = useRef(new Y.Doc()).current;
  const yPoints = ydoc.getArray<Point>("points");

  useEffect(() => {
    const provider = new WebsocketProvider("wss://192.168.0.112:7234", "ws", ydoc);

    yPoints.observe(() => {
      const newPoints = yPoints.toArray();
      updatePaths(newPoints);
      console.log("Received updated points");
    });

    return () => provider.disconnect();
  }, []);

  const updatePaths = (allPoints: Point[]) => {
    const pathMap = new Map<string, { points: number[]; color: string }>();
  
    allPoints.forEach((point) => {
      if (!pathMap.has(point.pathId)) {

        const firstPoint = allPoints.find(p => p.pathId === point.pathId);
        const color = (firstPoint as any)?.color || "black"; 
        pathMap.set(point.pathId, { points: [], color });
        }
      pathMap.get(point.pathId)!.points.push(point.x, point.y);
    });
  
    setPaths(
      Array.from(pathMap.entries()).map(([pathId, { color, points }]) => ({
        pathId,
        points,
        color,
      }))
    );
  };
  

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      yPoints.delete(0, yPoints.length);
      setPaths([]);
    },
    setColor: (color: string) => {
      currentColor.current = color;
    }
  }));

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    currentPathId.current = Date.now().toString();
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    currentPath.current = [pos.x, pos.y];

    const newPoint: Point = { x: pos.x, y: pos.y, pathId: currentPathId.current, color: currentColor.current};
    yPoints.push([newPoint]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    currentPath.current.push(pos.x, pos.y);

    const newPoint: Point = { x: pos.x, y: pos.y, pathId: currentPathId.current };
    yPoints.push([newPoint]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentPath.current.length > 0) {
      setPaths((prev) => [
        ...prev,
         { pathId: currentPathId.current, points: [...currentPath.current], color: currentColor.current }
        ]);
      currentPath.current = [];
    }
  };

  return (
    <Stage width={width!} height={height!} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <Layer>
        {paths.map((path) => (
          <Line key={path.pathId} points={path.points} stroke={path.color} strokeWidth={2} lineCap="round" lineJoin="round" />
        ))}
      </Layer>
    </Stage>
  );
});
