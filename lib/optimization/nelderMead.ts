/** Nelder-Mead simplex optimizer (minimize) */
export function nelderMead(
  fn: (x: number[]) => number,
  x0: number[],
  options?: { maxIter?: number; tol?: number }
): number[] {
  const n = x0.length;
  const maxIter = options?.maxIter ?? 1000;
  const tol = options?.tol ?? 1e-8;
  const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;

  // Initialize simplex
  type Vertex = { x: number[]; f: number };
  const simplex: Vertex[] = [];
  simplex.push({ x: [...x0], f: fn(x0) });
  for (let i = 0; i < n; i++) {
    const xi = [...x0];
    xi[i] += Math.max(Math.abs(xi[i]) * 0.05, 0.1);
    simplex.push({ x: xi, f: fn(xi) });
  }

  for (let iter = 0; iter < maxIter; iter++) {
    // Sort by function value
    simplex.sort((a, b) => a.f - b.f);

    // Check convergence
    const fRange = Math.abs(simplex[n].f - simplex[0].f);
    if (fRange < tol) break;

    // Centroid (excluding worst)
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += simplex[i].x[j] / n;
      }
    }

    // Reflection
    const worst = simplex[n];
    const xr = centroid.map((c, j) => c + alpha * (c - worst.x[j]));
    const fr = fn(xr);

    if (fr < simplex[0].f) {
      // Expansion
      const xe = centroid.map((c, j) => c + gamma * (xr[j] - c));
      const fe = fn(xe);
      if (fe < fr) {
        simplex[n] = { x: xe, f: fe };
      } else {
        simplex[n] = { x: xr, f: fr };
      }
    } else if (fr < simplex[n - 1].f) {
      simplex[n] = { x: xr, f: fr };
    } else {
      // Contraction
      const xc = centroid.map((c, j) => c + rho * (worst.x[j] - c));
      const fc = fn(xc);
      if (fc < worst.f) {
        simplex[n] = { x: xc, f: fc };
      } else {
        // Shrink
        for (let i = 1; i <= n; i++) {
          simplex[i].x = simplex[i].x.map((v, j) => simplex[0].x[j] + sigma * (v - simplex[0].x[j]));
          simplex[i].f = fn(simplex[i].x);
        }
      }
    }
  }

  simplex.sort((a, b) => a.f - b.f);
  return simplex[0].x;
}
