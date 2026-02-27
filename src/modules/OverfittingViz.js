import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, polyFeatures, lsqSolve, fmt } from "../utils";

const trueFn = (x) => Math.sin(x * 2) * 0.5 + x * 0.15;

export default function OverfittingViz() {
  const canvasRef = useRef(null);
  const bvRef     = useRef(null);
  const [deg, setDeg]         = useState(1);
  const [noise, setNoise]     = useState(0.2);
  const [trainN, setTrainN]   = useState(15);
  const [data, setData]       = useState({ train: [], test: [] });
  const [errors, setErrors]   = useState({ train: "—", test: "—" });
  const [fitState, setFitState] = useState("underfit");

  const genData = useCallback((n, ns) => {
    const all = [];
    for (let i = 0; i < 55; i++) {
      const x = rand(-Math.PI, Math.PI);
      all.push({ x, y: trueFn(x) + (Math.random() - 0.5) * ns * 2 });
    }
    all.sort(() => Math.random() - 0.5);
    return { train: all.slice(0, n), test: all.slice(n, n + 20) };
  }, []);

  const fitPoly = (pts, d) => {
    if (pts.length < 2) return null;
    const X = pts.map(p => polyFeatures(p.x, d));
    const y = pts.map(p => p.y);
    try { return lsqSolve(X, y); } catch { return null; }
  };

  const mse = (pts, coeffs) => {
    if (!coeffs || pts.length === 0) return Infinity;
    const sum = pts.reduce((s, p) => {
      const pred = polyFeatures(p.x, coeffs.length - 1).reduce((a, f, i) => a + f * coeffs[i], 0);
      return s + (p.y - pred) ** 2;
    }, 0);
    return sum / pts.length;
  };

  const drawMain = useCallback((d, coeffs, dg) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const xToC = x => ((x + Math.PI) / (2 * Math.PI)) * W;
    const yToC = y => H / 2 - y * (H / 5);

    // Grid
    ctx.strokeStyle = "rgba(156,163,175,0.05)"; ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    // True function
    ctx.beginPath();
    for (let px = 0; px < W; px++) {
      const wx = (px / W) * 2 * Math.PI - Math.PI;
      const wy = yToC(trueFn(wx));
      px === 0 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy);
    }
    ctx.strokeStyle = "rgba(156,163,175,0.2)"; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);

    // Fitted curve
    if (coeffs) {
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const wx = (px / W) * 2 * Math.PI - Math.PI;
        const feats = polyFeatures(wx, coeffs.length - 1);
        const pred = feats.reduce((a, f, i) => a + f * coeffs[i], 0);
        const wy = yToC(pred);
        px === 0 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy);
      }
      const stateColor = fitState === "underfit" ? "#ffc800" : fitState === "overfit" ? "#ff3264" : "#7C3AED";
      ctx.strokeStyle = stateColor; ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12; ctx.shadowColor = stateColor;
      ctx.stroke(); ctx.shadowBlur = 0;
    }

    // Test points
    for (const p of (d.test || [])) {
      const px = xToC(p.x), py = yToC(p.y);
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168,85,247,0.5)"; ctx.fill();
      ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 1; ctx.stroke();
    }

    // Train points
    for (const p of (d.train || [])) {
      const px = xToC(p.x), py = yToC(p.y);
      ctx.shadowBlur = 6; ctx.shadowColor = "#7C3AED";
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#7C3AEDcc"; ctx.fill();
      ctx.strokeStyle = "#7C3AED"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Labels
    ctx.fillStyle = "rgba(156,163,175,0.3)"; ctx.font = "9px Inter"; ctx.textAlign = "left";
    ctx.fillStyle = "#7C3AEDaa"; ctx.fillText("● Train", 10, 14);
    ctx.fillStyle = "#a855f7aa"; ctx.fillText("● Test", 70, 14);
    ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.fillText("- - True fn", 130, 14);
  }, [fitState]);

  const drawBV = useCallback((te, tr) => {
    const canvas = bvRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(156,163,175,0.05)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    if (!tr.length || !te.length) return;
    const allV = [...tr, ...te].filter(isFinite);
    if (!allV.length) return;
    const mx = Math.min(Math.max(...allV), 5), mn = 0, r = mx - mn || 1;
    const yS = v => H - (Math.min(v, mx) - mn) / r * (H - 8) - 4;
    const xS = i => (i / (Math.max(tr.length, te.length) - 1)) * W;
    // Test line
    ctx.beginPath(); te.forEach((v, i) => { const y = yS(v); i === 0 ? ctx.moveTo(xS(i), y) : ctx.lineTo(xS(i), y); });
    ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2.5; ctx.stroke();
    // Train line
    ctx.beginPath(); tr.forEach((v, i) => { const y = yS(v); i === 0 ? ctx.moveTo(xS(i), y) : ctx.lineTo(xS(i), y); });
    ctx.strokeStyle = "#7C3AED"; ctx.lineWidth = 2.5; ctx.stroke();
    // Labels
    ctx.fillStyle = "#7C3AED"; ctx.font = "8px Inter"; ctx.textAlign = "right";
    ctx.fillText("train", W - 4, 12);
    ctx.fillStyle = "#a855f7"; ctx.fillText("test", W - 4, 24);
  }, []);

  const [bvData, setBvData] = useState({ te: [], tr: [] });

  useEffect(() => {
    const d = genData(trainN, noise);
    setData(d);
    const coeffs = fitPoly(d.train, deg);
    const te = mse(d.test, coeffs), tr = mse(d.train, coeffs);
    setErrors({ train: fmt(tr, 4), test: fmt(te, 4) });
    const st = tr < 0.005 && te < 0.02 ? "fit" : deg < 3 ? "underfit" : te > tr * 3 ? "overfit" : "fit";
    setFitState(st);

    // Bias-variance sweep
    const teArr = [], trArr = [];
    for (let d2 = 1; d2 <= 12; d2++) {
      const c2 = fitPoly(d.train, d2);
      teArr.push(mse(d.test, c2)); trArr.push(mse(d.train, c2));
    }
    setBvData({ te: teArr, tr: trArr });

    setTimeout(() => { drawMain(d, coeffs, deg); drawBV(teArr, trArr); }, 50);
  }, [deg, noise, trainN, genData]);

  useEffect(() => { drawBV(bvData.te, bvData.tr); }, [bvData, drawBV]);
  useEffect(() => {
    const d2 = genData(trainN, noise); const coeffs = fitPoly(d2.train, deg);
    drawMain(d2, coeffs, deg);
  }, [data, fitState, drawMain]);

  const stateInfo = {
    underfit: { color: "#ffc800", label: "UNDERFITTING", desc: "Model too simple. High bias. Fails to capture signal." },
    fit:      { color: "#7C3AED", label: "GOOD FIT", desc: "Model generalization is optimal. Sweet spot!" },
    overfit:  { color: "#ff3264", label: "OVERFITTING", desc: "Model too complex. High variance. Memorizes noise." },
  };
  const info = stateInfo[fitState];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={S.cardTitle}>POLYNOMIAL FIT</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: info.color, boxShadow: `0 0 10px ${info.color}` }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: info.color, letterSpacing: 1, fontFamily: "Inter" }}>{info.label}</span>
            </div>
          </div>
          <div style={S.canvasWrap}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 320, display: "block" }} />
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>BIAS-VARIANCE TRADEOFF (degree 1→12)</div>
          <div style={S.canvasWrap}>
            <canvas ref={bvRef} style={{ width: "100%", height: 110, display: "block" }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 9, color: "rgba(156,163,175,0.3)", fontFamily: "Inter, sans-serif" }}>
            <span style={{ color: "#7C3AED" }}>— Train MSE</span>
            <span style={{ color: "#a855f7" }}>— Test MSE</span>
            <span>Current degree: {deg}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>CONTROLS</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Polynomial Degree</span><span style={{ ...S.val }}>{deg}</span>
            </div>
            <input type="range" style={S.range} min={1} max={12} step={1} value={deg} onChange={e => setDeg(+e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Noise Level</span><span style={S.val}>{noise.toFixed(2)}</span>
            </div>
            <input type="range" style={S.range} min={0.05} max={1} step={0.05} value={noise} onChange={e => setNoise(+e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Training Points</span><span style={S.val}>{trainN}</span>
            </div>
            <input type="range" style={S.range} min={5} max={40} step={1} value={trainN} onChange={e => setTrainN(+e.target.value)} />
          </div>
          <button style={{ ...S.btn("secondary"), width: "100%" }} onClick={() => { const d = genData(trainN, noise); setData(d); }}>
            ↺ Resample Data
          </button>
        </div>

        <div style={{ ...S.card, borderColor: info.color + "40" }}>
          <div style={{ ...S.cardTitle, color: info.color }}>{info.label}</div>
          <div style={{ ...S.infoBox(fitState === "overfit" ? "danger" : fitState === "underfit" ? "warn" : "default"), fontSize: 10, lineHeight: 1.9 }}>
            {info.desc}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>ERROR METRICS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ ...S.metric, borderColor: "rgba(124,58,237,0.2)" }}>
              <span style={S.metricVal}>{errors.train}</span>
              <span style={S.metricLabel}>Train MSE</span>
            </div>
            <div style={{ ...S.metric, borderColor: "rgba(168,85,247,0.2)" }}>
              <span style={{ ...S.metricVal, color: "#a855f7" }}>{errors.test}</span>
              <span style={S.metricLabel}>Test MSE</span>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>CONCEPTS</div>
          {[
            ["Bias", "Error from wrong assumptions. High bias → underfitting."],
            ["Variance", "Sensitivity to training data fluctuations. High var → overfit."],
            ["Regularization", "L1/L2 penalties constrain model complexity."],
          ].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 3, fontFamily: "Inter", letterSpacing: 1 }}>{k}</div>
              <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.7 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
