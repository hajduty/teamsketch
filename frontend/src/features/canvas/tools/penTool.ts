// tools/penTool.ts
import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolHandlers, ToolOptions } from './baseTool';
import * as Y from 'yjs';
import simplify from 'simplify-js';
import { getTransformedPointer } from '../../../utils/utils';
import { History } from '../Canvas';

export const PenTool: Tool = {
  create: (
    yObjects: Y.Map<any>,
    isDrawing: boolean,
    setIsDrawing: (drawing: boolean) => void,
    currentState: { current: any },
    options: { current: ToolOptions },
    updateObjectsFromYjs: () => void,
    _activeTool: string,
    _setSelectedId: (id: string) => void,
    _userId: string,
    addToHistory: (state: History) => void
  ): ToolHandlers => {
    const state: History = {
      after: "", before: "", deleted: false, id: "",
      historyId: '', operation: "create"
    };

    const handleMouseDown = (e: any) => {
      setIsDrawing(true);
      
      const stage = e.target.getStage();
      const pointerPosition = getTransformedPointer(stage);
      
      const pathId = uuidv4();
      const yPath = new Y.Map<any>();
      const yPoints = new Y.Array<number>();
      yPoints.push([pointerPosition.x, pointerPosition.y]);

      yPath.set('id', pathId);
      yPath.set('type', 'path');
      yPath.set('points', yPoints);
      yPath.set('color', options.current.color);
      yPath.set('strokeWidth', options.current.size);
      yPath.set('toolType', 'pen');

      yObjects.set(pathId, yPath);
      state.before = yPath;

      currentState.current = {
        pathId,
        yPoints,
      };

      updateObjectsFromYjs();
    };
    
    const handleMouseMove = (e: any) => {
      if (!isDrawing) return;
      
      const stage = e.target.getStage();
      const pointerPosition = getTransformedPointer(stage);
      
      const { yPoints } = currentState.current;
      Y.transact(yPoints.doc as Y.Doc, () => {
        yPoints.push([pointerPosition.x, pointerPosition.y]);
      });

      updateObjectsFromYjs();
    };
    
    const handleMouseUp = () => {
      setIsDrawing(false);

      const { pathId, yPoints } = currentState.current;

      const yPath = yObjects.get(pathId);
      if (yPath) {
        const rawPoints = yPoints.toArray();

        const formattedPoints = [];
        for (let i = 0; i < rawPoints.length; i += 2) {
          formattedPoints.push({ x: rawPoints[i], y: rawPoints[i + 1] });
        }

        const simplified = simplify(formattedPoints, options.current.simplify, false);
        const flattenedSimplified = simplified.flatMap(p => [p.x, p.y]);

        state.after = {
          id: pathId,
          type: 'path',
          points: flattenedSimplified,
          color: options.current.color,
          strokeWidth: options.current.size,
          toolType: 'pen'
        };
        state.id = pathId;

        if (flattenedSimplified.length > 2) {
          Y.transact(yPath.doc as Y.Doc, () => {
            yPoints.delete(0, yPoints.length);
            yPoints.push(flattenedSimplified);
          });
          addToHistory(state);
          updateObjectsFromYjs();
        }
      }
      
      currentState.current = {};
    };
    
    return {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp
    };
  },
  
  processObjects: (objects) => {
    return objects;
  }
};