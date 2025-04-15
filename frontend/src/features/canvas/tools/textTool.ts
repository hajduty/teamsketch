// tools/textTool.ts
import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolHandlers } from './baseTool';
import * as Y from 'yjs';

export const TextTool: Tool = {
  create: (
    yObjects: Y.Map<any>,
    _isDrawing: boolean,
    _setIsDrawing: (drawing: boolean) => void,
    _currentState: { current: any },
    options: { current: any }
  ): ToolHandlers => {
    const handleClick = (e: any) => {
      if (e.target.className === 'Text') {
        const textNode = e.target;
        const textId = textNode.attrs.id;

        yObjects.forEach((obj, id) => {
          yObjects.set(id, { ...obj, selected: id === textId });
        });
      } else {
        // Deselect all
        yObjects.forEach((obj, id) => {
          if (obj.selected) {
            yObjects.set(id, { ...obj, selected: false });
          }
        });
      }
    };

    const handleDblClick = (e: any) => {
      const stage = e.target.getStage();

      if (e.target === stage) {
        // Double-clicked on empty stage, create text object
        const pointerPosition = stage.getPointerPosition();

        const textObj = {
          id: uuidv4(),
          type: 'text',
          x: pointerPosition.x,
          y: pointerPosition.y,
          text: 'Double-click to edit',
          fontSize: options.current.fontSize || 16,
          fontFamily: options.current.fontFamily || 'Arial',
          color: options.current.color,
          selected: true
        };

        yObjects.forEach((obj, id) => {
          if (obj.selected) {
            yObjects.set(id, { ...obj, selected: false });
          }
        });

        yObjects.set(textObj.id, textObj);
      } else if (e.target.className === 'Text') {
        // Edit existing text object
        const textNode = e.target;
        const textId = textNode.attrs.id;

        const textPosition = textNode.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        const textObj = yObjects.get(textId);
        if (!textObj) return;

        textNode.hide();
        textNode.getLayer().batchDraw();

        const textarea = document.createElement('textarea');
        textarea.value = textObj.text || '';
        document.body.appendChild(textarea);

        textarea.style.position = 'absolute';
        textarea.style.top = `${stageBox.top + textPosition.y}px`;
        textarea.style.left = `${stageBox.left + textPosition.x}px`;
        textarea.style.width = `${Math.max(100, textNode.width())}px`;
        textarea.style.height = `${Math.max(40, textNode.height())}px`;
        textarea.style.fontSize = `${textObj.fontSize}px`;
        textarea.style.fontFamily = textObj.fontFamily;
        textarea.style.color = textObj.color;
        textarea.style.border = '1px solid #999';
        textarea.style.padding = '5px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.resize = 'none';

        textarea.focus();

        const saveText = () => {
          const updatedText = textarea.value;
          document.body.removeChild(textarea);

          yObjects.set(textId, { ...textObj, text: updatedText });
          textNode.show();
          textNode.getLayer().batchDraw();      
        };

        textarea.addEventListener('blur', saveText);
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveText();
          } else if (e.key === 'Escape') {
            document.body.removeChild(textarea);
            textNode.show();
            textNode.getLayer().batchDraw();      
          }
        });
      }
    };


    const handleMouseDown = () => { };
    const handleMouseMove = () => { };
    const handleMouseUp = () => { };

    return {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleClick,
      handleDblClick
    };
  },

  processObjects: (objects) => {
    return objects;
  }
};