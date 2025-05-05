import { useState, useEffect, useCallback } from 'react';
import { CanvasRef } from '../Canvas';

export const HistoryButtons = ({ canvasRef }: { canvasRef: React.RefObject<CanvasRef | null>; }) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = useCallback(() => {
    if (!canvasRef.current) return;

    setCanUndo((canvasRef.current.historyIndex || 0) >= 0);
    setCanRedo(
      (canvasRef.current.historyIndex || 0) < 
      (canvasRef.current.historyState?.length || 0) - 1
    );
  }, [canvasRef]);

  useEffect(() => {
    updateHistoryState();

    const handleHistoryChange = () => {
      updateHistoryState();
    };

    document.addEventListener('historyStateChange', handleHistoryChange);
    
    return () => {
      document.removeEventListener('historyStateChange', handleHistoryChange);
    };
  }, [updateHistoryState]);

  const redo = () => {
    if (!canvasRef.current) return;
    canvasRef.current.redo();
    updateHistoryState();
  };

  const undo = () => {
    if (!canvasRef.current) return;
    canvasRef.current.undo();
    updateHistoryState();
  };

  return (
    <div className="bottom-0 right-0 flex flex-row gap-2 w-auto rounded-r-2xl fixed z-3 text-white group m-2">
      <button 
        type="button" 
        className={`rounded-lg p-2 ${canUndo ? "bg-neutral-950" : "bg-neutral-600 text-zinc-400"}`}
        onClick={undo}
        disabled={!canUndo}
      >
        {'< Undo'}
      </button>
      
      <button 
        type="button" 
        className={`rounded-lg p-2 ${canRedo ? "bg-neutral-950" : "bg-neutral-600 text-zinc-400"}`}
        onClick={redo}
        disabled={!canRedo}
      >
        {'> Redo'}
      </button>
    </div>
  );
}