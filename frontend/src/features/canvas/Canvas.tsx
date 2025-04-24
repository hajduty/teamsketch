import { useRef, useState, useEffect, forwardRef, useImperativeHandle, FC, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { PenTool } from "./tools/penTool";
import { TextTool } from "./tools/textTool";
import { CanvasObject, Tool, ToolOptions } from "./tools/baseTool";
import { TextRender } from "./components/TextRender";
import PenRender from "./components/PenRender";
import { useIsDoubleClick } from "../../hooks/useIsDoubleClick";

export interface CanvasRef {
  clearCanvas: () => void;
  setTool: (tool: string) => void;
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
  const isDoubleClick = useIsDoubleClick(300);
  const { width, height } = useWindowDimensions();
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("pen");
  const currentState = useRef<any>({});
  const toolOptions = useRef<ToolOptions>({
    color: "white",
    size: 5,
    fontSize: 16,
    fontFamily: "Arial"
  });

  // Yjs setup
  const ydoc = useRef(new Y.Doc()).current;
  const yObjects = useRef(ydoc.getMap<any>("objects")).current;
  const providerRef = useRef<WebsocketProvider | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  const updateObjectsFromYjs = useCallback(() => {
    //console.log('Updating objects from Yjs');
    const allObjects: CanvasObject[] = [];

    yObjects.forEach((value, key) => {
      if (value instanceof Y.Map) {
        const plain: any = { id: key };
        value.forEach((val, subKey) => {
          plain[subKey] = val instanceof Y.Array ? [...val.toArray()] : val;
        });
        allObjects.push(plain);
      }
    });

    setObjects([...allObjects]);
  }, [activeTool, yObjects]);

  useEffect(() => {
    providerRef.current = new WebsocketProvider(
      "wss://localhost:5001/collaboration",
      "ws",
      ydoc,
      { connect: true }
    );

    yObjects.observeDeep(() => {
      updateObjectsFromYjs();
    });

    updateObjectsFromYjs();

    return () => {
      providerRef.current?.disconnect();
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateObjectsFromYjs, yObjects]);

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
    updateObjectsFromYjs,
    activeTool
  );

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      Y.transact(ydoc, () => {
        yObjects.forEach((_, key) => yObjects.delete(key));
      });
    },
    setTool: (tool: string) => {
      setActiveTool(tool);
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
      onDblClick={(e) => {
        if (isDoubleClick() && handleClick) {
          handleDblClick?.(e);
        }
      }}>
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
              updateObjectsFromYjs={updateObjectsFromYjs}
            />
          ) : null;
        })}
      </Layer>
    </Stage>
  );
});