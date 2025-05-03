// canvasActions.ts
import * as Y from "yjs";

export function clearCanvas(yObjects: any, ydoc: any) {
    Y.transact(ydoc, () => {
      yObjects.forEach((_: any, key: string) => yObjects.delete(key));
    });
  }
  
  export function undo(
    historyRef: React.RefObject<any[]>,
    setHistory: (h: any[]) => void,
    stageRef: React.RefObject<any>
  ) {
    const currentHistory = historyRef.current;
  
    if (!currentHistory || currentHistory.length === 0) return;
  
    for (let i = currentHistory.length - 1; i >= 0; i--) {
      const item = currentHistory[i];
      if (!item.deleted) {
        const updated = [...currentHistory];
        updated[i] = { ...item, deleted: true };
        setHistory(updated);
  
        const items = stageRef.current?.children[0].children;
        if (items) {
          for (const canvasItem of items) {
            if (canvasItem.attrs?.id === item.id && item.before) {
              for (const key in item.before) {
                if (key !== 'id') {
                  canvasItem.setAttr(key, item.before[key]);
                }
              }
              canvasItem.getLayer()?.batchDraw();
              break;
            }
          }
        }
  
        return;
      }
    }
  }
  
  export function redo(
    historyRef: React.RefObject<any[]>,
    setHistory: (h: any[]) => void,
    stageRef: React.RefObject<any>
  ) {
    const currentHistory = historyRef.current;
  
    if (!currentHistory || currentHistory.length === 0) return;
  
    for (let i = currentHistory.length - 1; i >= 0; i--) {
      const item = currentHistory[i];
      if (item.deleted) {
        const updated = [...currentHistory];
        updated[i] = { ...item, deleted: false };
        setHistory(updated);
  
        const items = stageRef.current?.children[0].children;
        if (items) {
          for (const canvasItem of items) {
            if (canvasItem.attrs?.id === item.id && item.after) {
              for (const key in item.after) {
                if (key !== 'id') {
                  canvasItem.setAttr(key, item.after[key]);
                }
              }
              canvasItem.getLayer()?.batchDraw();
              break;
            }
          }
        }
  
        return;
      }
    }
  }
  