import { useState, useEffect, useCallback } from 'react';
import { CanvasRef } from '../Canvas';
import Icon from '../../../components/Icon';

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
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex ${canUndo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={undo}
        disabled={!canUndo}
      >
        <Icon iconName="undo" color="redo" />
        {'Undo'}
      </button>

      <button
        type="button"
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex  ${canRedo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={redo}
        disabled={!canRedo}
      >
        <Icon iconName="redo" color="redo" />
        {'Redo'}

      </button>
    </div>
  );
}