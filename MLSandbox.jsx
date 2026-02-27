import { useState, useEffect, useRef, useCallback } from "react";

// ── UTILS ──────────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const fmt = (n, d = 4) => (isFinite(n) ? Number(n).toFixed(d) : "—");

// ── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: {
    display: "flex", height: "100vh", width: "100vw",
    background: "#03070f", color: "#c8e6f5",
    fontFamily: "'Courier New', monospace", overflow: "hidden",
    position: "relative",
  },
  sidebar: {
    width: 220, flexShrink: 0,
    background: "rgba(5,12,22,0.97)",
    borderRight: "1px solid rgba(0,255,180,0.12)",
    display: "flex", flexDirection: "column",
    zIndex: 10,
  },
  logo: {
    padding: "18px 16px", borderBottom: "1px solid rgba(0,255,180,0.1)",
    fontSize: 16, fontWeight: 900, letterSpacing: 2,
    display: "flex", alignItems: "center", gap: 10,
  },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", cursor: "pointer", borderRadius: 6,
    margin: "2px 8px", fontSize: 12, transition: "all 0.2s",
    color: active ? "#00ffb4" : "rgba(200,230,245,0.55)",
    background: active ? "rgba(0,255,180,0.1)" : "transparent",
    border: active ? "1px solid rgba(0,255,180,0.25)" : "1px solid transparent",
    fontWeight: active ? 700 : 400,
  }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    height: 54, display: "flex", alignItems: "center", padding: "0 20px", gap: 14,
    background: "rgba(5,12,22,0.9)", borderBottom: "1px solid rgba(0,255,180,0.1)",
    flexShrink: 0,
  },
  content: { flex: 1, overflowY: "auto", padding: 20 },
  card: {
    background: "#071828", border: "1px solid rgba(0,255,180,0.12)",
    borderRadius: 10, padding: 18,
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 6, border: "none",
    cursor: "pointer", fontSize: 11, fontFamily: "'Courier New', monospace",
    fontWeight: 700, letterSpacing: 0.5, transition: "all 0.2s",
    ...(variant === "primary" ? {
      background: "#00ffb4", color: "#000",
      boxShadow: "0 0 12px rgba(0,255,180,0.3)",
    } : variant === "danger" ? {
      background: "rgba(255,50,100,0.15)", color: "#ff3264",
      border: "1px solid rgba(255,50,100,0.3)",
    } : {
      background: "transparent", color: "rgba(200,230,245,0.6)",
      border: "1px solid rgba(0,255,180,0.15)",
    }),
  }),
  label: { fontSize: 10, color: "rgba(200,230,245,0.4)", letterSpacing: 1.5, textTransform: "uppercase" },
  val: { color: "#00ffb4", fontWeight: 700 },
  metric: {
    textAlign: "center", padding: "12px 8px",
    background: "#050e1a", borderRadius: 6,
    border: "1px solid rgba(0,255,180,0.1)",
  },
  metricVal: { display: "block", fontSize: 18, color: "#00ffb4", fontWeight: 700, fontFamily: "'Courier New', monospace" },
  metricLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(200,230,245,0.3)", marginTop: 2 },
  infoBox: (variant = "default") => ({
    padding: "10px 12px", borderRadius: 6, fontSize: 11,
    lineHeight: 1.7, color: "rgba(200,230,245,0.65)",
    background: variant === "warn" ? "rgba(255,200,0,0.05)" : variant === "danger" ? "rgba(255,50,100,0.05)" : "rgba(0,255,180,0.05)",
    borderLeft: `3px solid ${variant === "warn" ? "#ffc800" : variant === "danger" ? "#ff3264" : "#00ffb4"}`,
    border: `1px solid ${variant === "warn" ? "rgba(255,200,0,0.2)" : variant === "danger" ? "rgba(255,50,100,0.2)" : "rgba(0,255,180,0.15)"}`,
    borderLeft: `3px solid ${variant === "warn" ? "#ffc800" : variant === "danger" ? "#ff3264" : "#00ffb4"}`,
  }),
  range: {
    width: "100%", height: 3, accentColor: "#00ffb4", cursor: "pointer",
  },
  select: {
    width: "100%", background: "#050e1a", border: "1px solid rgba(0,255,180,0.15)",
    color: "#c8e6f5", padding: "7px 10px", borderRadius: 6,
    fontFamily: "'Courier New', monospace", fontSize: 11, cursor: "pointer",
    outline: "none",
  },
};

// ── GRADIENT DESCENT MODULE ────────────────────────────────────────────────
function GradientDescent() {
  const canvasRef = useRef(null);
  const lossRef = useRef(null);
  const stateRef = useRef({
    ball: { x: 3, y: 3, vx: 0, vy: 0 },
    trail: [], hist: [], epoch: 0, running: false, raf: null,
  });
  const [lr, setLr] = useState(0.05);
  const [mom, setMom] = useState(0.9);
  const [surface, setSurface] = useState("bowl");
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ loss: "—", grad: "—", x: "—", iter: 0 });

  const lossF = useCallback((x, y, s) => {
    switch (s) {
      case "bowl": return 0.4 * x * x + 0.4 * y * y;
      case "saddle": return 0.4 * x * x - 0.3 * y * y;
      case "banana": return (1 - x) ** 2 + 80 * (y - x * x) ** 2 * 0.01;
      case "valleys": return Math.sin(x * 1.5) * Math.cos(y) + 0.1 * x * x + 0.1 * y * y;
      default: return 0.4 * x * x + 0.4 * y * y;
    }
  }, []);

  const gradF = useCallback((x, y, s) => {
    const e = 0.001;
    return {
      dx: (lossF(x + e, y, s) - lossF(x - e, y, s)) / (2 * e),
      dy: (lossF(x, y + e, s) - lossF(x, y - e, s)) / (2 * e),
    };
  }, [lossF]);

  const drawMain = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const st = stateRef.current;
    const sc = 44, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // heatmap
    const id = ctx.createImageData(W, H);
    for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
      const wx = (px - cx) / sc, wy = (py - cy) / sc;
      const l = lossF(wx, wy, st.surface || "bowl");
      const t = clamp(l / 10, 0, 1);
      const i = (py * W + px) * 4;
      id.data[i] = Math.floor(lerp(5, 255, t));
      id.data[i + 1] = Math.floor(lerp(200, 30, t));
      id.data[i + 2] = Math.floor(lerp(180, 80, t));
      id.data[i + 3] = Math.floor(lerp(20, 180, t));
    }
    ctx.putImageData(id, 0, 0);

    // grid
    ctx.strokeStyle = "rgba(200,230,245,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // trail
    for (let i = 1; i < st.trail.length; i++) {
      const t = i / st.trail.length;
      ctx.beginPath();
      ctx.moveTo(cx + st.trail[i - 1].x * sc, cy + st.trail[i - 1].y * sc);
      ctx.lineTo(cx + st.trail[i].x * sc, cy + st.trail[i].y * sc);
      ctx.strokeStyle = `rgba(255,200,0,${t * 0.9})`; ctx.lineWidth = 1.8; ctx.stroke();
    }

    // min marker
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,255,180,0.2)"; ctx.fill();
    ctx.strokeStyle = "rgba(0,255,180,0.7)"; ctx.lineWidth = 1.5; ctx.stroke();

    // gradient arrow
    if (st.epoch > 0) {
      const g = gradF(st.ball.x, st.ball.y, st.surface || "bowl");
      const bx = cx + st.ball.x * sc, by = cy + st.ball.y * sc;
      const mg = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
      if (mg > 0.001) {
        const al = Math.min(38, mg * 14);
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.lineTo(bx - (g.dx / mg) * al, by - (g.dy / mg) * al);
        ctx.strokeStyle = "rgba(150,100,255,0.8)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    // ball
    const bx = cx + st.ball.x * sc, by = cy + st.ball.y * sc;
    const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 10);
    grd.addColorStop(0, "#fff"); grd.addColorStop(1, "#ffc800");
    ctx.shadowBlur = 20; ctx.shadowColor = "#ffc800";
    ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill(); ctx.shadowBlur = 0;
  }, [lossF, gradF]);

  const drawLoss = useCallback(() => {
    const canvas = lossRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const h = stateRef.current.hist;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (h.length < 2) return;
    const mx = Math.max(...h), mn = Math.min(...h), r = mx - mn || 1;
    ctx.beginPath();
    h.forEach((v, i) => {
      const x = (i / (h.length - 1)) * W, y = H - ((v - mn) / r) * (H - 6) - 3;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#00ffb4"; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = "rgba(0,255,180,0.07)"; ctx.fill();
  }, []);

  const step = useCallback(() => {
    const st = stateRef.current;
    const g = gradF(st.ball.x, st.ball.y, st.surface || "bowl");
    st.ball.vx = st.mom * st.ball.vx - st.lr * g.dx;
    st.ball.vy = st.mom * st.ball.vy - st.lr * g.dy;
    st.ball.x = clamp(st.ball.x + st.ball.vx, -5, 5);
    st.ball.y = clamp(st.ball.y + st.ball.vy, -5, 5);
    st.trail.push({ x: st.ball.x, y: st.ball.y });
    if (st.trail.length > 200) st.trail.shift();
    const l = lossF(st.ball.x, st.ball.y, st.surface || "bowl");
    const gm = Math.sqrt(g.dx ** 2 + g.dy ** 2);
    st.hist.push(l); if (st.hist.length > 120) st.hist.shift();
    st.epoch++;
    setMetrics({ loss: fmt(l), grad: fmt(gm), x: fmt(st.ball.x, 3), iter: st.epoch });
  }, [gradF, lossF]);

  useEffect(() => {
    stateRef.current.lr = lr;
    stateRef.current.mom = mom;
    stateRef.current.surface = surface;
  }, [lr, mom, surface]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    const lc = lossRef.current;
    if (lc) { lc.width = lc.offsetWidth; lc.height = lc.offsetHeight; }

    const loop = () => {
      if (stateRef.current.running) step();
      drawMain(); drawLoss();
      stateRef.current.raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf); };
  }, [step, drawMain, drawLoss]);

  const toggleRun = () => {
    const r = !running;
    stateRef.current.running = r;
    setRunning(r);
  };

  const reset = () => {
    const st = stateRef.current;
    st.ball = { x: rand(-4, 4), y: rand(-4, 4), vx: 0, vy: 0 };
    st.trail = []; st.hist = []; st.epoch = 0; st.running = false;
    setRunning(false);
    setMetrics({ loss: "—", grad: "—", x: "—", iter: 0 });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>LOSS LANDSCAPE</span>
            <span style={{ ...S.val, fontSize: 11 }}>Epoch: {metrics.iter}</span>
          </div>
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 340, display: "block" }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>LOSS HISTORY</div>
            <div style={{ background: "#020810", border: "1px solid rgba(0,255,180,0.1)", borderRadius: 6, overflow: "hidden" }}>
              <canvas ref={lossRef} style={{ width: "100%", height: 90, display: "block" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>PARAMETERS</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={S.label}>Learning Rate α</span>
              <span style={S.val}>{lr.toFixed(3)}</span>
            </div>
            <input type="range" style={S.range} min={0.001} max={0.5} step={0.001} value={lr}
              onChange={e => setLr(+e.target.value)} />
            <div style={{ ...S.infoBox(), marginTop: 8, fontSize: 10 }}>
              Too high → overshoot & diverge. Too low → painfully slow.
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={S.label}>Momentum β</span>
              <span style={S.val}>{mom.toFixed(2)}</span>
            </div>
            <input type="range" style={S.range} min={0} max={0.99} step={0.01} value={mom}
              onChange={e => setMom(+e.target.value)} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Surface</div>
            <select style={S.select} value={surface} onChange={e => { setSurface(e.target.value); reset(); }}>
              <option value="bowl">Bowl (Convex)</option>
              <option value="saddle">Saddle Point</option>
              <option value="banana">Rosenbrock Banana</option>
              <option value="valleys">Multiple Valleys</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={S.btn("primary")} onClick={toggleRun}>{running ? "⏸ Pause" : "▶ Start"}</button>
            <button style={S.btn("secondary")} onClick={step}>⏭ Step</button>
            <button style={S.btn("danger")} onClick={reset}>↺</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>LIVE METRICS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Loss", metrics.loss], ["|Gradient|", metrics.grad], ["X Position", metrics.x], ["Iterations", metrics.iter]].map(([l, v]) => (
              <div key={l} style={S.metric}>
                <span style={S.metricVal}>{v}</span>
                <span style={S.metricLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>UPDATE RULE</div>
          <div style={{ background: "#020810", border: "1px solid rgba(0,255,180,0.15)", borderRadius: 6, padding: "10px 14px", fontFamily: "'Courier New', monospace", fontSize: 12, color: "#4cc9f0", textAlign: "center" }}>
            θ ← θ − α · ∇L(θ)
          </div>
          <div style={{ fontSize: 10, color: "rgba(200,230,245,0.35)", marginTop: 8, lineHeight: 1.8 }}>
            v ← β·v − α·∇L &nbsp;(momentum)<br />θ ← θ + v &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(update)
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DECISION BOUNDARY MODULE ───────────────────────────────────────────────
function DecisionBoundary() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [cls, setCls] = useState(0);
  const [algo, setAlgo] = useState("logistic");
  const [deg, setDeg] = useState(2);
  const [trained, setTrained] = useState(false);
  const [classifyFn, setClassifyFn] = useState(null);
  const [stats, setStats] = useState({ pts: 0, cls: 2 });

  const CL = ["#00ffb4", "#ff3264", "#ffc800"];

  const trainLog = (pts) => {
    const p2 = pts.filter(p => p.cls < 2); if (p2.length < 2) return null;
    let w1 = 0, w2 = 0, b = 0;
    for (let e = 0; e < 500; e++) for (const p of p2) {
      const pr = sigmoid(w1 * p.x + w2 * p.y + b), er = pr - (p.cls === 0 ? 1 : 0);
      w1 -= 0.1 * er * p.x; w2 -= 0.1 * er * p.y; b -= 0.1 * er;
    }
    return (x, y) => sigmoid(w1 * x + w2 * y + b);
  };

  const trainPoly = (pts, d) => {
    const pf = (x, y) => { const f = [1]; for (let i = 1; i <= d; i++) for (let j = 0; j <= i; j++) f.push(Math.pow(x, i - j) * Math.pow(y, j)); return f; };
    const p2 = pts.filter(p => p.cls < 2); if (p2.length < 2) return null;
    const nf = pf(0, 0).length; let w = Array(nf).fill(0);
    for (let e = 0; e < 600; e++) for (const p of p2) {
      const f = pf(p.x, p.y), z = f.reduce((s, v, i) => s + v * w[i], 0);
      const pr = sigmoid(z), er = pr - (p.cls === 0 ? 1 : 0);
      w = w.map((wi, i) => wi - 0.06 * er * f[i]);
    }
    return (x, y) => { const f = pf(x, y), z = f.reduce((s, v, i) => s + v * w[i], 0); return sigmoid(z); };
  };

  const trainRBF = (pts) => {
    if (pts.length < 2) return null;
    const g = 2.5;
    const c0 = pts.filter(p => p.cls === 0), c1 = pts.filter(p => p.cls !== 0);
    return (x, y) => {
      let s0 = 0, s1 = 0;
      for (const p of c0) s0 += Math.exp(-g * ((x - p.x) ** 2 + (y - p.y) ** 2));
      for (const p of c1) s1 += Math.exp(-g * ((x - p.x) ** 2 + (y - p.y) ** 2));
      return s0 / (s0 + s1 + 1e-8);
    };
  };

  const trainKNN = (pts, k = 5) => {
    if (pts.length < 2) return null;
    return (x, y) => {
      const d = pts.map(p => ({ d: (x - p.x) ** 2 + (y - p.y) ** 2, cls: p.cls }))
        .sort((a, b) => a.d - b.d).slice(0, k);
      return d.filter(v => v.cls === 0).length / k;
    };
  };

  const drawCanvas = useCallback((pts, fn) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // boundary
    if (fn) {
      const res = 55;
      for (let px = 0; px < W; px += W / res) for (let py = 0; py < H; py += H / res) {
        const pr = fn((px / W) * 2 - 1, (py / H) * 2 - 1);
        if (pr > 0.5) { const t = (pr - 0.5) * 2; ctx.fillStyle = `rgba(0,${Math.floor(lerp(50, 255, t))},${Math.floor(lerp(100, 180, t))},0.3)`; }
        else { const t = (0.5 - pr) * 2; ctx.fillStyle = `rgba(${Math.floor(lerp(0, 255, t))},${Math.floor(lerp(255, 50, t))},${Math.floor(lerp(180, 100, t))},0.3)`; }
        ctx.fillRect(px, py, W / res + 1, H / res + 1);
      }
    }
    // points
    for (const pt of pts) {
      const px = (pt.x + 1) / 2 * W, py = (pt.y + 1) / 2 * H;
      ctx.shadowBlur = 8; ctx.shadowColor = CL[pt.cls];
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = CL[pt.cls]; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    drawCanvas([], null);
  }, []);

  useEffect(() => { drawCanvas(points, classifyFn); }, [points, classifyFn, drawCanvas]);

  const handleClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const newPt = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, cls };
    const newPts = [...points, newPt];
    setPoints(newPts);
    setStats({ pts: newPts.length, cls: new Set(newPts.map(p => p.cls)).size });
    if (trained && classifyFn) drawCanvas(newPts, classifyFn);
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
      for (let i = 0; i < 20; i++) newPts.push({ x: rand(-1, -0.1) + rand(-0.1, 0.1), y: rand(-1, -0.1) + rand(-0.1, 0.1), cls: 0 });
      for (let i = 0; i < 20; i++) newPts.push({ x: rand(0.1, 1) + rand(-0.1, 0.1), y: rand(0.1, 1) + rand(-0.1, 0.1), cls: 1 });
    } else if (type === "xor") {
      for (let i = 0; i < 15; i++) { newPts.push({ x: rand(-1, -0.1), y: rand(-1, -0.1), cls: 0 }); newPts.push({ x: rand(0.1, 1), y: rand(0.1, 1), cls: 0 }); newPts.push({ x: rand(-1, -0.1), y: rand(0.1, 1), cls: 1 }); newPts.push({ x: rand(0.1, 1), y: rand(-1, -0.1), cls: 1 }); }
    } else if (type === "circle") {
      for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(0, 0.4); newPts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 }); }
      for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(0.65, 1); newPts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 1 }); }
    }
    const all = [...points, ...newPts];
    setPoints(all); setTrained(false); setClassifyFn(null);
    setStats({ pts: all.length, cls: new Set(all.map(p => p.cls)).size });
  };

  const explains = {
    logistic: "Linear boundary via logistic regression. σ(wᵀx+b) models class probability. Works for linearly separable data.",
    poly: `Polynomial features of degree ${deg} map inputs to higher dimensions, enabling curved non-linear boundaries.`,
    rbf: "RBF kernel uses Gaussian similarity — creates smooth radial boundaries. Think: 'how close am I to each class?'",
    knn: "KNN (k=5) assigns class by majority vote of 5 nearest training points. Creates Voronoi-like boundaries.",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>CANVAS</span>
            <span style={{ ...S.label }}>Click to place points</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["● Class A", 0, "#00ffb4"], ["■ Class B", 1, "#ff3264"], ["▲ Class C", 2, "#ffc800"]].map(([label, c, color]) => (
              <button key={c} onClick={() => setCls(c)} style={{
                flex: 1, padding: "7px 4px", borderRadius: 6, border: `2px solid ${cls === c ? color : "transparent"}`,
                background: cls === c ? color + "18" : "transparent", color, cursor: "pointer",
                fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>
          <div style={{ borderRadius: 8, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)", cursor: "crosshair" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 380, display: "block" }} onClick={handleClick} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>CLASSIFIER</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Algorithm</div>
            <select style={S.select} value={algo} onChange={e => setAlgo(e.target.value)}>
              <option value="logistic">Logistic Regression</option>
              <option value="poly">Polynomial Kernel</option>
              <option value="rbf">RBF / Gaussian</option>
              <option value="knn">KNN (k=5)</option>
            </select>
          </div>
          {algo === "poly" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={S.label}>Poly Degree</span><span style={S.val}>{deg}</span>
              </div>
              <input type="range" style={S.range} min={1} max={7} step={1} value={deg} onChange={e => setDeg(+e.target.value)} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button style={S.btn("primary")} onClick={classify}>⬡ Classify</button>
            <button style={S.btn("secondary")} onClick={() => { setPoints([]); setTrained(false); setClassifyFn(null); setStats({ pts: 0, cls: 2 }); }}>Clear</button>
          </div>
          <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.7 }}>{explains[algo]}</div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>PRESETS</div>
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

// ── KNN MODULE ─────────────────────────────────────────────────────────────
function KNNViz() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [mode, setMode] = useState("A");
  const [k, setK] = useState(3);
  const [query, setQuery] = useState(null);
  const [pred, setPred] = useState(null);
  const [votes, setVotes] = useState([0, 0, 0]);
  const CL = ["#00ffb4", "#ff3264", "#ffc800"];

  const draw = useCallback((pts, qpt, kv) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // voronoi bg
    if (pts.length > 0) {
      const res = 30;
      for (let px = 0; px < W; px += W / res) for (let py = 0; py < H; py += H / res) {
        const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
        const d = pts.map(p => ({ d: (wx - p.x) ** 2 + (wy - p.y) ** 2, cls: p.cls })).sort((a, b) => a.d - b.d).slice(0, kv);
        const v = [0, 0, 0]; d.forEach(x => v[x.cls]++);
        const w = v.indexOf(Math.max(...v));
        ctx.fillStyle = CL[w] + "14"; ctx.fillRect(px, py, W / res + 1, H / res + 1);
      }
    }
    // points
    for (const pt of pts) {
      const px = (pt.x + 1) / 2 * W, py = (pt.y + 1) / 2 * H;
      ctx.shadowBlur = 6; ctx.shadowColor = CL[pt.cls];
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = CL[pt.cls]; ctx.fill(); ctx.shadowBlur = 0;
    }
    // query
    if (qpt) {
      const qx = (qpt.x + 1) / 2 * W, qy = (qpt.y + 1) / 2 * H;
      const d = pts.map(p => ({ d: Math.sqrt((qpt.x - p.x) ** 2 + (qpt.y - p.y) ** 2), cls: p.cls, x: p.x, y: p.y }))
        .sort((a, b) => a.d - b.d).slice(0, kv);
      if (d.length) {
        const mr = d[d.length - 1].d / 2 * W;
        ctx.beginPath(); ctx.arc(qx, qy, mr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150,255,200,0.2)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      }
      for (const nb of d) {
        const nx = (nb.x + 1) / 2 * W, ny = (nb.y + 1) / 2 * H;
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(nx, ny);
        ctx.strokeStyle = CL[nb.cls] + "50"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(nx, ny, 9, 0, Math.PI * 2);
        ctx.strokeStyle = CL[nb.cls]; ctx.lineWidth = 2; ctx.stroke();
      }
      const v = [0, 0, 0]; d.forEach(x => v[x.cls]++);
      const winner = v.indexOf(Math.max(...v));
      setPred(winner); setVotes([...v]);
      const grd = ctx.createRadialGradient(qx, qy, 0, qx, qy, 10);
      grd.addColorStop(0, "#fff"); grd.addColorStop(1, "#00ff88");
      ctx.shadowBlur = 18; ctx.shadowColor = "#00ff88";
      ctx.beginPath(); ctx.arc(qx, qy, 10, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(qx - 4, qy); ctx.lineTo(qx + 4, qy); ctx.moveTo(qx, qy - 4); ctx.lineTo(qx, qy + 4); ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    draw([], null, k);
  }, []);

  useEffect(() => { draw(points, query, k); }, [points, query, k, draw]);

  const handleClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * 2 - 1, wy = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (mode === "Q") { setQuery({ x: wx, y: wy }); }
    else { const m = { A: 0, B: 1, C: 2 }; setPoints(prev => [...prev, { x: wx, y: wy, cls: m[mode] }]); }
  };

  const autoAdd = () => {
    const newPts = [];
    for (let c = 0; c < 3; c++) { const cx = rand(-0.6, 0.6), cy = rand(-0.6, 0.6); for (let i = 0; i < 10; i++) newPts.push({ x: cx + rand(-0.18, 0.18), y: cy + rand(-0.18, 0.18), cls: c }); }
    setPoints(prev => [...prev, ...newPts]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 10 }}>KNN CANVAS</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["▲ A", "A", "#00ffb4"], ["● B", "B", "#ff3264"], ["■ C", "C", "#ffc800"], ["⊕ Query", "Q", "#a855f7"]].map(([l, m, c]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "7px 4px", borderRadius: 6, border: `2px solid ${mode === m ? c : "transparent"}`,
              background: mode === m ? c + "18" : "transparent", color: c, cursor: "pointer",
              fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)", cursor: "crosshair" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: 400, display: "block" }} onClick={handleClick} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>K PARAMETER</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={S.label}>K Neighbors</span><span style={S.val}>{k}</span>
          </div>
          <input type="range" style={S.range} min={1} max={15} step={1} value={k} onChange={e => setK(+e.target.value)} />
          <div style={{ ...S.infoBox(), marginTop: 10, fontSize: 10 }}>K=1 → complex, fragile. K=large → smooth, biased.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={autoAdd}>+ Auto</button>
            <button style={S.btn("danger")} onClick={() => { setPoints([]); setQuery(null); setPred(null); setVotes([0, 0, 0]); }}>Clear</button>
          </div>
        </div>

        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>PREDICTION</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: pred !== null ? CL[pred] : "#00ffb4", marginBottom: 4, textShadow: pred !== null ? `0 0 20px ${CL[pred]}` : "none" }}>
            {pred !== null ? ["A", "B", "C"][pred] : "?"}
          </div>
          <div style={S.label}>Predicted Class</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {["A", "B", "C"].map((l, i) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: CL[i], minWidth: 50 }}>Class {l}</span>
                <div style={{ flex: 1, height: 5, background: "rgba(200,230,245,0.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${k > 0 ? (votes[i] / k) * 100 : 0}%`, background: CL[i], borderRadius: 3, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 10, color: "rgba(200,230,245,0.3)" }}>{votes[i]}/{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>STEPS</div>
          {[["1", "Calc Distances", "d = √(Δx²+Δy²)"], ["2", "Find K Nearest", "Sort & pick K smallest"], ["3", "Majority Vote", "Most frequent class wins"]].map(([n, t, d]) => (
            <div key={n} style={{ display: "flex", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,255,180,0.08)" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,255,180,0.12)", border: "1px solid rgba(0,255,180,0.3)", color: "#00ffb4", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: "#c8e6f5", marginBottom: 2 }}>{t}</div><div style={{ fontSize: 10, color: "rgba(200,230,245,0.4)" }}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OVERFITTING MODULE ─────────────────────────────────────────────────────
function OverfittingViz() {
  const canvasRef = useRef(null);
  const bvRef = useRef(null);
  const [deg, setDeg] = useState(1);
  const [noise, setNoise] = useState(0.2);
  const [trainN, setTrainN] = useState(15);
  const [data, setData] = useState({ train: [], test: [] });
  const [errors, setErrors] = useState({ train: "—", test: "—" });
  const [fitState, setFitState] = useState("underfit");

  const trueFn = (x) => Math.sin(x * 2) * 0.5 + x * 0.15;

  const genData = useCallback((n, ns) => {
    const all = [];
    for (let i = 0; i < 55; i++) { const x = rand(-Math.PI, Math.PI); all.push({ x, y: trueFn(x) + (Math.random() - 0.5) * ns * 2 }); }
    all.sort(() => Math.random() - 0.5);
    return { train: all.slice(0, n), test: all.slice(n, n + 20) };
  }, []);

  const fitPoly = (pts, d) => {
    const n = pts.length, dg = Math.min(d, n - 1);
    const X = pts.map(p => Array.from({ length: dg + 1 }, (_, k) => Math.pow(p.x, k)));
    const y = pts.map(p => p.y);
    const XtX = Array.from({ length: dg + 1 }, (_, i) => Array.from({ length: dg + 1 }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0)));
    const Xty = Array.from({ length: dg + 1 }, (_, i) => X.reduce((s, r, ri) => s + r[i] * y[ri], 0));
    const A = XtX.map((r, i) => [...r, Xty[i]]);
    for (let c = 0; c <= dg; c++) {
      let mx = c; for (let r = c + 1; r <= dg; r++) if (Math.abs(A[r][c]) > Math.abs(A[mx][c])) mx = r;
      [A[c], A[mx]] = [A[mx], A[c]];
      for (let r = c + 1; r <= dg; r++) { if (Math.abs(A[c][c]) < 1e-12) continue; const f = A[r][c] / A[c][c]; for (let k = c; k <= dg + 1; k++) A[r][k] -= f * A[c][k]; }
    }
    const w = Array(dg + 1).fill(0);
    for (let i = dg; i >= 0; i--) { if (Math.abs(A[i][i]) < 1e-12) continue; w[i] = A[i][dg + 1]; for (let k = i + 1; k <= dg; k++) w[i] -= A[i][k] * w[k]; w[i] /= A[i][i]; }
    return x => w.reduce((s, wi, i) => s + wi * Math.pow(x, i), 0);
  };

  const mse = (fn, pts) => pts.reduce((s, p) => s + (fn(p.x) - p.y) ** 2, 0) / pts.length;

  const draw = useCallback((d, dg) => {
    const canvas = canvasRef.current; if (!canvas || !d.train.length) return;
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const tx = x => (x + Math.PI) / (2 * Math.PI) * W;
    const ty = y => H / 2 - y * (H / 3.2);
    // true fn
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const x = -Math.PI + (2 * Math.PI) * i / 200; i === 0 ? ctx.moveTo(tx(x), ty(trueFn(x))) : ctx.lineTo(tx(x), ty(trueFn(x))); }
    ctx.strokeStyle = "rgba(255,200,0,0.4)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    // fitted
    const fn = fitPoly(d.train, dg);
    ctx.beginPath(); let first = true;
    for (let i = 0; i <= 300; i++) { const x = -Math.PI + (2 * Math.PI) * i / 300, y = fn(x); if (Math.abs(y) > 3.5) { first = true; continue; } first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y)); first = false; }
    ctx.strokeStyle = "rgba(150,100,255,0.95)"; ctx.lineWidth = 2.5; ctx.stroke();
    // train pts
    for (const p of d.train) { ctx.shadowBlur = 6; ctx.shadowColor = "#00ffb4"; ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 4, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,255,180,0.9)"; ctx.fill(); ctx.shadowBlur = 0; }
    for (const p of d.test) { ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,50,100,0.65)"; ctx.fill(); }
    const te = mse(fn, d.train), ee = mse(fn, d.test);
    setErrors({ train: fmt(te), test: fmt(ee) });
    if (dg <= 2) setFitState("underfit");
    else if (ee > te * 2.5 || dg > 9) setFitState("overfit");
    else setFitState("good");
  }, []);

  const drawBV = useCallback((dg) => {
    const canvas = bvRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const mx = 14, bias = [], vari = [], tot = [];
    for (let d = 1; d <= mx; d++) { const b = Math.max(0, 1 - d * 0.1) + 0.04, v = Math.min(0.9, d * 0.055); bias.push(b); vari.push(v); tot.push(Math.min(1.2, b + v + 0.04)); }
    const ty = v => H - (v / 1.3) * (H - 6) - 3, tx = i => (i / mx) * W;
    const dc = (arr, col) => { ctx.beginPath(); arr.forEach((v, i) => { const x = tx(i + 1), y = ty(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); };
    dc(bias, "rgba(76,201,240,0.9)"); dc(vari, "rgba(255,50,100,0.9)"); dc(tot, "rgba(255,200,0,0.9)");
    ctx.beginPath(); ctx.moveTo(tx(dg), 0); ctx.lineTo(tx(dg), H);
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(200,230,245,0.25)"; ctx.font = "9px Courier New"; ctx.fillText("Complexity →", W - 90, H - 4);
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    const b = bvRef.current; if (b) { b.width = b.offsetWidth; b.height = b.offsetHeight; }
    const d = genData(trainN, noise);
    setData(d); draw(d, deg); drawBV(deg);
  }, []);

  useEffect(() => { draw(data, deg); drawBV(deg); }, [data, deg, draw, drawBV]);

  const regen = () => { const d = genData(trainN, noise); setData(d); };

  const fitColors = { underfit: "#4cc9f0", good: "#00ffb4", overfit: "#ff3264" };
  const fitLabels = { underfit: "⬇ Underfitting — model too simple", good: "✓ Good Fit — generalizing well!", overfit: "⚠ Overfitting — test error exploding!" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>POLYNOMIAL FIT</span>
            <div style={{ display: "flex", gap: 12 }}>
              {[["#00ffb4", "Train"], ["#ff3264", "Test"], ["rgba(255,200,0,0.6)", "True fn"]].map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(200,230,245,0.5)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 8, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 300, display: "block" }} />
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>BIAS-VARIANCE TRADEOFF</span>
            <div style={{ display: "flex", gap: 10 }}>
              {[["#4cc9f0", "Bias²"], ["#ff3264", "Variance"], ["#ffc800", "Total"]].map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "rgba(200,230,245,0.4)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{l}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 6, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
            <canvas ref={bvRef} style={{ width: "100%", height: 130, display: "block" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>COMPLEXITY</div>
          {[
            ["Polynomial Degree", deg, 1, 14, 1, v => { setDeg(v); }],
            ["Noise Level", noise, 0.05, 0.8, 0.05, v => { setNoise(v); const d = genData(trainN, v); setData(d); }],
            ["Training Points", trainN, 5, 40, 1, v => { setTrainN(v); const d = genData(v, noise); setData(d); }],
          ].map(([label, val, min, max, step, onChange]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={S.label}>{label}</span>
                <span style={S.val}>{typeof val === "number" && val % 1 !== 0 ? val.toFixed(2) : val}</span>
              </div>
              <input type="range" style={S.range} min={min} max={max} step={step} value={val} onChange={e => onChange(+e.target.value)} />
            </div>
          ))}
          <button style={{ ...S.btn("primary"), width: "100%" }} onClick={regen}>↺ New Dataset</button>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>ERRORS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={S.metric}><span style={S.metricVal}>{errors.train}</span><span style={S.metricLabel}>Train</span></div>
            <div style={{ ...S.metric }}><span style={{ ...S.metricVal, color: fitState === "overfit" ? "#ff3264" : "#00ffb4" }}>{errors.test}</span><span style={S.metricLabel}>Test</span></div>
          </div>
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 6, background: fitColors[fitState] + "10", border: `1px solid ${fitColors[fitState]}35`, color: fitColors[fitState], fontSize: 11, fontFamily: "'Courier New', monospace" }}>
            {fitLabels[fitState]}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["#4cc9f0", "Underfitting", "High Bias — model too simple. Both errors high."], ["#00ffb4", "Good Fit", "Captures pattern, generalizes to test data."], ["#ff3264", "Overfitting", "High Variance — memorized noise. Test error explodes!"]].map(([c, t, d]) => (
            <div key={t} style={{ padding: "9px 11px", borderRadius: 6, background: c + "08", borderLeft: `3px solid ${c}`, border: `1px solid ${c}20`, fontSize: 10, lineHeight: 1.6, color: "rgba(200,230,245,0.6)" }}>
              <b style={{ color: c }}>{t}</b><br />{d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── NEURAL NETWORK MODULE ──────────────────────────────────────────────────
function NeuralNet() {
  const netRef = useRef(null);
  const decRef = useRef(null);
  const lossRef = useRef(null);
  const stateRef = useRef({ W: [], B: [], layers: [2, 4, 4, 1], act: "relu", lr: 0.015, running: false, raf: null, epoch: 0, hist: [], data: [], ds: "xor" });
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ loss: "—", acc: "—", ep: 0 });
  const [layers, setLayers] = useState([2, 4, 4, 1]);
  const [act, setAct] = useState("relu");
  const [lr, setLr] = useState(0.015);
  const [ds, setDs] = useState("xor");

  const genData = (t, n = 100) => {
    const d = [];
    if (t === "xor") { for (let i = 0; i < n; i++) { const x = rand(-1, 1), y = rand(-1, 1); d.push({ x, y, l: (x > 0) !== (y > 0) ? 1 : 0 }); } }
    else if (t === "circle") { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), r = i < n / 2 ? rand(0, 0.45) : rand(0.65, 1); d.push({ x: Math.cos(a) * r + rand(-0.05, 0.05), y: Math.sin(a) * r + rand(-0.05, 0.05), l: i < n / 2 ? 1 : 0 }); } }
    else if (t === "spiral") { for (let c = 0; c < 2; c++) for (let i = 0; i < n / 2; i++) { const tt = i / (n / 2) * Math.PI * 3, r = tt / (Math.PI * 3); d.push({ x: r * Math.cos(tt + c * Math.PI) + rand(-0.07, 0.07), y: r * Math.sin(tt + c * Math.PI) + rand(-0.07, 0.07), l: c }); } }
    else { for (let i = 0; i < n; i++) { const x = rand(-1, 1), y = rand(-1, 1); d.push({ x, y, l: y > x * 0.8 ? 1 : 0 }); } }
    return d;
  };

  const activation = (x, fn) => { switch (fn) { case "relu": return Math.max(0, x); case "sigmoid": return sigmoid(x); case "tanh": return Math.tanh(x); case "leaky": return x > 0 ? x : 0.01 * x; default: return Math.max(0, x); } };
  const activationD = (x, fn) => { switch (fn) { case "relu": return x > 0 ? 1 : 0; case "sigmoid": { const s = sigmoid(x); return s * (1 - s); } case "tanh": return 1 - Math.tanh(x) ** 2; case "leaky": return x > 0 ? 1 : 0.01; default: return x > 0 ? 1 : 0; } };

  const initWeights = (ls) => {
    const W = [], B = [];
    for (let i = 0; i < ls.length - 1; i++) {
      W.push(Array.from({ length: ls[i + 1] }, () => Array.from({ length: ls[i] }, () => (Math.random() - 0.5) * Math.sqrt(2 / ls[i]))));
      B.push(Array(ls[i + 1]).fill(0));
    }
    return { W, B };
  };

  const forward = (inp, W, B, ls, actFn) => {
    let a = [...inp]; const acts = [a], pres = [];
    for (let l = 0; l < W.length; l++) {
      const pre = [], nxt = [];
      for (let j = 0; j < ls[l + 1]; j++) { let z = B[l][j]; for (let k = 0; k < ls[l]; k++) z += W[l][j][k] * a[k]; pre.push(z); nxt.push(l === W.length - 1 ? sigmoid(z) : activation(z, actFn)); }
      pres.push(pre); acts.push(nxt); a = nxt;
    }
    return { out: a[0], acts, pres };
  };

  const backward = (inp, tgt, W, B, ls, actFn, lr) => {
    const { out, acts, pres } = forward(inp, W, B, ls, actFn);
    const loss = -(tgt * Math.log(out + 1e-8) + (1 - tgt) * Math.log(1 - out + 1e-8));
    let dA = [out - tgt];
    for (let l = W.length - 1; l >= 0; l--) {
      const dZ = dA.map((da, j) => da * (l === W.length - 1 ? acts[l + 1][j] * (1 - acts[l + 1][j]) : activationD(pres[l][j], actFn)));
      const dP = Array(ls[l]).fill(0);
      for (let j = 0; j < ls[l + 1]; j++) { B[l][j] -= lr * dZ[j]; for (let k = 0; k < ls[l]; k++) { dP[k] += W[l][j][k] * dZ[j]; W[l][j][k] -= lr * dZ[j] * acts[l][k]; } }
      dA = dP;
    }
    return loss;
  };

  const drawNet = (canvas, W, B, ls) => {
    const ctx = canvas.getContext("2d"), CW = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, CW, H);
    ctx.strokeStyle = "rgba(0,255,180,0.03)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    const lw = CW / (ls.length + 1), pos = [];
    for (let l = 0; l < ls.length; l++) { const x = lw * (l + 1), ps = []; for (let n = 0; n < ls[l]; n++) ps.push({ x, y: H / (ls[l] + 1) * (n + 1) }); pos.push(ps); }
    for (let l = 0; l < ls.length - 1; l++) for (let i = 0; i < ls[l]; i++) for (let j = 0; j < ls[l + 1]; j++) {
      const w = W[l] ? W[l][j][i] : 0, al = Math.min(0.7, Math.abs(w) * 2);
      ctx.beginPath(); ctx.moveTo(pos[l][i].x, pos[l][i].y); ctx.lineTo(pos[l + 1][j].x, pos[l + 1][j].y);
      ctx.strokeStyle = w > 0 ? `rgba(0,255,180,${al})` : `rgba(255,50,100,${al})`; ctx.lineWidth = Math.min(2, Math.abs(w) + 0.2); ctx.stroke();
    }
    const cols = ["#00ffb4", "#a855f7", "#ffc800", "#ff3264", "#4cc9f0"];
    for (let l = 0; l < ls.length; l++) {
      for (let n = 0; n < ls[l]; n++) {
        const { x, y } = pos[l][n], col = cols[l % cols.length];
        ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fillStyle = "#050e1a"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 12); grd.addColorStop(0, col + "40"); grd.addColorStop(1, "transparent"); ctx.fillStyle = grd; ctx.fill();
      }
      ctx.fillStyle = "rgba(200,230,245,0.25)"; ctx.font = "9px Courier New"; ctx.textAlign = "center";
      ctx.fillText(["In", ...Array(ls.length - 2).fill("H"), "Out"][l], pos[l][0].x, H - 4);
    }
  };

  const drawDec = (canvas, W, B, ls, actFn) => {
    const ctx = canvas.getContext("2d"), CW = canvas.width, H = canvas.height; ctx.clearRect(0, 0, CW, H);
    const res = 28;
    for (let px = 0; px < CW; px += CW / res) for (let py = 0; py < H; py += H / res) {
      const { out } = forward([(px / CW) * 2 - 1, (py / H) * 2 - 1], W, B, ls, actFn);
      ctx.fillStyle = out > 0.5 ? `rgba(0,${Math.floor(lerp(50, 255, out))},${Math.floor(lerp(100, 180, out))},0.35)` : `rgba(${Math.floor(lerp(0, 255, 1 - out))},50,100,0.35)`;
      ctx.fillRect(px, py, CW / res + 1, H / res + 1);
    }
  };

  const drawLoss = (canvas, hist) => {
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,255,180,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    if (hist.length < 2) return;
    const mx = Math.max(...hist), mn = Math.min(...hist), r = mx - mn || 1;
    ctx.beginPath(); hist.forEach((v, i) => { const x = i / (hist.length - 1) * W, y = H - ((v - mn) / r) * (H - 6) - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = "rgba(168,85,247,0.9)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = "rgba(168,85,247,0.07)"; ctx.fill();
  };

  useEffect(() => {
    const st = stateRef.current;
    ["netRef", "decRef", "lossRef"].forEach(r => { const c = eval(r).current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; } });
    st.data = genData(st.ds); const { W, B } = initWeights(st.layers); st.W = W; st.B = B;
    let frame = 0;
    const loop = () => {
      if (st.running) {
        let tl = 0, ok = 0;
        for (let i = 0; i < 5; i++) for (const p of st.data) { const l = backward([p.x, p.y], p.l, st.W, st.B, st.layers, st.act, st.lr); tl += l; const { out } = forward([p.x, p.y], st.W, st.B, st.layers, st.act); if ((out > 0.5) === (p.l === 1)) ok++; }
        const al = tl / (st.data.length * 5), ac = ok / (st.data.length * 5);
        st.hist.push(al); if (st.hist.length > 100) st.hist.shift(); st.epoch++;
        if (frame % 3 === 0) setMetrics({ loss: fmt(al), acc: (ac * 100).toFixed(1) + "%", ep: st.epoch });
      }
      if (frame % 2 === 0 && netRef.current) drawNet(netRef.current, st.W, st.B, st.layers);
      if (frame % 3 === 0 && decRef.current) drawDec(decRef.current, st.W, st.B, st.layers, st.act);
      if (frame % 3 === 0 && lossRef.current) drawLoss(lossRef.current, st.hist);
      frame++;
      st.raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (st.raf) cancelAnimationFrame(st.raf); st.raf = null; };
  }, []);

  useEffect(() => { stateRef.current.act = act; }, [act]);
  useEffect(() => { stateRef.current.lr = lr; }, [lr]);
  useEffect(() => { const st = stateRef.current; st.ds = ds; st.data = genData(ds); }, [ds]);

  const toggleRun = () => { const r = !running; stateRef.current.running = r; setRunning(r); };
  const resetNet = () => {
    const st = stateRef.current; st.running = false; st.epoch = 0; st.hist = [];
    const { W, B } = initWeights(st.layers); st.W = W; st.B = B;
    setRunning(false); setMetrics({ loss: "—", acc: "—", ep: 0 });
  };
  const addLayer = () => { if (layers.length >= 6) return; const nl = [...layers]; nl.splice(nl.length - 1, 0, 4); setLayers(nl); stateRef.current.layers = nl; const { W, B } = initWeights(nl); stateRef.current.W = W; stateRef.current.B = B; };
  const remLayer = () => { if (layers.length <= 2) return; const nl = [...layers]; nl.splice(nl.length - 2, 1); setLayers(nl); stateRef.current.layers = nl; const { W, B } = initWeights(nl); stateRef.current.W = W; stateRef.current.B = B; };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>NETWORK</span>
            <span style={{ ...S.label }}>Architecture: [{layers.join(",")}]</span>
          </div>
          <div style={{ borderRadius: 8, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
            <canvas ref={netRef} style={{ width: "100%", height: 280, display: "block" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>DECISION BOUNDARY</div>
            <div style={{ borderRadius: 6, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
              <canvas ref={decRef} style={{ width: "100%", height: 180, display: "block" }} />
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>TRAINING LOSS</div>
            <div style={{ borderRadius: 6, overflow: "hidden", background: "#020810", border: "1px solid rgba(0,255,180,0.1)" }}>
              <canvas ref={lossRef} style={{ width: "100%", height: 180, display: "block" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 14 }}>CONFIG</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Dataset</div>
            <select style={S.select} value={ds} onChange={e => setDs(e.target.value)}>
              <option value="xor">XOR</option><option value="circle">Circles</option>
              <option value="spiral">Spiral</option><option value="linear">Linear</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Activation</div>
            <select style={S.select} value={act} onChange={e => setAct(e.target.value)}>
              <option value="relu">ReLU</option><option value="sigmoid">Sigmoid</option>
              <option value="tanh">Tanh</option><option value="leaky">Leaky ReLU</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={S.label}>Learning Rate</span><span style={S.val}>{lr.toFixed(3)}</span>
            </div>
            <input type="range" style={S.range} min={0.001} max={0.1} step={0.001} value={lr} onChange={e => setLr(+e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Layers: [{layers.join(",")}]</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...S.btn("secondary"), flex: 1, fontSize: 10 }} onClick={addLayer}>+ Layer</button>
              <button style={{ ...S.btn("secondary"), flex: 1, fontSize: 10 }} onClick={remLayer}>− Layer</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={toggleRun}>{running ? "⏸ Pause" : "▶ Train"}</button>
            <button style={S.btn("danger")} onClick={resetNet}>↺</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>METRICS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Loss", metrics.loss], ["Accuracy", metrics.acc], ["Epoch", metrics.ep], ["Depth", layers.length]].map(([l, v]) => (
              <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: "gd", label: "Gradient Descent", icon: "∇", component: GradientDescent },
  { id: "nn", label: "Neural Network", icon: "◉", component: NeuralNet },
  { id: "db", label: "Decision Boundary", icon: "⬡", component: DecisionBoundary },
  { id: "knn", label: "K-Nearest Neighbors", icon: "⊕", component: KNNViz },
  { id: "of", label: "Overfitting", icon: "〜", component: OverfittingViz },
];

export default function App() {
  const [active, setActive] = useState("gd");
  const ActiveModule = MODULES.find(m => m.id === active)?.component || GradientDescent;
  const activeLabel = MODULES.find(m => m.id === active)?.label;

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: "spin 8s linear infinite", flexShrink: 0 }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="12" cy="12" r="10" stroke="#00ffb4" strokeWidth="1.5" fill="none" />
            <polygon points="12,4 19,16 5,16" fill="#00ffb4" opacity="0.5" />
            <circle cx="12" cy="12" r="2.5" fill="#00ffb4" />
          </svg>
          <span style={{ color: "#00ffb4" }}>ML</span><span style={{ color: "#c8e6f5" }}>Sandbox</span>
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          <div style={{ ...S.label, padding: "8px 16px 6px" }}>Algorithms</div>
          {MODULES.map(m => (
            <div key={m.id} style={S.navItem(active === m.id)} onClick={() => setActive(m.id)}>
              <span style={{ fontSize: 14, minWidth: 20, textAlign: "center" }}>{m.icon}</span>
              <span>{m.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,255,180,0.1)", fontSize: 9, color: "rgba(200,230,245,0.25)", fontFamily: "Courier New" }}>
          Pure JS · Zero Deps · 60fps
        </div>
      </aside>

      {/* Main */}
      <div style={S.main}>
        <header style={S.topbar}>
          <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 2, color: "#00ffb4" }}>{activeLabel}</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ffb4", boxShadow: "0 0 8px #00ffb4", animation: "pulse 2s infinite" }} />
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            <span style={{ fontSize: 11, color: "rgba(200,230,245,0.5)", fontFamily: "Courier New" }}>READY</span>
          </div>
        </header>

        <div style={S.content}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontFamily: "Courier New", fontSize: 20, fontWeight: 900, letterSpacing: 2, color: "#c8e6f5", marginBottom: 6 }}>
              {activeLabel} <span style={{ color: "#00ffb4" }}>Visualizer</span>
            </h1>
            <div style={{ fontSize: 12, color: "rgba(200,230,245,0.45)", lineHeight: 1.7 }}>
              {active === "gd" && "Watch a ball roll down a loss surface following the negative gradient. Adjust learning rate & momentum."}
              {active === "nn" && "Build and train a neural network. Modify architecture, activation functions, and watch boundaries form."}
              {active === "db" && "Click the canvas to place points. Classify with different algorithms and see unique boundary shapes."}
              {active === "knn" && "Place training points, query in Query mode, watch KNN vote on classification with K neighbors."}
              {active === "of" && "Drag polynomial degree and witness overfitting. Find the sweet spot between underfitting and overfit."}
            </div>
          </div>
          <ActiveModule key={active} />
        </div>
      </div>
    </div>
  );
}
