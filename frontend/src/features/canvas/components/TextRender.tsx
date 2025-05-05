import React, { useEffect, useState, useCallback } from "react";
import { Group, Text, Transformer } from "react-konva";
import * as Y from "yjs";
import { CanvasObject } from "../tools/baseTool";
import { TextEditor } from "./TextEditor";
import { useTransformer } from "../../../hooks/useTransformer";
import { History } from "../Canvas";

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
  updateObjectsFromYjs: () => void;
  addToHistory: (state: History) => void;
};

export const TextRender: React.FC<TextToolProps> = ({
  obj,
  yObjects,
  toolOptions,
  activeTool,
  updateObjectsFromYjs,
  addToHistory
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const {
    shapeRef,
    transformerRef,
    bindTransformer,
    handleTransformEnd,
    handleDragEnd,
    preventDefault,
    updateObject,
    handleDragStart,
    handleDragMove
  } = useTransformer(obj, yObjects, updateObjectsFromYjs, addToHistory);

  useEffect(() => {
    if (!isEditing) {
      bindTransformer();
    }
  }, [bindTransformer, isEditing]);

  const handleTextDblClick = useCallback(() => {
    if (activeTool === "text") {
      setIsEditing(true);
    }
  }, [activeTool]);

  const handleTextChange = useCallback((newText: string) => {
    updateObject({ text: newText });
    const state: History = {before: {text: obj.text}, after: {text: newText}, id: obj.id};
    addToHistory(state);
    setIsEditing(false);
  }, [updateObject]);

  const handleSelect = useCallback((e: any) => {
    e.cancelBubble = true;
    if (activeTool === "text" || activeTool === "select") {
      Y.transact(yObjects.doc as Y.Doc, () => {
        yObjects.forEach((item, itemId) => {
          if (item instanceof Y.Map) {
            item.set("selected", itemId === obj.id);
          }
        });
      });
      updateObjectsFromYjs();
    }
  }, [activeTool, obj.id, yObjects, updateObjectsFromYjs]);

  return (
    <Group id={obj.id} key={obj.id}>
      <Text
        ref={shapeRef}
        id={obj.id}
        x={obj.x}
        y={obj.y}
        text={obj.text}
        fontSize={obj.fontSize || toolOptions.current.fontSize}
        fontFamily={obj.fontFamily || toolOptions.current.fontFamily}
        fill={obj.color || toolOptions.current.color}
        width={obj.width || 200}
        rotation={obj.rotation || 0}
        draggable={!isEditing}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        visible={!isEditing}
        perfectDrawEnabled={false}
        listening={activeTool === "text" || activeTool === "select"}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onTransformEnd={handleTransformEnd}
        onClick={handleSelect}
      />

      {isEditing && shapeRef.current && (
        <TextEditor
          textNode={shapeRef.current}
          onChange={handleTextChange}
          onClose={() => setIsEditing(false)}
        />
      )}

      {obj.selected && !isEditing && (
        <Transformer
          id={obj.id}
          ref={transformerRef}
          onDragEnd={preventDefault}
          onDragStart={preventDefault}
          enabledAnchors={[
            "top-left", "top-center", "top-right",
            "middle-right", "middle-left",
            "bottom-left", "bottom-center", "bottom-right"
          ]}
          boundBoxFunc={(_oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
          })}
        />
      )}
    </Group>
  );
};