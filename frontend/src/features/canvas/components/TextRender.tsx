// TextTool.tsx
import React, { useRef } from "react";
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
  const textRef = useRef<any>(null);
  const paddingX = 8;
  const paddingY = 4;

  const updatePosition = (x: number, y: number) => {
    const yMap = yObjects.get(obj.id);
    if (yMap instanceof Y.Map) {
      yMap.set('x', x);
      yMap.set('y', y);
    }
  };

  const toggleSelection = (selected: boolean) => {
    const yMap = yObjects.get(obj.id);
    if (yMap instanceof Y.Map) {
      yMap.set('selected', selected);
    }
  };

  const measureText = () => {
    const text = textRef.current;
    if (!text) return { width: 100, height: 20 };
    
    const width = text.width();
    const height = text.height();
    
    return {
      width: Math.max(100, width),
      height: Math.max(20, height)
    };
  };

  const textMeasurements = measureText();

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
            toggleSelection(true);
          }
        }}
        onDragEnd={(e) => {
          updatePosition(e.target.x(), e.target.y());
          updateObjectsFromYjs();
        }}
        onDblClick={(e) => {
          if (activeTool === "text" && handleDblClick) {
            handleDblClick(e);
          }
        }}
        onClick={(e) => {
          if (activeTool == "text") {
            e.cancelBubble = true;
            yObjects.forEach((item, itemId) => {
              if (item instanceof Y.Map) {
                item.set('selected', itemId === obj.id);
              }
            });
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
