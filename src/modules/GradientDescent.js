import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { clamp, lerp, rand, fmt } from "../utils";

const lossF = (x, y, s) => {
  switch (s) {
    case "bowl":    return 0.4 * x * x + 0.4 * y * y;
    case "saddle":  return 0.4 * x * x - 0.3 * y * y;
    case "banana":  return (1 - x) ** 2 + 80 * (y - x * x) ** 2 * 0.01;
    case "valleys": return Math.sin(x * 1.5) * Math.cos(y) + 0.1 * x * x + 0.1 * y * y;
    default:        return 0.4 * x * x + 0.4 * y * y;
  }
};
const gradF = (x, y, s) => {
  const e = 0.001;
  return {
    dx: (lossF(x + e, y, s) - lossF(x - e, y, s)) / (2 * e),
    dy: (lossF(x, y + e, s) - lossF(x, y - e, s)) / (2 * e),
  };
};

export default function GradientDescent() {
  const canvasRef = useRef(null);
  const lossRef   = useRef(null);
  const stateRef  = useRef({ ball: { x: 3, y: 3, vx: 0, vy: 0 }, trail: [], hist: [], epoch: 0, running: false, raf: null, lr: 0.05, mom: 0.9, surface: "bowl" });
  const [lr, setLr] = useState(0.05);
  const [mom, setMom] = useState(0.9);
  const [surface, setSurface] = useState("bowl");
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ loss: "—", grad: "—", x: "—", iter: 0 });

  const drawMain = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const st = stateRef.current;
    const sc = 44, cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Heatmap
    const id = ctx.createImageData(W, H);
    for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
      const wx = (px - cx) / sc, wy = (py - cy) / sc;
      const l = lossF(wx, wy, st.surface);
      const t = clamp(l / 10, 0, 1);
      const i = (py * W + px) * 4;
      id.data[i]     = Math.floor(lerp(5, 255, t));
      id.data[i + 1] = Math.floor(lerp(200, 30, t));
      id.data[i + 2] = Math.floor(lerp(180, 80, t));
      id.data[i + 3] = Math.floor(lerp(18, 180, t));
    }
    ctx.putImageData(id, 0, 0);

    // Grid
    ctx.strokeStyle = "rgba(156,163,175,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Axis labels
    ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "10px Inter"; ctx.textAlign = "center";
    ctx.fillText("θ₁ →", W - 30, cy - 6);
    ctx.textAlign = "left"; ctx.fillText("↑ θ₂", cx + 6, 14);

    // Trail
    for (let i = 1; i < st.trail.length; i++) {
      const t = i / st.trail.length;
      ctx.beginPath();
      ctx.moveTo(cx + st.trail[i - 1].x * sc, cy + st.trail[i - 1].y * sc);
      ctx.lineTo(cx + st.trail[i].x * sc, cy + st.trail[i].y * sc);
      ctx.strokeStyle = `rgba(255,200,0,${t * 0.9})`; ctx.lineWidth = 1.8; ctx.stroke();
    }

    // Min marker
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124,58,237,0.2)"; ctx.fill();
    ctx.strokeStyle = "rgba(124,58,237,0.7)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = C.accent; ctx.font = "9px Inter"; ctx.textAlign = "center";
    ctx.fillText("MIN", cx, cy - 12);

    // Gradient arrow
    if (st.epoch > 0) {
      const g = gradF(st.ball.x, st.ball.y, st.surface);
      const bx = cx + st.ball.x * sc, by = cy + st.ball.y * sc;
      const mg = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
      if (mg > 0.001) {
        const al = Math.min(38, mg * 14);
        ctx.beginPath(); ctx.moveTo(bx, by);
        ctx.lineTo(bx - (g.dx / mg) * al, by - (g.dy / mg) * al);
        ctx.strokeStyle = "rgba(150,100,255,0.9)"; ctx.lineWidth = 2.5; ctx.stroke();
        // arrowhead
        const angle = Math.atan2(-(g.dy / mg), -(g.dx / mg));
        ctx.beginPath();
        ctx.moveTo(bx - (g.dx / mg) * al, by - (g.dy / mg) * al);
        ctx.lineTo(bx - (g.dx / mg) * al - 7 * Math.cos(angle - 0.4), by - (g.dy / mg) * al - 7 * Math.sin(angle - 0.4));
        ctx.lineTo(bx - (g.dx / mg) * al - 7 * Math.cos(angle + 0.4), by - (g.dy / mg) * al - 7 * Math.sin(angle + 0.4));
        ctx.closePath(); ctx.fillStyle = "rgba(150,100,255,0.9)"; ctx.fill();
      }
    }

    // Ball
    const bx = cx + st.ball.x * sc, by = cy + st.ball.y * sc;
    const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
    grd.addColorStop(0, "#1F2937"); grd.addColorStop(0.5, "#ffd700"); grd.addColorStop(1, "#ffc800");
    ctx.shadowBlur = 24; ctx.shadowColor = "#ffc800";
    ctx.beginPath(); ctx.arc(bx, by, 11, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,200,0,0.3)"; ctx.lineWidth = 1; ctx.stroke();
  }, []);

  const drawLoss = useCallback(() => {
    const canvas = lossRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const h = stateRef.current.hist;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(124,58,237,0.05)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (h.length < 2) return;
    const mx = Math.max(...h), mn = Math.min(...h), r = mx - mn || 1;
    // Fill gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "rgba(124,58,237,0.3)");
    gradient.addColorStop(1, "rgba(124,58,237,0)");
    ctx.beginPath();
    h.forEach((v, i) => { const x = (i / (h.length - 1)) * W, y = H - ((v - mn) / r) * (H - 6) - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath();
    h.forEach((v, i) => { const x = (i / (h.length - 1)) * W, y = H - ((v - mn) / r) * (H - 6) - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.stroke();
  }, []);

  const step = useCallback(() => {
    const st = stateRef.current;
    const g = gradF(st.ball.x, st.ball.y, st.surface);
    st.ball.vx = st.mom * st.ball.vx - st.lr * g.dx;
    st.ball.vy = st.mom * st.ball.vy - st.lr * g.dy;
    st.ball.x = clamp(st.ball.x + st.ball.vx, -5, 5);
    st.ball.y = clamp(st.ball.y + st.ball.vy, -5, 5);
    st.trail.push({ x: st.ball.x, y: st.ball.y });
    if (st.trail.length > 200) st.trail.shift();
    const l = lossF(st.ball.x, st.ball.y, st.surface);
    const gm = Math.sqrt(g.dx ** 2 + g.dy ** 2);
    st.hist.push(l); if (st.hist.length > 120) st.hist.shift();
    st.epoch++;
    setMetrics({ loss: fmt(l), grad: fmt(gm), x: fmt(st.ball.x, 3), iter: st.epoch });
  }, []);

  useEffect(() => { stateRef.current.lr = lr; }, [lr]);
  useEffect(() => { stateRef.current.mom = mom; }, [mom]);
  useEffect(() => { stateRef.current.surface = surface; }, [surface]);

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
      const l = lossRef.current; if (l) { l.width = l.offsetWidth; l.height = l.offsetHeight; }
    };
    resize();
    const loop = () => {
      if (stateRef.current.running) step();
      drawMain(); drawLoss();
      stateRef.current.raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf); };
  }, [step, drawMain, drawLoss]);

  const toggleRun = () => { const r = !running; stateRef.current.running = r; setRunning(r); };
  const reset = () => {
    const st = stateRef.current;
    st.ball = { x: rand(-4, 4), y: rand(-4, 4), vx: 0, vy: 0 };
    st.trail = []; st.hist = []; st.epoch = 0; st.running = false;
    setRunning(false); setMetrics({ loss: "—", grad: "—", x: "—", iter: 0 });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={S.cardTitle}>LOSS LANDSCAPE</span>
            <span style={{ ...S.val, fontSize: 11 }}>Iter: {metrics.iter}</span>
          </div>
          <div style={{ ...S.canvasWrap, position: "relative" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 340, display: "block" }} />
            <div style={{ position: "absolute", top: 8, right: 10, fontSize: 9, color: "rgba(124,58,237,0.5)", fontFamily: "Inter, sans-serif" }}>
              ● ball  — trail  → gradient
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ ...S.label, marginBottom: 6 }}>LOSS HISTORY</div>
            <div style={S.canvasWrap}>
              <canvas ref={lossRef} style={{ width: "100%", height: 90, display: "block" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>PARAMETERS</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Learning Rate α</span>
              <span style={S.val}>{lr.toFixed(3)}</span>
            </div>
            <input type="range" style={S.range} min={0.001} max={0.5} step={0.001} value={lr} onChange={e => setLr(+e.target.value)} />
            <div style={{ ...S.infoBox(), marginTop: 10, fontSize: 10 }}>
              Too high → overshoot & diverge. Too low → slow convergence.
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Momentum β</span>
              <span style={S.val}>{mom.toFixed(2)}</span>
            </div>
            <input type="range" style={S.range} min={0} max={0.99} step={0.01} value={mom} onChange={e => setMom(+e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Loss Surface</div>
            <select style={S.select} value={surface} onChange={e => { setSurface(e.target.value); reset(); }}>
              <option value="bowl">Bowl (Convex)</option>
              <option value="saddle">Saddle Point</option>
              <option value="banana">Rosenbrock Banana</option>
              <option value="valleys">Multiple Valleys</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={toggleRun}>{running ? "⏸ Pause" : "▶ Start"}</button>
            <button style={S.btn("secondary")} onClick={step}>⏭ Step</button>
            <button style={S.btn("danger")} onClick={reset}>↺</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>LIVE METRICS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Loss", metrics.loss], ["‖∇L‖", metrics.grad], ["θ₁", metrics.x], ["Steps", metrics.iter]].map(([l, v]) => (
              <div key={l} style={S.metric}>
                <span style={S.metricVal}>{v}</span>
                <span style={S.metricLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>ALGORITHM</div>
          {[
            ["Update Rule", "θ ← θ − α ∇L(θ)"],
            ["With Momentum", "v ← βv − α∇L(θ)"],
            ["", "θ ← θ + v"],
          ].map(([k, v], i) => (
            <div key={i} style={{ marginBottom: 8, padding: "8px 10px", background: C.surfaceDeep, borderRadius: 6, border: `1px solid ${C.border}` }}>
              {k && <div style={{ ...S.label, marginBottom: 4 }}>{k}</div>}
              <div style={{ fontSize: 12, color: C.accent, fontFamily: "Inter, sans-serif", letterSpacing: 0.5 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
