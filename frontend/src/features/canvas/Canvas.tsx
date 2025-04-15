import { useRef, useState, useEffect, forwardRef, useImperativeHandle, FC } from "react";
import { Stage, Layer } from "react-konva";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { PenTool } from "./tools/penTool";
import { TextTool } from "./tools/textTool";
import { CanvasObject, Tool, ToolOptions } from "./tools/baseTool";
import { TextRender } from "./components/TextRender";
import PenRender from "./components/PenRender";

export interface CanvasRef {
  clearCanvas: () => void;
  setColor: (color: string) => void;
  setTool: (tool: string) => void;
  setSize: (size: number) => void;
  setOption: (key: string, value: any) => void;
}

const TOOLS: Record<string, Tool> = {
  pen: PenTool,
  text: TextTool
};

const TOOLS_COMPONENTS: Record<string, FC<any>> = {
  path: PenRender,
  text: TextRender,
};

export const Canvas = forwardRef<CanvasRef>((_, ref) => {
  const { width, height } = useWindowDimensions();
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("pen");
  const currentState = useRef<any>({});
  const toolOptions = useRef<ToolOptions>({
    color: "black",
    size: 5,
    fontSize: 16,
    fontFamily: "Arial"
  });

  const ydoc = useRef(new Y.Doc()).current;
  const yObjects = ydoc.getMap<any>("objects");

  const updateObjectsFromYjs = () => {
    const allObjects: CanvasObject[] = [];
  
    yObjects.forEach((value, key) => {
      const plain = value.toJSON();
  
      allObjects.push({
        ...plain,
        id: key,
      });
    });
  
    const tool = TOOLS[activeTool] || PenTool;
    setObjects(tool.processObjects(allObjects));
  };

  useEffect(() => {
    const provider = new WebsocketProvider("wss://localhost:5001", "ws", ydoc);

    // Listen for changes to yObjects
    yObjects.observe(() => {
      updateObjectsFromYjs();
    });

    provider.connect();

    // Initial load of objects
    updateObjectsFromYjs();

    return () => provider.disconnect();
  }, [activeTool]);

  const tool = TOOLS[activeTool] || PenTool;
  const { 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    handleClick, 
    handleDblClick 
  } = tool.create(
    yObjects,
    isDrawing,
    setIsDrawing,
    currentState,
    toolOptions,
    updateObjectsFromYjs
  );

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      yObjects.forEach((_, key) => {
        yObjects.delete(key);
      });
      setObjects([]);
    },
    setColor: (color: string) => {
      toolOptions.current.color = color;
    },
    setTool: (tool: string) => {
      setActiveTool(tool);
    },
    setSize: (size: number) => {
      toolOptions.current.size = size;
    },
    setOption: (key: string, value: any) => {
      toolOptions.current[key] = value;
    }
  }));

  return (
    <Stage
      width={width!}
      height={height!}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDblClick={handleDblClick}
    >
      <Layer>
        {objects.map((obj) => {
          const ToolComponent = TOOLS_COMPONENTS[obj.type];
          return ToolComponent ? (
            <ToolComponent
              key={obj.id}
              obj={obj}
              yObjects={yObjects}
              toolOptions={toolOptions}
              activeTool={activeTool}
              handleDblClick={handleDblClick}
              updateObjectsFromYjs={updateObjectsFromYjs}
            />
          ) : null;
        })}
      </Layer>
    </Stage>
  );
});