import { FC, useEffect, useRef, useState } from "react";
import { Group, Text, Circle } from "react-konva";
import { AwarenessState } from "../tools/baseTool";

interface CursorsOverlayProps {
  cursors: AwarenessState[];
  scale: number;
}

interface SmoothedCursor {
  username: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const COLORS = [
  "#ff4b4b",
  "#4bc0ff",
  "#4bff4b",
  "#ffc04b",
  "#b04bff",
  "#4bffeb",
];

const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

export const CursorsOverlay: FC<CursorsOverlayProps> = ({ cursors, scale }) => {
  const [smoothedCursors, setSmoothedCursors] = useState<SmoothedCursor[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    setSmoothedCursors(prev => {
      const newCursors = cursors.map(cursor => {
        const existing = prev.find(p => p.username === cursor.username);
        return {
          username: cursor.username,
          x: existing?.x ?? cursor.cursorPosition.x,
          y: existing?.y ?? cursor.cursorPosition.y,
          targetX: cursor.cursorPosition.x,
          targetY: cursor.cursorPosition.y,
        };
      });
      
      return newCursors.filter(cursor => 
        cursors.some(c => c.username === cursor.username)
      );
    });
  }, [cursors]);

  useEffect(() => {
    const animate = () => {
      setSmoothedCursors(prev => 
        prev.map(cursor => {
          const smoothing = 0.15; 
          const newX = lerp(cursor.x, cursor.targetX, smoothing);
          const newY = lerp(cursor.y, cursor.targetY, smoothing);
          
          return {
            ...cursor,
            x: newX,
            y: newY,
          };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {smoothedCursors.map((cursor, index) => (
        <Group key={cursor.username} x={cursor.x} y={cursor.y}>
          <Circle
            radius={6 / scale}
            fill={COLORS[index % COLORS.length]}
            stroke="white"
            strokeWidth={1 / scale}
          />
          <Text
            text={cursor.username}
            fontSize={Math.round(14 / scale)}
            perfectDrawEnabled={true}
            fill="white"
            stroke="black"
            strokeWidth={0.5 / scale}
            x={10 / scale}
            y={-10 / scale}
          />
        </Group>
      ))}
    </>
  );
};