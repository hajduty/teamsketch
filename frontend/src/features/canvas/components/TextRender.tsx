
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Group, Text, Transformer } from "react-konva";
import * as Y from "yjs";
import { CanvasObject } from "../tools/baseTool";
import { TextEditor } from "./TextEditor";

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
};

export const TextRender: React.FC<TextToolProps> = ({
  obj,
  yObjects,
  toolOptions,
  activeTool,
  updateObjectsFromYjs,
}) => {
  const textRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [shouldEdit, setShouldEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const yObjRef = useRef<Y.Map<any> | null>(null);

  // Get the Yjs map object once on mount
  useEffect(() => {
    yObjRef.current = yObjects.get(obj.id) as Y.Map<any>;
  }, [obj.id, yObjects]);

  // Edit mode handling
  useEffect(() => {
    if (shouldEdit && textRef.current) {
      setIsEditing(true);
      setShouldEdit(false);
    }
  }, [shouldEdit]);

  // Transformer handling
  useEffect(() => {
    if (obj.selected && !isEditing && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [obj.selected, isEditing]);

  const updateObject = useCallback(
    (properties: Partial<CanvasObject>) => {
      if (!yObjRef.current) return;

      // Batch all updates together
      Y.transact(yObjects.doc as Y.Doc, () => {
        Object.entries(properties).forEach(([key, value]) => {
          yObjRef.current?.set(key, value);
        });
      });

      updateObjectsFromYjs();
    },
    [yObjects, updateObjectsFromYjs]
  );

  const handleTextDblClick = useCallback(() => {
    if (activeTool === "text") {
      setShouldEdit(true);
    }
  }, [activeTool]);

  const handleTextChange = useCallback(
    (newText: string) => {
      updateObject({ text: newText });
    },
    [updateObject]
  );

  const handleTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const newWidth = Math.max(30, node.width() * scaleX);

    updateObject({
      width: newWidth,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    });

    node.scaleX(1);
  }, [updateObject]);

  const preventDefault = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt.stopImmediatePropagation();
    e.evt.preventDefault();
  }, []);
  
  const handleDragEnd = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt.stopImmediatePropagation();
    
    updateObject({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [updateObject]);
  


  return (
    <Group key={obj.id}>
      <Text
        ref={textRef}
        id={obj.id}
        x={obj.x}
        y={obj.y}
        text={obj.text}
        fontSize={obj.fontSize || toolOptions.current.fontSize}
        fontFamily={obj.fontFamily || toolOptions.current.fontFamily}
        fill={obj.color || toolOptions.current.color}
        width={obj.width || 200}
        rotation={obj.rotation || 0}
        draggable={activeTool === "text" && !isEditing}
        onDragStart={preventDefault}
        onDragEnd={handleDragEnd}
        visible={!isEditing}
        hitStrokeWidth={10}
        perfectDrawEnabled={false}
        listening={activeTool === "text"}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onTransform={handleTransform}
        onClick={(e) => {
          e.cancelBubble = true;
          if (activeTool === "text") {
            // Batch the selection update
            Y.transact(yObjects.doc as Y.Doc, () => {
              yObjects.forEach((item, itemId) => {
                if (item instanceof Y.Map) {
                  item.set("selected", itemId === obj.id);
                }
              });
            });
            updateObjectsFromYjs();
          }
        }}
      />

      {isEditing && textRef.current && (
        <TextEditor
          textNode={textRef.current}
          onChange={(newText) => {
            handleTextChange(newText);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}

      {obj.selected && !isEditing && activeTool === "text" && (
        <Transformer
          onDragEnd={preventDefault}
          onDragStart={preventDefault}
          ref={transformerRef}
          enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
          boundBoxFunc={(_oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
          })}
        />
      )}
    </Group>
  );
};