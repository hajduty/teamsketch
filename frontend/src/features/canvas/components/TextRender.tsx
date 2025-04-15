// TextTool.tsx
import React from "react";
import { Group, Rect, Text } from "react-konva";
import * as Y from "yjs";
import { CanvasObject } from "../tools/baseTool";

export type TextToolProps = {
  obj: CanvasObject;
  yObjects: Y.Map<any>;
  toolOptions: {
    current: {
      fontSize: number;
      fontFamily: string;
      color: string;
    };
  };
  activeTool: string;
  handleDblClick?: (e: any) => void;
  updateObjectsFromYjs: () => void;
};

export const TextRender: React.FC<TextToolProps> = ({
  obj,
  yObjects,
  toolOptions,
  activeTool,
  handleDblClick,
  updateObjectsFromYjs,
}) => {
  const paddingX = 8;
  const paddingY = 4;

  return (
    <Group key={obj.id}>
      <Text
        id={obj.id}
        x={obj.x}
        y={obj.y}
        text={obj.text}
        fontSize={obj.fontSize || toolOptions.current.fontSize}
        fontFamily={obj.fontFamily || toolOptions.current.fontFamily}
        fill={obj.color || toolOptions.current.color}
        draggable={true}
        onDragStart={() => {
          if (!obj.selected) {
            const textObj = yObjects.get(obj.id);
            if (textObj) {
              yObjects.set(obj.id, { ...textObj, selected: true });
            }
          }
        }}
        onDragEnd={(e) => {
          const updated = { ...obj, x: e.target.x(), y: e.target.y() };
          yObjects.set(obj.id, updated);
          updateObjectsFromYjs();
        }}
        onDblClick={(e) => {
          if (activeTool === "text" && handleDblClick) {
            handleDblClick(e);
          }
        }}
      />

      {obj.selected && (
        <Rect
          x={obj.x - paddingX}
          y={obj.y - paddingY}
          width={
            (obj.text?.length || 0) *
              (obj.fontSize || toolOptions.current.fontSize) *
              0.6 +
            paddingX * 2
          }
          height={(obj.fontSize || toolOptions.current.fontSize) * 1.2 + paddingY * 2}
          stroke="#0096FF"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};
