import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, sigmoid, lerp } from "../utils";

const CL = ["#7C3AED", "#ff3264", "#ffc800"];

// Logistic regression (gradient descent)
function trainLog(pts) {
  let w = [0, 0], b = 0;
  for (let iter = 0; iter < 500; iter++) {
    let dw0 = 0, dw1 = 0, db = 0;
    for (const p of pts) {
      const pred = sigmoid(w[0] * p.x + w[1] * p.y + b);
      const err = pred - (p.cls === 0 ? 0 : 1);
      dw0 += err * p.x; dw1 += err * p.y; db += err;
    }
    const n = pts.length;
    w[0] -= 0.1 * dw0 / n; w[1] -= 0.1 * dw1 / n; b -= 0.1 * db / n;
  }
  return (x, y) => (sigmoid(w[0] * x + w[1] * y + b) > 0.5 ? 1 : 0);
}

// Polynomial features
function trainPoly(pts, deg) {
  const feats = (x, y) => {
    const f = [1];
    for (let d = 1; d <= deg; d++) for (let i = 0; i <= d; i++) f.push(Math.pow(x, i) * Math.pow(y, d - i));
    return f;
  };
  const dim = feats(0, 0).length;
  let w = Array(dim).fill(0);
  for (let iter = 0; iter < 400; iter++) {
    const dw = Array(dim).fill(0);
    for (const p of pts) {
      const f = feats(p.x, p.y);
      const z = f.reduce((s, fi, i) => s + fi * w[i], 0);
      const pred = sigmoid(z);
      const err = pred - (p.cls === 0 ? 0 : 1);
      f.forEach((fi, i) => dw[i] += err * fi);
    }
    const n = pts.length;
    dw.forEach((d, i) => w[i] -= 0.1 * d / n);
  }
  return (x, y) => { const f = feats(x, y); const z = f.reduce((s, fi, i) => s + fi * w[i], 0); return sigmoid(z) > 0.5 ? 1 : 0; };
}

// RBF kernel
function trainRBF(pts) {
  const gamma = 5;
  return (x, y) => {
    const votes = [0, 0, 0];
    for (const p of pts) {
      const d = (x - p.x) ** 2 + (y - p.y) ** 2;
      votes[p.cls] += Math.exp(-gamma * d);
    }
    return votes.indexOf(Math.max(...votes));
  };
}

// KNN
function trainKNN(pts, k) {
  return (x, y) => {
    const dists = pts.map(p => ({ d: (x - p.x) ** 2 + (y - p.y) ** 2, cls: p.cls })).sort((a, b) => a.d - b.d).slice(0, k);
    const votes = [0, 0, 0];
    dists.forEach(d => votes[d.cls]++);
    return votes.indexOf(Math.max(...votes));
  };
}

export default function DecisionBoundary() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [cls, setCls] = useState(0);
  const [algo, setAlgo] = useState("logistic");
  const [deg, setDeg] = useState(3);
  const [trained, setTrained] = useState(false);
  const [classifyFn, setClassifyFn] = useState(null);
  const [stats, setStats] = useState({ pts: 0, cls: 2 });

  const drawCanvas = useCallback((pts, fn) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(156,163,175,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Decision boundary heatmap
    if (fn) {
      const res = 50;
      const id = ctx.createImageData(W, H);
      for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
        const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
        const c = fn(wx, wy);
        const color = c === 0 ? [124,58,237] : c === 1 ? [255, 50, 100] : [255, 200, 0];
        const i = (py * W + px) * 4;
        id.data[i] = color[0]; id.data[i + 1] = color[1]; id.data[i + 2] = color[2]; id.data[i + 3] = 50;
      }
      ctx.putImageData(id, 0, 0);
    }

    // Points
    for (const p of pts) {
      const px = (p.x + 1) / 2 * W, py = (p.y + 1) / 2 * H;
      const col = CL[p.cls];
      ctx.shadowBlur = 8; ctx.shadowColor = col;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = col + "cc"; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    drawCanvas([], null);
  }, [drawCanvas]);

  const handleClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const newPt = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, cls };
    const newPts = [...points, newPt];
    setPoints(newPts);
    setStats({ pts: newPts.length, cls: new Set(newPts.map(p => p.cls)).size });
    if (trained && classifyFn) drawCanvas(newPts, classifyFn);
    else drawCanvas(newPts, null);
  };

  const classify = () => {
    if (points.length < 2) return;
    let fn;
    switch (algo) {
      case "logistic": fn = trainLog(points); break;
      case "poly": fn = trainPoly(points, deg); break;
      case "rbf": fn = trainRBF(points); break;
      case "knn": fn = trainKNN(points, 5); break;
    }
    if (fn) { setClassifyFn(() => fn); setTrained(true); drawCanvas(points, fn); }
  };

  const addPreset = (type) => {
    let newPts = [];
    if (type === "blobs") {
      for (let i = 0; i < 20; i++) newPts.push({ x: rand(-1, -0.15) + rand(-0.1, 0.1), y: rand(-1, -0.15) + rand(-0.1, 0.1), cls: 0 });
      for (let i = 0; i < 20; i++) newPts.push({ x: rand(0.15, 1) + rand(-0.1, 0.1), y: rand(0.15, 1) + rand(-0.1, 0.1), cls: 1 });
    } else if (type === "xor") {
      for (let i = 0; i < 15; i++) {
        newPts.push({ x: rand(-1, -0.1), y: rand(-1, -0.1), cls: 0 });
        newPts.push({ x: rand(0.1, 1), y: rand(0.1, 1), cls: 0 });
        newPts.push({ x: rand(-1, -0.1), y: rand(0.1, 1), cls: 1 });
        newPts.push({ x: rand(0.1, 1), y: rand(-1, -0.1), cls: 1 });
      }
    } else if (type === "circle") {
      for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(0, 0.4); newPts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 }); }
      for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(0.65, 1); newPts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 1 }); }
    }
    const all = [...points, ...newPts];
    setPoints(all); setTrained(false); setClassifyFn(null);
    setStats({ pts: all.length, cls: new Set(all.map(p => p.cls)).size });
    drawCanvas(all, null);
  };

  const explains = {
    logistic: "Linear boundary via logistic regression. σ(wᵀx+b) models class probability. Best for linearly separable data.",
    poly: `Polynomial features of degree ${deg} map inputs to higher dimensions, enabling curved non-linear boundaries.`,
    rbf: "RBF kernel uses Gaussian similarity — creates smooth radial boundaries. Soft vote from all training points.",
    knn: "KNN (k=5) assigns class by majority vote of 5 nearest training points. Creates Voronoi-like boundaries.",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 16 }}>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={S.cardTitle}>CANVAS — Click to place points</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[["● Class A", 0, "#7C3AED"], ["■ Class B", 1, "#ff3264"], ["▲ Class C", 2, "#ffc800"]].map(([label, c, color]) => (
            <button key={c} onClick={() => setCls(c)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 7, border: `2px solid ${cls === c ? color : "transparent"}`,
              background: cls === c ? color + "18" : "transparent", color, cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: 400, display: "block" }} onClick={handleClick} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>CLASSIFIER</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>Algorithm</div>
            <select style={S.select} value={algo} onChange={e => setAlgo(e.target.value)}>
              <option value="logistic">Logistic Regression</option>
              <option value="poly">Polynomial Kernel</option>
              <option value="rbf">RBF / Gaussian</option>
              <option value="knn">KNN (k=5)</option>
            </select>
          </div>
          {algo === "poly" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={S.label}>Poly Degree</span><span style={S.val}>{deg}</span>
              </div>
              <input type="range" style={S.range} min={1} max={7} step={1} value={deg} onChange={e => setDeg(+e.target.value)} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={classify}>⬡ Classify</button>
            <button style={S.btn("secondary")} onClick={() => { setPoints([]); setTrained(false); setClassifyFn(null); setStats({ pts: 0, cls: 2 }); drawCanvas([], null); }}>Clear</button>
          </div>
          <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.8 }}>{explains[algo]}</div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>PRESETS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["blobs", "xor", "circle"].map(t => (
              <button key={t} style={{ ...S.btn("secondary"), flex: 1, fontSize: 10, textTransform: "capitalize" }} onClick={() => addPreset(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={S.metric}><span style={S.metricVal}>{stats.pts}</span><span style={S.metricLabel}>Points</span></div>
          <div style={S.metric}><span style={S.metricVal}>{stats.cls}</span><span style={S.metricLabel}>Classes</span></div>
        </div>
      </div>
    </div>
  );
}
