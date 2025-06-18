import { CanvasRef } from '../Canvas';
import Icon from '../../../components/Icon';

export const HistoryButtons = ({ canvasRef }: { canvasRef: React.RefObject<CanvasRef | null>; }) => {
  if (!canvasRef.current) return;

  const canUndo = canvasRef.current.canUndo;
  const canRedo = canvasRef.current.canRedo;

  return (
    <div className="bottom-0 right-0 flex flex-row gap-2 w-auto rounded-r-2xl fixed z-3 text-white group m-2">
      <button
        type="button"
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex ${canUndo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={canvasRef.current.undo}
        disabled={!canUndo}
      >
        <Icon iconName="undo" color="redo" />
        {'Undo'}
      </button>

      <button
        type="button"
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex  ${canRedo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={canvasRef.current.redo}
        disabled={!canRedo}
      >
        <Icon iconName="redo" color="redo" />
        {'Redo'}

      </button>
    </div>
  );
}