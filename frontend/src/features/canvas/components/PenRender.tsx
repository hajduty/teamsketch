import { FC, useEffect } from "react";
import { Line, Transformer } from "react-konva";
import { CanvasObject } from "../tools/baseTool";
import { useTransformer } from "../../../hooks/useTransformer";
import * as Y from "yjs";
import { History } from "../Canvas";
import { smoothPathPoints } from "../../../utils/smoothPoints";
import React from "react";

interface PenRenderProps {
  obj: CanvasObject;
  isSelected: boolean;
  stageRef: any;
  yObjects: Y.Map<any>;
  updateObjectsFromYjs: () => void;
  addToHistory: (state: History) => void;
}

const PenRender: FC<PenRenderProps> = ({
  obj,
  yObjects,
  updateObjectsFromYjs,
  addToHistory
}) => {
  const {
    shapeRef,
    transformerRef,
    bindTransformer,
    handleTransformEnd,
    handleDragMove,
    handleDragEnd,
    preventDefault,
    handleDragStart,
  } = useTransformer(obj, yObjects, updateObjectsFromYjs, addToHistory);

  useEffect(() => {
    bindTransformer();
  }, [bindTransformer]);

  if (!obj.points || !Array.isArray(obj.points)) return null;
  //console.log("rerender" + obj.id);
  const smoothPoints = smoothPathPoints(obj.points);

  return (
    <>
      <Line
        ref={shapeRef}
        id={obj.id}
        points={smoothPoints}
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
        onDragStart={handleDragStart}
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

const areEqual = (prevProps: PenRenderProps, nextProps: PenRenderProps) => {
  return (
    prevProps.obj.id === nextProps.obj.id &&
    prevProps.obj.selected === nextProps.obj.selected &&
    JSON.stringify(prevProps.obj.points) === JSON.stringify(nextProps.obj.points) &&
    prevProps.obj.color === nextProps.obj.color &&
    prevProps.obj.strokeWidth === nextProps.obj.strokeWidth &&
    prevProps.obj.x === nextProps.obj.x &&
    prevProps.obj.y === nextProps.obj.y
  );
};

export default React.memo(PenRender, areEqual);