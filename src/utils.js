export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const fmt = (n, d = 4) => (isFinite(n) ? Number(n).toFixed(d) : "—");

export const CL = ["#7C3AED", "#ff3264", "#ffc800"];

// Tiny matrix ops for polynomial regression
export function polyFeatures(x, deg) {
  const f = [1];
  for (let i = 1; i <= deg; i++) f.push(Math.pow(x, i));
  return f;
}

export function lsqSolve(X, y) {
  // Normal equation: theta = (X^T X)^{-1} X^T y  (small matrices only)
  const n = X.length, m = X[0].length;
  const XtX = Array.from({ length: m }, () => Array(m).fill(0));
  const Xty = Array(m).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < m; k++) XtX[j][k] += X[i][j] * X[i][k];
    }
  }
  // Gaussian elimination
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < m; col++) {
    let max = col;
    for (let row = col + 1; row < m; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[max][col])) max = row;
    [aug[col], aug[max]] = [aug[max], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-10) continue;
    for (let row = 0; row < m; row++) {
      if (row === col) continue;
      const f = aug[row][col] / aug[col][col];
      for (let k = col; k <= m; k++) aug[row][k] -= f * aug[col][k];
    }
  }
  return aug.map((row, i) => row[m] / row[i]);
}
