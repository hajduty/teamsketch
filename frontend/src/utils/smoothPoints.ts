import fitCurve from 'fit-curve';

export function smoothPathPoints(
  rawPoints: number[],         // Flat array: [x1, y1, x2, y2, ...]
  bezierError = 8,            // Error tolerance for fit-curve
  bezierSteps = 8              // Number of steps to sample each curve
): number[] {
  // Convert flat to [[x, y]]
  const inputPoints: number[][] = [];
  for (let i = 0; i < rawPoints.length; i += 2) {
    inputPoints.push([rawPoints[i], rawPoints[i + 1]]);
  }

  // Fit bezier curves
  const curves = fitCurve(inputPoints, bezierError);

  // Resample each curve into straight points
  const sampleBezier = (curve: number[][], steps = bezierSteps): number[][] => {
    const [p0, p1, p2, p3] = curve;
    const result: number[][] = [];
    for (let t = 0; t <= 1; t += 1 / steps) {
      const x = Math.pow(1 - t, 3) * p0[0] +
                3 * Math.pow(1 - t, 2) * t * p1[0] +
                3 * (1 - t) * t * t * p2[0] +
                t * t * t * p3[0];
      const y = Math.pow(1 - t, 3) * p0[1] +
                3 * Math.pow(1 - t, 2) * t * p1[1] +
                3 * (1 - t) * t * t * p2[1] +
                t * t * t * p3[1];
      result.push([x, y]);
    }
    return result;
  };

  const smoothedPoints = curves.flatMap(curve => sampleBezier(curve));
  return smoothedPoints.flat(); // Flatten to [x1, y1, x2, y2, ...]
}