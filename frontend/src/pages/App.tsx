import { useEffect, useRef, useState } from "react"
import { Canvas, CanvasRef } from "../features/canvas/Canvas";
import { Toolbar } from "../features/canvas/components/Toolbar";
import { ToolOptions } from "../features/canvas/components/ToolOptions";
import { HistoryButtons } from "../features/canvas/components/HistoryButtons";

function App() {
  const [name, setName] = useState<string>("");
  const [enteredName, setEnteredName] = useState<boolean>(false);

  const canvasRef = useRef<CanvasRef>(null);
  const [tool, setTool] = useState<string>("pen");

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.setTool(tool);
    }
  }, [tool]);

  if (!enteredName) {
    return (
      <>
        <div className="bg-white-900 mt-16">
          <div className="pt-44 text-center h-72 flex flex-col gap-2">
            <h1 className="text-5xl text-center select-none">TeamSketch</h1>
            <p className="text-sm font-light text-center select-none">Real-time sketch collaboration</p>
          </div>
          <div className="flex flex-row h-60 justify-center items-center gap-2 font-light">
            <input type="text" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-sm decoration-0 outline-0 text-black p-2 border-2 border-gray-950" />
            <button type="button" className="px-4 p-2 rounded-md bg-black cursor-pointer text-white" onClick={() => setEnteredName(true)}>Start</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <HistoryButtons canvasRef={canvasRef}/>
      <Toolbar tool={tool} setTool={setTool} />
      <ToolOptions tool={tool} canvasRef={canvasRef}/>
      <div className="flex flex-row h-screen justify-center align-middle items-center justify-items-center bg-neutral-800 relative">
        <Canvas ref={canvasRef} name={name}/>
      </div>
    </>
  )
}

export default App
