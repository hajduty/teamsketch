import { useRef, useState, useEffect, forwardRef, useImperativeHandle, FC, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { PenTool } from "./tools/penTool";
import { TextTool } from "./tools/textTool";
import { AwarenessState, CanvasObject, Tool, ToolOptions } from "./tools/baseTool";
import { TextRender } from "./components/TextRender";
import PenRender from "./components/PenRender";
import { useIsDoubleClick } from "../../hooks/useIsDoubleClick";
import { CursorsOverlay } from "./components/CursorOverlay";
import { getTransformedPointer } from "../../utils/optimizationUtils";

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

export const Canvas = forwardRef<CanvasRef, { name: string }>(({ name }, ref) => {
  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const isDoubleClick = useIsDoubleClick(150);
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
  const [otherCursors, setOtherCursors] = useState<AwarenessState[]>([]);

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

    const awareness = providerRef.current.awareness;

    awareness.setLocalState({
      userId: "your-user-id", // Replace dynamically if needed
      username: name,
      cursorPosition: { x: 0, y: 0 },
    });

    // Listen for awareness updates
    awareness.on('change', (changes: any) => {
      const states = Array.from(awareness.getStates().values()) as AwarenessState[];
      setOtherCursors(states.filter(s => s.username !== name));
    });


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

  const wrappedHandleMouseMove = (e: any) => {
    handleMouseMove?.(e);

    const stage = stageRef.current;
    if (!stage || !providerRef.current) return;

    const pointerPos = getTransformedPointer(stage);
    if (!pointerPos) return;

    providerRef.current.awareness.setLocalStateField('cursorPosition', {
      x: pointerPos.x,
      y: pointerPos.y,
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      const stage = stageRef.current;
      if (stage) {
        stage.draggable(true);
      }
      setIsSpacePressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      const stage = stageRef.current;
      if (stage) {
        stage.draggable(false);
      }
      setIsSpacePressed(false);
    }
  }, []);


  const handleWheelZoom = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer!.x - stage.x()) / oldScale,
      y: (pointer!.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer!.x - mousePointTo.x * newScale,
      y: pointer!.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  }, [stageScale]);

  const handleStageDragEnd = useCallback((e: any) => {
    setStagePosition(e.target.position());
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <Stage
      ref={stageRef}
      width={width!}
      height={height!}
      draggable={isSpacePressed}
      scale={{ x: stageScale, y: stageScale }}
      position={stagePosition}
      onWheel={handleWheelZoom}
      onDragEnd={handleStageDragEnd}
      onMouseDown={!isSpacePressed ? handleMouseDown : undefined}
      onMouseMove={!isSpacePressed ? wrappedHandleMouseMove : undefined}
      onMouseUp={!isSpacePressed ? handleMouseUp : undefined}
      onClick={!isSpacePressed ? handleClick : undefined}
      onDblClick={(e) => {
        if (!isSpacePressed && (isDoubleClick() && handleClick)) {
          handleDblClick?.(e);
        }
      }}
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
            updateObjectsFromYjs={updateObjectsFromYjs}
            isSpacePressed={isSpacePressed}
            />
          ) : null;
        })}
        <CursorsOverlay cursors={otherCursors} scale={stageScale} />
      </Layer>
    </Stage>
  );
});