// @ts-nocheck
import { useCallback, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import Konva from "konva";
import { getTransformedPointer } from "../utils/utils";
import { useCanvasStore } from "../features/canvas/canvasStore";

interface UseCanvasInteractionsProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  providerRef: React.MutableRefObject<any>;
  isToolsDisabled: boolean;
  handleMouseMove?: (e: any) => void;
  stageScale: number;
  setStageScale: (scale: number) => void;
  setStagePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsSpacePressed: (pressed: boolean) => void;
}

export function useCanvasInteractions({
  stageRef,
  providerRef,
  isToolsDisabled,
  handleMouseMove,
  stageScale,
  setStageScale,
  setStagePosition,
  setIsSpacePressed,
}: UseCanvasInteractionsProps) {
  // Debounced awareness cursor update
  const debouncedSetCursor = useMemo(() =>
    debounce((x: number, y: number) => {
      if (providerRef.current) {
        providerRef.current.awareness.setLocalStateField("cursorPosition", { x, y });
      }
    }, 16)
    , [providerRef]);

  const editing = useCanvasStore(state => state.editing);

  useEffect(() => {
    console.log("editing is", editing); // this logs correctly
  }, [editing]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => debouncedSetCursor.cancel();
  }, [debouncedSetCursor]);

  // Wrapped mouse move handler that updates awareness cursor
  const wrappedHandleMouseMove = useCallback((e: any) => {
    if (isToolsDisabled) return;
    handleMouseMove?.(e);

    const stage = stageRef.current;
    if (!stage || !providerRef.current) return;

    const pointerPos = getTransformedPointer(stage);
    if (!pointerPos) return;

    debouncedSetCursor(pointerPos.x, pointerPos.y);
  }, [isToolsDisabled, handleMouseMove, stageRef, providerRef, debouncedSetCursor]);

  // Space key toggles draggable
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editing) return;

    if (e.code === "Space") {
      stageRef.current?.draggable(true);
      setIsSpacePressed(true);
    }
  }, [stageRef, setIsSpacePressed, editing]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (editing) return;

    if (e.code === "Space") {
      stageRef.current?.draggable(false);
      setIsSpacePressed(false);
    }
  }, [stageRef, setIsSpacePressed, editing]);

  // Wheel zoom handler
  const handleWheelZoom = useCallback((e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePosition(newPos);
  }, [stageRef, stageScale, setStageScale, setStagePosition]);

  // Drag end handler
  const handleStageDragEnd = useCallback((e: any) => {
    setStagePosition(e.target.position());
  }, [setStagePosition]);

  // Attach key listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mobile handlers
  useEffect(() => {
    const stage = stageRef.current?.getStage();
    if (!stage) return;

    const content = stage.content;

    let lastDist = 0;
    let lastCenter = { x: 0, y: 0 };

    const getDistance = (p1: Touch, p2: Touch) => {
      return Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
    };

    const getCenter = (p1: Touch, p2: Touch) => {
      return {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        setIsSpacePressed(true); // prevent drawing
        lastDist = getDistance(e.touches[0], e.touches[1]);
        lastCenter = getCenter(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [touch1, touch2] = e.touches;
        const center = getCenter(touch1, touch2);

        const dx = center.x - lastCenter.x;
        const dy = center.y - lastCenter.y;

        setStagePosition(pos => ({
          x: pos.x + dx,
          y: pos.y + dy,
        }));

        lastCenter = center;

        //const dist = getDistance(touch1, touch2);
        //const scaleBy = dist / lastDist;
        //setStageScale(Math.max(0.1, Math.min(stageScale * scaleBy, 5)));
        //lastDist = dist;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsSpacePressed(false);
      }
    };

    content.addEventListener("touchstart", handleTouchStart, { passive: false });
    content.addEventListener("touchmove", handleTouchMove, { passive: false });
    content.addEventListener("touchend", handleTouchEnd);
    content.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      content.removeEventListener("touchstart", handleTouchStart);
      content.removeEventListener("touchmove", handleTouchMove);
      content.removeEventListener("touchend", handleTouchEnd);
      content.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [stageRef, setIsSpacePressed, setStagePosition, setStageScale]);

  return {
    wrappedHandleMouseMove,
    handleKeyDown,
    handleKeyUp,
    handleWheelZoom,
    handleStageDragEnd,
  };
}
