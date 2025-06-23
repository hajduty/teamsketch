import { useRef, useState, useEffect, FC, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { PenTool } from "./tools/penTool";
import { TextTool } from "./tools/textTool";
import { AwarenessState, CanvasObject, Tool } from "./tools/baseTool";
import { TextRender } from "./components/TextRender";
import PenRender from "./components/PenRender";
import { useIsDoubleClick } from "../../hooks/useIsDoubleClick";
import { CursorsOverlay } from "./components/CursorOverlay";
import { SelectTool } from "./tools/selectTool";
import InfiniteGrid from "./components/InfiniteGrid";
import { useAuth } from "../auth/AuthProvider";
import { useCanvasStore } from "./canvasStore";
import Konva from "konva";
import { useCanvasInteractions } from "../../hooks/useCanvasInteractions";
import { wsUrl } from "../../lib/apiClient";
import { Permissions } from "../../types/permission";

export interface CanvasRef {
  clearCanvas: () => void;
  setTool: (tool: string) => void;
  setOption: (key: string, value: any) => void;
  undo: () => void;
  redo: () => void;
  canRedo: boolean;
  canUndo: boolean;
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

export const CanvasBoard: FC<{ roomId: string, role?: string }> = ({ roomId, role }) => {
  const { user, guest } = useAuth();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  //const [role, setRole] = useState<string>("");

  const isDoubleClick = useIsDoubleClick(200);
  const { width, height } = useWindowDimensions();
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentState = useRef<any>({});

  // Yjs setup
  const ydoc = useRef(new Y.Doc()).current;
  const yObjects = useRef(ydoc.getMap<any>("objects")).current;
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<any>(null);
  const [otherCursors, setOtherCursors] = useState<AwarenessState[]>([]);
  const undoManager = useRef(new Y.UndoManager(yObjects, {
    captureTimeout: 200,
    trackedOrigins: new Set([user?.id])
  })).current;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isToolsDisabled = role === "none" || role === "viewer" || role === "";

  const { tool: activeTool, options: toolOptions, init: initCanvasStore, editingId: editingId, addGuestRoom } = useCanvasStore();

  useEffect(() => {
    const setup = async () => {
      await initCanvasStore(ydoc, yObjects, undoManager);

      if (guest) {
        const room: Permissions = { role: "editor", roomId: roomId, userEmail: user!.email };
        addGuestRoom(room);
      }
    };

    setup();
  }, [initCanvasStore, ydoc, yObjects, undoManager]);

  useEffect(() => {
    if (!undoManager) return;

    const updateStatus = () => {
      useCanvasStore.getState().setUndoRedoStatus(
        undoManager.canUndo(),
        undoManager.canRedo()
      );
    };

    undoManager.on('stack-item-added', updateStatus);
    undoManager.on('stack-item-popped', updateStatus);

    updateStatus();

    return () => {
      undoManager.off('stack-item-added', updateStatus);
      undoManager.off('stack-item-popped', updateStatus);
    };
  }, [undoManager]);

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
    const token = localStorage.getItem("token");
    const roomName = roomId;

    providerRef.current = new WebsocketProvider(
      `${wsUrl}/Room/collaboration/${roomName}/${token}`,
      "",
      ydoc
    );

    awarenessRef.current = providerRef.current.awareness;

    awarenessRef.current.setLocalState({
      userId: user?.id,
      username: user?.email,
      cursorPosition: { x: 0, y: 0 },
    });

    awarenessRef.current.on('change', (_changes: any) => {
      const states = Array.from(awarenessRef.current.getStates().values()) as AwarenessState[];
      setOtherCursors(states.filter(s => s.username !== user?.email));
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
    toolOptions, // <-- Use toolOptions from store
    updateObjectsFromYjs,
    activeTool,
    setSelectedId,
    awarenessRef.current?.getLocalState()?.userId,
  );

  const {
    wrappedHandleMouseMove,
    handleWheelZoom,
    handleStageDragEnd,
  } = useCanvasInteractions({
    stageRef,
    providerRef,
    isToolsDisabled,
    handleMouseMove,
    stageScale,
    setStageScale,
    setStagePosition,
    setIsSpacePressed,
  });

  return (
    <>
      <Stage className="m-0 p-0"
        ref={stageRef}
        width={width!}
        height={height!}
        draggable={isSpacePressed}
        scale={{ x: stageScale, y: stageScale }}
        position={stagePosition}
        onWheel={handleWheelZoom}
        onDragEnd={handleStageDragEnd}
        onTouchStart={!isSpacePressed && !isToolsDisabled ? handleMouseDown : undefined}
        onTouchMove={!isSpacePressed ? wrappedHandleMouseMove : undefined}
        onTouchEnd={!isSpacePressed && !isToolsDisabled ? handleMouseUp : undefined}
        onMouseDown={!isSpacePressed && !isToolsDisabled ? handleMouseDown : undefined}
        onMouseMove={!isSpacePressed ? wrappedHandleMouseMove : undefined}
        onMouseUp={!isSpacePressed && !isToolsDisabled ? handleMouseUp : undefined}
        onClick={!isSpacePressed && !isToolsDisabled ? handleClick : undefined}
        onDblClick={(e) => {
          if (!isSpacePressed && !isToolsDisabled && (isDoubleClick() && handleClick)) {
            handleDblClick?.(e);
          }
        }}
      >
        <InfiniteGrid stageRef={stageRef} />
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
                isSelected={selectedId === obj.id}
                stageRef={stageRef}
                userId={user?.id}
                editing={editingId === obj.id}
              />
            ) : null;
          })}
          <CursorsOverlay cursors={otherCursors} scale={stageScale} />
        </Layer>
      </Stage>
    </>
  );
};