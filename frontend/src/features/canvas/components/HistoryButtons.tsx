import Icon from '../../../components/Icon';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useCanvasStore } from '../canvasStore';

export const HistoryButtons = () => {
  const isMobile = useIsMobile();

  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);

  return (
    <div className="bottom-0 right-0 flex md:flex-row flex-col gap-2 w-auto rounded-r-2xl fixed z-3 text-white group m-2">
      <button
        type="button"
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex ${canUndo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={undo}
        disabled={!canUndo}
      >
        <Icon iconName="undo" color="redo" />
        {!isMobile && 'Undo'}
      </button>

      <button
        type="button"
        className={`p-2 bg-neutral-950 border border-neutral-700 rounded-md flex  ${canRedo ? "bg-neutral-950 hover:bg-black" : "bg-neutral-600 text-zinc-400"}`}
        onClick={redo}
        disabled={!canRedo}
      >
        <Icon iconName="redo" color="redo" />
        {!isMobile && 'Redo'}
      </button>
    </div>
  );
}