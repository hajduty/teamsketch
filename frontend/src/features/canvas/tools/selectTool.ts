// tools/selectTool.ts
import { Tool, ToolHandlers } from './baseTool';
import * as Y from 'yjs';

export const SelectTool: Tool = {
  create: (
    yObjects: Y.Map<any>,
    _isDrawing: boolean,
    _setIsDrawing: (drawing: boolean) => void,
    _currentState: { current: any },
    _options: { current: any },
    updateObjectsFromYjs: () => void,
    _activeTool: string,
    _setSelectedId: (id: string) => void,
    _userId: string
  ): ToolHandlers => {
    const handleClick = (e: any) => {
      const node = e.target;
      const validTypes = ['Text', 'Line'];
    
      const targetNode = validTypes.includes(node.getClassName())
        ? node
        : node.findAncestor((n: any) => validTypes.includes(n.getClassName()));
        console.log('Clicked:', node.getClassName(), node.attrs.id);
    
      Y.transact(yObjects.doc as Y.Doc, () => {
        if (targetNode && targetNode.attrs.id) {
          const selectedId = targetNode.attrs.id;
          yObjects.forEach((obj, id) => {
            if (obj instanceof Y.Map) {
              obj.set('selected', id === selectedId);
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
    
    
    return {
      handleClick,
      handleMouseDown: () => { },
      handleMouseMove: () => { },
      handleMouseUp: () => { }
    };
  },

  processObjects: (objects) => {
    return objects;
  }
};