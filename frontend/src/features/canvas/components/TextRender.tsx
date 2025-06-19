import React, { useEffect, useCallback } from "react";
import { Group, Text, Transformer } from "react-konva";
import * as Y from "yjs";
import { CanvasObject } from "../tools/baseTool";
import { TextEditor } from "./TextEditor";
import { useTransformer } from "../../../hooks/useTransformer";
import { useCanvasStore } from "../canvasStore";

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
  userId: string;
  editing: boolean;
};

const areEqual = (prev: TextToolProps, next: TextToolProps) => {
  return (
    prev.obj.id === next.obj.id &&
    prev.obj.x === next.obj.x &&
    prev.obj.y === next.obj.y &&
    prev.obj.text === next.obj.text &&
    prev.obj.selected === next.obj.selected &&
    prev.activeTool === next.activeTool &&
    prev.editing === next.editing
  );
};

export const TextRender: React.FC<TextToolProps> = React.memo(({
  obj,
  yObjects,
  toolOptions,
  activeTool,
  updateObjectsFromYjs,
  userId,
  editing
}) => {
  const setGlobalEditing = useCanvasStore((state) => state.setEditing);
  const setGlobalEditingId = useCanvasStore((state) => state.setEditingId);

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
  } = useTransformer(obj, yObjects, updateObjectsFromYjs, userId);

  useEffect(() => {
    if (!editing) {
      bindTransformer();
    }
  }, [bindTransformer, editing]);

  const handleTextDblClick = useCallback((e: any) => {
    if (activeTool === "text") {
      e.cancelBubble = true;
      setGlobalEditing(true);
      setGlobalEditingId(obj.id);
    }
  }, [activeTool]);

  const handleTextChange = useCallback((newText: string) => {
    updateObject({ text: newText });
    setGlobalEditing(false);
    setGlobalEditingId("");
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
      }, userId);
      updateObjectsFromYjs();
    }
  }, [activeTool, obj.id, yObjects, updateObjectsFromYjs]);

  //console.log("rerendered");

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
        draggable={!editing && obj.selected}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        visible={!editing}
        perfectDrawEnabled={false}
        listening={activeTool === "text" || activeTool === "select"}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onTransformEnd={handleTransformEnd}
        onClick={handleSelect}
      />

      {editing && shapeRef.current && (
        <TextEditor
          textNode={shapeRef.current}
          onChange={handleTextChange}
          onClose={() => {
            setGlobalEditing(false);
            setGlobalEditingId("");
          }}
        />
      )}

      {obj.selected && !editing && (
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
}, areEqual);