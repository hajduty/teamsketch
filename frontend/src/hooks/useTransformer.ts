import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { CanvasObject } from "../features/canvas/tools/baseTool";

export function useTransformer(
  obj: CanvasObject,
  yObjects: Y.Map<any>,
  updateObjectsFromYjs: () => void
) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const yObjRef = useRef<Y.Map<any> | null>(null);

  useEffect(() => {
    yObjRef.current = yObjects.get(obj.id) as Y.Map<any>;
  }, [obj.id, yObjects]);

  const updateObject = useCallback((properties: Partial<CanvasObject>) => {
    if (!yObjRef.current) return;

    Y.transact(yObjects.doc as Y.Doc, () => {
      Object.entries(properties).forEach(([key, value]) => {
        yObjRef.current?.set(key, value);
      });
    });

    updateObjectsFromYjs();
  }, [yObjects, updateObjectsFromYjs]);

  const bindTransformer = useCallback(() => {
    if (obj.selected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [obj.selected]);

  const handleTransformEnd = useCallback(() => {
    if (!shapeRef.current) return;

    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    updateObject({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX,
      scaleY,
    });

    node.scaleX(1);
    node.scaleY(1);
  }, [updateObject]);

  const handleDragMove = useCallback((_e: any) => {
    if (!shapeRef.current) return;
    const node = shapeRef.current;
    updateObject({
      x: node.x(),
      y: node.y(),
    });
  }, [updateObject]);

  const handleDragEnd = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt.stopImmediatePropagation();
    updateObject({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [updateObject]);

  const preventDefault = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt.stopImmediatePropagation();
    e.evt.preventDefault();
  }, []);

  return {
    shapeRef,
    transformerRef,
    bindTransformer,
    updateObject,
    handleTransformEnd,
    handleDragMove,
    handleDragEnd,
    preventDefault,
  };
}