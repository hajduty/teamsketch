import { FC } from "react";
import { Group, Text, Circle } from "react-konva";
import { AwarenessState } from "../tools/baseTool"; // <-- Import AwarenessState properly

interface CursorsOverlayProps {
  cursors: AwarenessState[];
  scale: number;
}

const COLORS = [
  "#ff4b4b",
  "#4bc0ff",
  "#4bff4b",
  "#ffc04b",
  "#b04bff",
  "#4bffeb",
];

export const CursorsOverlay: FC<CursorsOverlayProps> = ({ cursors, scale }) => {
  return (
    <>
      {cursors.map((cursor, _index) => (
        <Group key={cursor.username} x={cursor.cursorPosition.x} y={cursor.cursorPosition.y}>
          <Circle
            radius={6 / scale}
            fill={COLORS[0]}
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
