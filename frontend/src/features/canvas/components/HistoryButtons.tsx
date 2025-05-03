import { CanvasRef } from "../Canvas";

export const HistoryButtons = ({ canvasRef }: { canvasRef: React.RefObject<CanvasRef | null>; }) => {
  const canRedo = (): boolean => {
    const lastHistoryItem = canvasRef.current?.historyState?.[canvasRef.current.historyState.length - 1];
    if (lastHistoryItem && lastHistoryItem.deleted)
      return true;

    return false;
  }

  return (
    <>
      <div className="bottom-0 right-0 flex flex-row gap-2 w-auto rounded-r-2xl fixed z-3 text-white group m-2">
        <button type="button" className="bg-zinc-950 rounded-lg p-2" onClick={canvasRef.current?.undo}>
          {'< Undo'}
        </button>
        { canRedo() &&
          <button type="submit" className="bg-zinc-950 rounded-lg p-2">
            {'> Redo'}
          </button>
        }
      </div>
    </>
  )
}