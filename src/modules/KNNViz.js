import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

const CL = ["#7C3AED", "#ff3264", "#ffc800"];

export default function KNNViz() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [mode, setMode] = useState("A");
  const [k, setK] = useState(3);
  const [query, setQuery] = useState(null);
  const [pred, setPred] = useState(null);
  const [votes, setVotes] = useState([0, 0, 0]);

  const draw = useCallback((pts, qpt, kv) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Voronoi bg
    if (pts.length > 0) {
      const res = 28;
      const id = ctx.createImageData(W, H);
      for (let px = 0; px < W; px++) for (let py = 0; py < H; py++) {
        const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
        const d = pts.map(p => ({ d: (wx - p.x) ** 2 + (wy - p.y) ** 2, cls: p.cls })).sort((a, b) => a.d - b.d).slice(0, kv);
        const v = [0, 0, 0]; d.forEach(x => v[x.cls]++);
        const w = v.indexOf(Math.max(...v));
        const color = w === 0 ? [124,58,237] : w === 1 ? [255, 50, 100] : [255, 200, 0];
        const i = (py * W + px) * 4;
        id.data[i] = color[0]; id.data[i + 1] = color[1]; id.data[i + 2] = color[2]; id.data[i + 3] = 30;
      }
      ctx.putImageData(id, 0, 0);
    }

    // Points
    for (const pt of pts) {
      const px = (pt.x + 1) / 2 * W, py = (pt.y + 1) / 2 * H;
      ctx.shadowBlur = 8; ctx.shadowColor = CL[pt.cls];
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = CL[pt.cls] + "cc"; ctx.fill();
      ctx.strokeStyle = CL[pt.cls]; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Query point and neighbors
    if (qpt) {
      const qx = (qpt.x + 1) / 2 * W, qy = (qpt.y + 1) / 2 * H;
      const d = pts.map(p => ({ d: Math.sqrt((qpt.x - p.x) ** 2 + (qpt.y - p.y) ** 2), cls: p.cls, x: p.x, y: p.y }))
        .sort((a, b) => a.d - b.d).slice(0, kv);

      if (d.length) {
        const mr = d[d.length - 1].d / 2 * W;
        ctx.beginPath(); ctx.arc(qx, qy, mr * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(168,85,247,0.25)"; ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      for (let i = 0; i < d.length; i++) {
        const nb = d[i];
        const nx = (nb.x + 1) / 2 * W, ny = (nb.y + 1) / 2 * H;
        // Line
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(nx, ny);
        ctx.strokeStyle = CL[nb.cls] + "60"; ctx.lineWidth = 1.5; ctx.stroke();
        // Rank label
        ctx.beginPath(); ctx.arc(nx, ny, 11, 0, Math.PI * 2);
        ctx.strokeStyle = CL[nb.cls]; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = CL[nb.cls]; ctx.font = "bold 9px Inter"; ctx.textAlign = "center";
        ctx.fillText(i + 1, nx, ny + 3.5);
      }
      const v = [0, 0, 0]; d.forEach(x => v[x.cls]++);
      const winner = v.indexOf(Math.max(...v));
      setPred(winner); setVotes([...v]);

      // Query glyph
      ctx.shadowBlur = 20; ctx.shadowColor = "#a855f7";
      ctx.beginPath(); ctx.arc(qx, qy, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#a855f7"; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(qx - 5, qy); ctx.lineTo(qx + 5, qy);
      ctx.moveTo(qx, qy - 5); ctx.lineTo(qx, qy + 5); ctx.stroke();
      ctx.fillStyle = "rgba(156,163,175,0.8)"; ctx.font = "8px Inter"; ctx.textAlign = "center";
      ctx.fillText("?", qx, qy + 20);
    }
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    draw([], null, k);
  }, []);

  useEffect(() => { draw(points, query, k); }, [points, query, k, draw]);

  const handleClick = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const wy = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (mode === "Q") { setQuery({ x: wx, y: wy }); }
    else { const m = { A: 0, B: 1, C: 2 }; setPoints(prev => [...prev, { x: wx, y: wy, cls: m[mode] }]); }
  };

  const autoAdd = () => {
    const newPts = [];
    for (let c = 0; c < 3; c++) {
      const cx = rand(-0.6, 0.6), cy = rand(-0.6, 0.6);
      for (let i = 0; i < 10; i++) newPts.push({ x: cx + rand(-0.2, 0.2), y: cy + rand(-0.2, 0.2), cls: c });
    }
    setPoints(prev => [...prev, ...newPts]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 16 }}>
      <div style={S.card}>
        <div style={S.cardTitle}>KNN CANVAS</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[["▲ Class A", "A", "#7C3AED"], ["● Class B", "B", "#ff3264"], ["■ Class C", "C", "#ffc800"], ["⊕ Query", "Q", "#a855f7"]].map(([l, m, col]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 7, border: `2px solid ${mode === m ? col : "transparent"}`,
              background: mode === m ? col + "18" : "transparent", color: col, cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} onClick={handleClick} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>K PARAMETER</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={S.label}>K Neighbors</span><span style={S.val}>{k}</span>
          </div>
          <input type="range" style={S.range} min={1} max={15} step={1} value={k} onChange={e => setK(+e.target.value)} />
          <div style={{ ...S.infoBox(), marginTop: 12, fontSize: 10 }}>
            K=1 → complex, fragile boundaries.<br/>
            K=large → smooth, more biased.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={autoAdd}>+ Auto Fill</button>
            <button style={S.btn("danger")} onClick={() => { setPoints([]); setQuery(null); setPred(null); setVotes([0, 0, 0]); }}>Clear</button>
          </div>
        </div>

        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={S.cardTitle}>PREDICTION</div>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "'Inter', monospace", color: pred !== null ? CL[pred] : "rgba(124,58,237,0.3)", marginBottom: 6, textShadow: pred !== null ? `0 0 30px ${CL[pred]}` : "none", transition: "all 0.3s" }}>
            {pred !== null ? ["A", "B", "C"][pred] : "?"}
          </div>
          <div style={S.label}>Predicted Class</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {["A", "B", "C"].map((l, i) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: CL[i], minWidth: 54, textAlign: "left", fontWeight: 700 }}>Class {l}</span>
                <div style={{ flex: 1, height: 6, background: "rgba(156,163,175,0.07)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${k > 0 ? (votes[i] / k) * 100 : 0}%`, background: CL[i], borderRadius: 3, transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 8px ${CL[i]}` }} />
                </div>
                <span style={{ fontSize: 10, color: "rgba(156,163,175,0.35)", minWidth: 28, textAlign: "right" }}>{votes[i]}/{k}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>ALGORITHM STEPS</div>
          {[["1", "Compute Distances", "d(q,p) = √(Δx²+Δy²)"], ["2", "Find K Nearest", "Sort by distance, take K"], ["3", "Majority Vote", "Class = argmax(votes)"]].map(([n, t, d]) => (
            <div key={n} style={{ display: "flex", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.1)", border: `1px solid rgba(124,58,237,0.3)`, color: C.accent, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Inter" }}>{n}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>{t}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
