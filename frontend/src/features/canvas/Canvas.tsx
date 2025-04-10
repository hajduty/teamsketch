import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line } from "react-konva";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { PenTool } from "./tools/penTool";
import { EraserTool } from "./tools/eraserTool";
import { Point, Tool, ToolOptions } from "./tools/baseTool";

export interface CanvasRef {
  clearCanvas: () => void;
  setColor: (color: string) => void;
  setTool: (tool: string) => void;
  setSize: (size: number) => void;
}

export interface CanvasProps {
  activeTool: string;
}

const TOOLS: Record<string, Tool> = {
  pen: PenTool,
  eraser: EraserTool
};

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({ activeTool }, ref) => {
  const { width, height } = useWindowDimensions();
  const [paths, setPaths] = useState<{ pathId: string; points: number[]; color: string; toolType: string }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPath = useRef<number[]>([]);
  const currentPathId = useRef<string>("");
  const toolOptions = useRef<ToolOptions>({
    color: "black",
    size: 5
  });

  const ydoc = useRef(new Y.Doc()).current;
  const yPoints = ydoc.getArray<Point>("points");

  useEffect(() => {
    const provider = new WebsocketProvider("wss://192.168.0.112:7234", "ws", ydoc);

    yPoints.observe(() => {
      const newPoints = yPoints.toArray();
      const tool = TOOLS[activeTool] || PenTool;
      setPaths(tool.updatePaths(newPoints));
    });

    provider.connect();

    return () => provider.disconnect();
  },[]);

  const { handleMouseDown, handleMouseMove, handleMouseUp } = (
    TOOLS[activeTool] || PenTool
  ).create(
    yPoints,
    isDrawing,
    setIsDrawing,
    currentPath,
    currentPathId,
    toolOptions
  );

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      yPoints.delete(0, yPoints.length);
      setPaths([]);
    },
    setColor: (color: string) => {
      toolOptions.current.color = color;
    },
    setTool: (tool: string) => {
      // Tool switching is handled by the activeTool prop
    },
    setSize: (size: number) => {
      toolOptions.current.size = size;
    }
  }));

  return (
    <Stage
      width={width!}
      height={height!}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {paths.map((path) => {
          if (path.toolType === 'eraser') {
            return (
              <Line
                key={path.pathId}
                points={path.points}
                stroke={path.color}
                strokeWidth={toolOptions.current.size * 2} // Make eraser larger
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation="destination-out" // This makes it erase
              />
            );
          }
          return (
            <Line
              key={path.pathId}
              points={path.points}
              stroke={path.color}
              strokeWidth={toolOptions.current.size}
              lineCap="round"
              lineJoin="round"
            />
          );
        })}
      </Layer>
    </Stage>
  );
});