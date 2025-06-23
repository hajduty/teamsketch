import React from "react";
import { FC, JSX, useEffect, useState } from "react";
import { Layer, Rect } from "react-konva";

interface GridProps {
  stageRef: any;
}

const BASE_WIDTH = 200;
const BASE_HEIGHT = 200;
const CELL_LIMIT = 500;

const grid = [["#111111", "#111111"], ["#111111", "#111111"]];

const InfiniteGrid: FC<GridProps> = ({ stageRef }) => {
  const [gridCells, setGridCells] = useState<JSX.Element[]>([]);

  useEffect(() => {
    if (!stageRef.current) return;

    const updateGrid = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const scale = stage.scaleX();
      const stageX = stage.x();
      const stageY = stage.y();

      const width = window.innerWidth;
      const height = window.innerHeight;

      let cellSizeMultiplier = 1;
      let actualWidth = BASE_WIDTH;
      let actualHeight = BASE_HEIGHT;

      // Estimate how many base cells are needed to fill viewport
      const estimatedBaseX = Math.ceil(width / (BASE_WIDTH * scale)) + 2;
      const estimatedBaseY = Math.ceil(height / (BASE_HEIGHT * scale)) + 2;
      const estimatedBaseTotal = estimatedBaseX * estimatedBaseY;

      // Adjust multiplier to stay under limit
      while ((estimatedBaseTotal / (cellSizeMultiplier * cellSizeMultiplier)) > CELL_LIMIT) {
        cellSizeMultiplier *= 2;
        actualWidth = BASE_WIDTH * cellSizeMultiplier;
        actualHeight = BASE_HEIGHT * cellSizeMultiplier;
      }

      const worldLeft = -stageX / scale;
      const worldTop = -stageY / scale;
      const worldRight = worldLeft + width / scale;
      const worldBottom = worldTop + height / scale;

      // Snap start to grid size
      const startX = Math.floor(worldLeft / actualWidth) * actualWidth;
      const endX = Math.ceil(worldRight / actualWidth) * actualWidth;
      const startY = Math.floor(worldTop / actualHeight) * actualHeight;
      const endY = Math.ceil(worldBottom / actualHeight) * actualHeight;

      const cells: JSX.Element[] = [];

      for (let x = startX; x < endX; x += actualWidth) {
        const cellX = Math.floor(x / BASE_WIDTH);

        for (let y = startY; y < endY; y += actualHeight) {
          const cellY = Math.floor(y / BASE_HEIGHT);

          const indexX = Math.abs(cellX) % grid.length;
          const indexY = Math.abs(cellY) % grid[0].length;

          const strokeWidth = cellSizeMultiplier > 4 ? 2 : cellSizeMultiplier > 2 ? 1 : 0.5;

          cells.push(
            <Rect
              key={`${cellX}-${cellY}`}
              x={x}
              y={y}
              width={actualWidth}
              height={actualHeight}
              fill={grid[indexX][indexY]}
              stroke="#333333"
              strokeWidth={strokeWidth}
              perfectDrawEnabled={false}
              listening={false}
            />
          );
        }
      }

      setGridCells(cells);
    };

    updateGrid();
    stageRef.current.on('xChange yChange scaleXChange scaleYChange', updateGrid);
    window.addEventListener('resize', updateGrid);

    return () => {
      if (stageRef.current) {
        stageRef.current.off('xChange yChange scaleXChange scaleYChange', updateGrid);
      }
      window.removeEventListener('resize', updateGrid);
    };
  }, [stageRef]);

  return (
    <Layer hitGraphEnabled={false}>
      {gridCells}
    </Layer>
  );
};

const areEqual = (prevProps: GridProps, nextProps: GridProps) => {
  return (
    prevProps.stageRef.current.x === nextProps.stageRef.current.x &&
    prevProps.stageRef.current.y === nextProps.stageRef.current.y &&
    prevProps.stageRef.current.scaleX === nextProps.stageRef.current.scaleX
  );
};

export default React.memo(InfiniteGrid, areEqual);
