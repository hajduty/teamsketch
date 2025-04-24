import { FC } from "react";
import { CanvasRef } from "../Canvas";
import EditableDropdown from "../../../components/EditableDropdown";
import { Color } from "../../../components/Color";

const PenOptions = ({ canvasRef }: { canvasRef: React.RefObject<CanvasRef | null>; }) => {
  const options = ["2", "8", "32", "64"];
  const simplifyOptions = ["0.5", "1", "2.5", "3"];
  const tensionOptions = ["0.5", "1", "2.5", "3"];

  return (
    <>
      <div className="m-6 text-sm select-none">
        <h1 className="text-xl -mx-2 -mt-2 my-8">Pen tool</h1>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-md font-medium mb-1">Stroke</h1>
            <div className="flex flex-row gap-6 items-center justify-between">
              <p className="text-sm font-light">Weight</p>
              <div className="w-22">
                <EditableDropdown
                  options={options}
                  placeholder="24"
                  onChange={(value: any) => canvasRef.current?.setOption("size", value)}
                />
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center justify-between mt-2">
              <p className="text-sm font-light">Color</p>
              <div className="w-22">
                <Color onChange={(value: any) => canvasRef.current?.setOption("color", value)} />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-md font-medium mb-2">Smoothness</h1>
            <div className="flex flex-row gap-6 items-center justify-between">
              <p className="text-sm font-light">Simplify</p>
              <div className="w-22">
                <EditableDropdown
                  options={simplifyOptions}
                  placeholder="1"
                  onChange={(value: any) => canvasRef.current?.setOption("simplify", value)}
                />
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center justify-between mt-2">
              <p className="text-sm font-light">Tension</p>
              <div className="w-22">
                <EditableDropdown
                  options={tensionOptions}
                  placeholder="0.5"
                  onChange={(value: any) => canvasRef.current?.setOption("tension", value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const TextOptions = ({ canvasRef }: { canvasRef: React.RefObject<CanvasRef | null>; }) => {
  const fontSize = ["8", "9", "11", "12", "14", "18", "24", "30", "36", "48", "60", "72", "96"];

  return (
    <>
      <div className="m-6 text-sm select-none">
        <h1 className="text-xl -mx-2 -mt-2 my-8">Text tool</h1>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-row gap-6 items-center justify-between mt-2">
              <p className="text-sm font-light">Size</p>
              <div className="w-22">
                <EditableDropdown
                  options={fontSize}
                  placeholder="16"
                  onChange={(value: any) => canvasRef.current?.setOption("fontSize", value)}
                />
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center justify-between mt-2">
              <p className="text-sm font-light">Color</p>
              <div className="w-22">
                <Color onChange={(value: any) => canvasRef.current?.setOption("color", value)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const ToolOptions = ({ tool, canvasRef }: { tool: string; canvasRef: React.RefObject<CanvasRef | null>; }) => {
  const TOOL_OPTIONS: Record<string, FC<any>> = {
    pen: PenOptions,
    text: TextOptions,
  };

  const ToolComponent = TOOL_OPTIONS[tool];

  return (
    <div className="flex flex-col w-52 -translate-x-44 hover:translate-x-0 rounded-r-2xl bg-zinc-950 fixed min-h-72 h-auto top-1/2 -translate-y-1/2 left-0 z-3 transform duration-150 border-border border-1 text-white group">
      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-white left-0 top-0">
        {ToolComponent ?
          <ToolComponent canvasRef={canvasRef} />
          :
          null
        }
      </div>
    </div>
  );
};
