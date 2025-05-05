import simplify from 'simplify-js';
import fitCurve from 'fit-curve';

type Point = { x: number; y: number };

export function smoothPathPoints(
  rawPoints: number[],         // Flat array: [x1, y1, x2, y2, ...]
  simplifyTolerance = 1.0,     // Tolerance for simplifying before curve fit
  bezierError = 10,            // Error tolerance for fit-curve
  bezierSteps = 8              // Number of steps to sample each curve
): number[] {
  // Convert flat to [{ x, y }]
  const points: Point[] = [];
  for (let i = 0; i < rawPoints.length; i += 2) {
    points.push({ x: rawPoints[i], y: rawPoints[i + 1] });
  }

  // Optional simplify before fitting
  const simplified = simplify(points, simplifyTolerance, false);
  const inputPoints = simplified.map(p => [p.x, p.y]);

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
