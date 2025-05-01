import { FC, useEffect } from "react";
import { Line, Transformer } from "react-konva";
import { CanvasObject } from "../tools/baseTool";
import { useTransformer } from "../../../hooks/useTransformer";
import * as Y from "yjs";

interface PenRenderProps {
  obj: CanvasObject;
  isSelected: boolean;
  stageRef: any;
  yObjects: Y.Map<any>;
  updateObjectsFromYjs: () => void;
}

const PenRender: FC<PenRenderProps> = ({
  obj,
  yObjects,
  updateObjectsFromYjs,
}) => {
  const {
    shapeRef,
    transformerRef,
    bindTransformer,
    handleTransformEnd,
    handleDragMove,
    handleDragEnd,
    preventDefault,
  } = useTransformer(obj, yObjects, updateObjectsFromYjs);

  useEffect(() => {
    bindTransformer();
  }, [bindTransformer]);

  if (!obj.points || !Array.isArray(obj.points)) return null;

  return (
    <>
      <Line
        ref={shapeRef}
        id={obj.id}
        points={obj.points}
        x={obj.x}
        y={obj.y}
        rotation={obj.rotation}
        scaleX={obj.scaleX}
        scaleY={obj.scaleY}
        stroke={obj.color || "#000"}
        strokeWidth={obj.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        draggable={obj.selected}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        hitStrokeWidth={
          obj.scaleX && obj.scaleX !== 0
            ? Math.min(400, Math.max(20, Math.round(20 / obj.scaleX)))
            : 20
        }
      />
      {obj.selected && (
        <Transformer
          ref={transformerRef}
          onDragEnd={preventDefault}
          onDragStart={preventDefault}
        />
      )}
    </>
  );
};

export default PenRender;