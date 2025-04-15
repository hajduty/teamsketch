import { FC } from "react";
import { Line } from "react-konva";
import { CanvasObject } from "../tools/baseTool";

interface PenRenderProps {
  obj: CanvasObject;
}

const PenRender: FC<PenRenderProps> = ({ obj }) => {
  if (!obj.points || !Array.isArray(obj.points)) return null;

  return (
    <Line
      key={obj.id}
      points={obj.points}
      stroke={obj.color || "#000000"}
      strokeWidth={obj.strokeWidth || 2}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation={
        obj.toolType === "eraser" ? "destination-out" : "source-over"
      }
    />
  );
};

export default PenRender;
