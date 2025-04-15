export const compressStroke = (points: number[]): number[] => {
  if (points.length <= 4) return points;

  const compressed = [points[0], points[1]];
  for (let i = 2; i < points.length; i += 2) {
    compressed.push(points[i] - points[i - 2]);
    compressed.push(points[i + 1] - points[i - 1]);
  }
  return compressed;
};

export const decompressStroke = (compressed: number[]): number[] => {
  if (compressed.length <= 4) return compressed;

  const points = [compressed[0], compressed[1]];
  for (let i = 2; i < compressed.length; i += 2) {
    points.push(points[i - 2] + compressed[i]);
    points.push(points[i - 1] + compressed[i + 1]);
  }
  return points;
};

export const validateStroke = (stroke: any): boolean => {
  return stroke?.points?.length > 0 &&
    stroke.color &&
    stroke.tool &&
    stroke.points.every(Number.isFinite);
};