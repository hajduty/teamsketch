// canvasActions.ts
import * as Y from "yjs";

export function clearCanvas(yObjects: any, ydoc: any) {
  Y.transact(ydoc, () => {
    yObjects.forEach((_: any, key: string) => yObjects.delete(key));
  });
}

/* export function undo(
  historyRef: React.RefObject<any[]>,
  setHistory: (h: any[]) => void,
  historyIndexRef: React.RefObject<number>,
  yObjects: Y.Map<any>
) {
  const currentHistory = historyRef.current;

  if (!currentHistory || currentHistory.length === 0) return;

  for (let i = currentHistory.length - 1; i >= 0; i--) {
    const item: History = currentHistory[i];
    if (!item.deleted) {
      const updated = [...currentHistory];
      updated[i] = { ...item, deleted: true };
      setHistory(updated);

      const yObject: Y.Map<any> = yObjects.get(item.id);
      if (!item.before && yObject && item.operation == "create") {
        yObjects.delete(item.id);
      }

      if (yObject && item.before) {
        for (const key in item.before) {
          if (key !== 'id') {
            yObject.set(key, item.before[key]);
          }
        }
      }

      historyIndexRef.current--;
      console.log(historyIndexRef.current);
      return;
    }
  }
}

export function redo(
  historyRef: React.RefObject<any[]>,
  setHistory: (h: any[]) => void,
  historyIndexRef: React.RefObject<number>,
  yObjects: Y.Map<any>,
  yDoc: any
) {
  const currentHistory = historyRef.current;

  if (!currentHistory || currentHistory.length === 0) return;

  for (let i = 0; i < currentHistory.length; i++) {
    const item = currentHistory[i];
    if (item.deleted) {  
      const updated = [...currentHistory];
      updated[i] = { ...item, deleted: false };
      setHistory(updated);

      if (item.before && item.operation != "create") {
        const yObject = yObjects.get(item.id);
        if (yObject && item.after) {
          for (const key in item.after) {
            if (key !== 'id') {
              yObject.set(key, item.after[key]);
            }
          }
        }
      }
    
      if (item.operation === "create") {
        Y.transact(yDoc, () => {
          const yPath = new Y.Map();

          for (const [key, value] of Object.entries(item.after)) {
            if (key === 'points' && Array.isArray(value)) {
              const yPoints = new Y.Array();
              yPoints.push(value);
              yPath.set('points', yPoints);
            } else {
              yPath.set(key, value);
            }
          }

          const objectId = item.after.id;
          yObjects.set(objectId, yPath);
        });
      }

      historyIndexRef.current++;
      dispatchHistoryChangeEvent();
      console.log(historyIndexRef.current);
      return;
    }
  }
}

export const dispatchHistoryChangeEvent = () => {
  const event = new CustomEvent('historyStateChange');
  document.dispatchEvent(event);
};
 */