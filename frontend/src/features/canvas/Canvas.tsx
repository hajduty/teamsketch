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
import { generateHistoryId, getTransformedPointer } from "../../utils/utils";
import { SelectTool } from "./tools/selectTool";
import { clearCanvas, undo, redo } from "./canvasActions";
import InfiniteGrid from "./components/InfiniteGrid";

export interface CanvasRef {
  clearCanvas: () => void;
  setTool: (tool: string) => void;
  setOption: (key: string, value: any) => void;
  historyState: History[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
}

export interface History {
  id: string;            // Object ID
  historyId?: string;     // Unique history entry ID
  before: any;           // State before change
  after: any;            // State after change
  deleted?: boolean;      // Whether this history entry has been undone
  operation?: string;     // Type of change
}

const TOOLS: Record<string, Tool> = {
  pen: PenTool,
  text: TextTool,
  select: SelectTool
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

  const [history, setHistory] = useState<History[]>([]);
  const historyRef = useRef<History[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const isDoubleClick = useIsDoubleClick(200);
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
  const awarenessRef = useRef<any>(null);
  const [otherCursors, setOtherCursors] = useState<AwarenessState[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Update historyRef whenever history state changes
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const addToHistory = (state: History) => {
    const stateWithId = {
      ...state,
      historyId: state.historyId || generateHistoryId()
    };

    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(state);
    historyRef.current = trimmed;
    historyIndexRef.current++;

    setHistory(prev => {
      const newHistory = [...prev, stateWithId];
      return newHistory;
    });

    const event = new CustomEvent('historyStateChange');
    document.dispatchEvent(event);
  };

  const updateObjectsFromYjs = useCallback(() => {
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

    // Only update if objects actually changed
    setObjects(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(allObjects)) {
        return allObjects;
      }
      return prev;
    });
  }, [yObjects]);


  useEffect(() => {
    providerRef.current = new WebsocketProvider(
      "wss://localhost:5001/collaboration",
      "ws",
      ydoc,
      { connect: true }
    );

    awarenessRef.current = providerRef.current.awareness;

    awarenessRef.current.setLocalState({
      userId: "your-user-id", // Replace dynamically if needed
      username: name,
      cursorPosition: { x: 0, y: 0 },
    });

    awarenessRef.current.on('change', (_changes: any) => {
      const states = Array.from(awarenessRef.current.getStates().values()) as AwarenessState[];
      setOtherCursors(states.filter(s => s.username !== name));
    });

    yObjects.observeDeep(() => {
      updateObjectsFromYjs();
    });

    return () => {
      providerRef.current?.disconnect();
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
    activeTool,
    setSelectedId,
    awarenessRef.current?.getLocalState()?.username,
    addToHistory
  );

  useImperativeHandle(ref, () => ({
    clearCanvas: () => clearCanvas(yObjects, ydoc),
    setTool: (tool: string) => setActiveTool(tool),
    setOption: (key: string, value: any) => {
      toolOptions.current[key] = value;
    },
    get historyState() {
      return historyRef.current;
    },
    get historyIndex() {
      return historyIndexRef.current;
    },
    undo: () => undo(historyRef, setHistory, historyIndexRef, yObjects),
    redo: () => redo(historyRef, setHistory, historyIndexRef, yObjects, ydoc),
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
      <InfiniteGrid stageRef={stageRef}/>
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
              addToHistory={addToHistory}
              isSpacePressed={isSpacePressed}
              isSelected={selectedId === obj.id}
              stageRef={stageRef}
            />
          ) : null;
        })}
        <CursorsOverlay cursors={otherCursors} scale={stageScale} />
      </Layer>
    </Stage>
  );
});