// tools/textTool.ts
import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolHandlers } from './baseTool';
import * as Y from 'yjs';
import { getTransformedPointer } from '../../../utils/optimizationUtils';

export const TextTool: Tool = {
  create: (
    yObjects: Y.Map<any>,
    _isDrawing: boolean,
    _setIsDrawing: (drawing: boolean) => void,
    _currentState: { current: any },
    options: { current: any },
    updateObjectsFromYjs: () => void,
    activeTool: string
  ): ToolHandlers => {    
    const handleClick = (e: any) => {
      if (activeTool !== 'text') return;

      const clickedOnText = e.target.findAncestor('Text');
      
      Y.transact(yObjects.doc as Y.Doc, () => {
        if (clickedOnText) {
          const textId = clickedOnText.attrs.id;
          yObjects.forEach((obj, id) => {
            if (obj instanceof Y.Map) {
              obj.set('selected', id === textId);
            }
          });
        } else {
          yObjects.forEach((obj) => {
            if (obj instanceof Y.Map) {
              obj.set('selected', false);
            }
          });
        }
      });
      
      updateObjectsFromYjs();
    };

    const handleDblClick = (e: any) => {
      if (activeTool !== 'text') return;

      const stage = e.target.getStage();
      
      if (e.target === stage || e.target.className !== 'Text') {
        const pointerPosition = getTransformedPointer(stage);
        
        if (!pointerPosition) return;

        const textObj = {
          id: uuidv4(),
          type: 'text',
          x: pointerPosition.x,
          y: pointerPosition.y,
          text: 'Sample text',
          fontSize: options.current.fontSize || 16,
          fontFamily: options.current.fontFamily || 'Arial',
          color: options.current.color || '#000000',
          width: 200,
          selected: true,
          rotation: 0
        };

        Y.transact(yObjects.doc as Y.Doc, () => {
          // Deselect all existing text objects
          yObjects.forEach((obj) => {
            if (obj instanceof Y.Map && obj.get('selected')) {
              obj.set('selected', false);
            }
          });

          // Create new text object
          const yTextObj = new Y.Map();
          Object.entries(textObj).forEach(([key, value]) => {
            yTextObj.set(key, value);
          });
          yObjects.set(textObj.id, yTextObj);
        });

        updateObjectsFromYjs();
      }
    };

    return {
      handleMouseDown: () => {},
      handleMouseMove: () => {},
      handleMouseUp: () => {},
      handleClick,
      handleDblClick
    };
  },

  processObjects: (objects) => {
    return objects;
  }
};