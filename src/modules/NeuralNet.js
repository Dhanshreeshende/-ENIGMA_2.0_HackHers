import { useState, useEffect, useRef } from "react";
import { S, C } from "../styles";
import { rand, sigmoid, lerp, fmt } from "../utils";

const activation = (x, fn) => {
  switch (fn) {
    case "relu": return Math.max(0, x);
    case "sigmoid": return sigmoid(x);
    case "tanh": return Math.tanh(x);
    case "leaky": return x > 0 ? x : 0.01 * x;
    default: return Math.max(0, x);
  }
};
const activationD = (x, fn) => {
  switch (fn) {
    case "relu": return x > 0 ? 1 : 0;
    case "sigmoid": { const s = sigmoid(x); return s * (1 - s); }
    case "tanh": return 1 - Math.tanh(x) ** 2;
    case "leaky": return x > 0 ? 1 : 0.01;
    default: return x > 0 ? 1 : 0;
  }
};

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
    for (let j = 0; j < ls[l + 1]; j++) {
      let z = B[l][j];
      for (let k = 0; k < ls[l]; k++) z += W[l][j][k] * a[k];
      pre.push(z);
      nxt.push(l === W.length - 1 ? sigmoid(z) : activation(z, actFn));
    }
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
    for (let j = 0; j < ls[l + 1]; j++) {
      B[l][j] -= lr * dZ[j];
      for (let k = 0; k < ls[l]; k++) { dP[k] += W[l][j][k] * dZ[j]; W[l][j][k] -= lr * dZ[j] * acts[l][k]; }
    }
    dA = dP;
  }
  return loss;
};

const genData = (t, n = 100) => {
  const d = [];
  if (t === "xor") { for (let i = 0; i < n; i++) { const x = rand(-1, 1), y = rand(-1, 1); d.push({ x, y, l: (x > 0) !== (y > 0) ? 1 : 0 }); } }
  else if (t === "circle") { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), r = i < n / 2 ? rand(0, 0.45) : rand(0.65, 1); d.push({ x: Math.cos(a) * r + rand(-0.05, 0.05), y: Math.sin(a) * r + rand(-0.05, 0.05), l: i < n / 2 ? 1 : 0 }); } }
  else if (t === "spiral") { for (let c = 0; c < 2; c++) for (let i = 0; i < n / 2; i++) { const tt = i / (n / 2) * Math.PI * 3, r = tt / (Math.PI * 3); d.push({ x: r * Math.cos(tt + c * Math.PI) + rand(-0.07, 0.07), y: r * Math.sin(tt + c * Math.PI) + rand(-0.07, 0.07), l: c }); } }
  else { for (let i = 0; i < n; i++) { const x = rand(-1, 1), y = rand(-1, 1); d.push({ x, y, l: y > x * 0.8 ? 1 : 0 }); } }
  return d;
};

const drawNet = (canvas, W, B, ls) => {
  const ctx = canvas.getContext("2d"), CW = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, CW, H);
  ctx.strokeStyle = "rgba(124,58,237,0.03)"; ctx.lineWidth = 0.5;
  for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  const lw = CW / (ls.length + 1), pos = [];
  for (let l = 0; l < ls.length; l++) {
    const x = lw * (l + 1), ps = [];
    for (let n = 0; n < ls[l]; n++) ps.push({ x, y: H / (ls[l] + 1) * (n + 1) });
    pos.push(ps);
  }
  for (let l = 0; l < ls.length - 1; l++) for (let i = 0; i < ls[l]; i++) for (let j = 0; j < ls[l + 1]; j++) {
    const w = W[l] ? W[l][j][i] : 0, al = Math.min(0.8, Math.abs(w) * 2.5);
    ctx.beginPath(); ctx.moveTo(pos[l][i].x, pos[l][i].y); ctx.lineTo(pos[l + 1][j].x, pos[l + 1][j].y);
    ctx.strokeStyle = w > 0 ? `rgba(124,58,237,${al})` : `rgba(255,50,100,${al})`;
    ctx.lineWidth = Math.min(2.5, Math.abs(w) + 0.3); ctx.stroke();
  }
  const layerColors = ["#7C3AED", "#a855f7", "#ffc800", "#ff3264", "#4cc9f0"];
  const layerLabels = ["INPUT", "HIDDEN", "HIDDEN", "HIDDEN", "HIDDEN", "OUTPUT"];
  for (let l = 0; l < ls.length; l++) {
    for (let n = 0; n < ls[l]; n++) {
      const { x, y } = pos[l][n], col = layerColors[l % layerColors.length];
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 14);
      grd.addColorStop(0, col + "80"); grd.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = "#1F2937"; ctx.fill();
      ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.fillStyle = "rgba(156,163,175,0.25)"; ctx.font = "8px Inter"; ctx.textAlign = "center";
    const lbl = l === 0 ? "INPUT" : l === ls.length - 1 ? "OUTPUT" : `HIDDEN`;
    ctx.fillText(lbl, pos[l][0].x, H - 4);
  }
};

const drawDec = (canvas, W, B, ls, data, actFn) => {
  const ctx = canvas.getContext("2d"), CW = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, CW, H);
  const res = 30;
  for (let px = 0; px < CW; px += CW / res) for (let py = 0; py < H; py += H / res) {
    const { out } = forward([(px / CW) * 2 - 1, (py / H) * 2 - 1], W, B, ls, actFn);
    const alpha = 0.4;
    ctx.fillStyle = out > 0.5 ? `rgba(0,${Math.floor(lerp(50, 255, out))},${Math.floor(lerp(100, 200, out))},${alpha})` : `rgba(${Math.floor(lerp(0, 255, 1 - out))},50,100,${alpha})`;
    ctx.fillRect(px, py, CW / res + 2, H / res + 2);
  }
  if (data) for (const p of data) {
    const px = (p.x + 1) / 2 * CW, py = (p.y + 1) / 2 * H;
    const col = p.l === 1 ? "#7C3AED" : "#ff3264";
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = col + "cc"; ctx.fill();
  }
};

const drawLossChart = (canvas, hist) => {
  const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(168,85,247,0.05)"; ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  if (hist.length < 2) return;
  const mx = Math.max(...hist), mn = Math.min(...hist), r = mx - mn || 1;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(168,85,247,0.3)"); grad.addColorStop(1, "rgba(168,85,247,0)");
  ctx.beginPath();
  hist.forEach((v, i) => { const x = i / (hist.length - 1) * W, y = H - ((v - mn) / r) * (H - 6) - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  hist.forEach((v, i) => { const x = i / (hist.length - 1) * W, y = H - ((v - mn) / r) * (H - 6) - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.strokeStyle = "rgba(168,85,247,0.9)"; ctx.lineWidth = 2; ctx.stroke();
};

export default function NeuralNet() {
  const netRef = useRef(null), decRef = useRef(null), lossRef = useRef(null);
  const stateRef = useRef({ W: [], B: [], layers: [2, 4, 4, 1], act: "relu", lr: 0.015, ds: "xor", data: [], hist: [], epoch: 0, running: false, raf: null });
  const [layers, setLayers] = useState([2, 4, 4, 1]);
  const [act, setAct] = useState("relu");
  const [lr, setLr] = useState(0.015);
  const [ds, setDs] = useState("xor");
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ loss: "—", acc: "—", ep: 0 });

  useEffect(() => {
    const st = stateRef.current;
    [netRef, decRef, lossRef].forEach(r => { const c = r.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; } });
    st.data = genData(st.ds);
    const { W, B } = initWeights(st.layers); st.W = W; st.B = B;
    let frame = 0;
    const loop = () => {
      if (st.running) {
        let tl = 0, ok = 0;
        for (let i = 0; i < 5; i++) for (const p of st.data) {
          const l = backward([p.x, p.y], p.l, st.W, st.B, st.layers, st.act, st.lr);
          tl += l;
          const { out } = forward([p.x, p.y], st.W, st.B, st.layers, st.act);
          if ((out > 0.5) === (p.l === 1)) ok++;
        }
        const al = tl / (st.data.length * 5), ac = ok / (st.data.length * 5);
        st.hist.push(al); if (st.hist.length > 100) st.hist.shift(); st.epoch++;
        if (frame % 3 === 0) setMetrics({ loss: fmt(al), acc: (ac * 100).toFixed(1) + "%", ep: st.epoch });
      }
      if (frame % 2 === 0 && netRef.current) drawNet(netRef.current, st.W, st.B, st.layers);
      if (frame % 3 === 0 && decRef.current) drawDec(decRef.current, st.W, st.B, st.layers, st.data, st.act);
      if (frame % 3 === 0 && lossRef.current) drawLossChart(lossRef.current, st.hist);
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
  const addLayer = () => {
    if (layers.length >= 6) return;
    const nl = [...layers]; nl.splice(nl.length - 1, 0, 4); setLayers(nl);
    stateRef.current.layers = nl; const { W, B } = initWeights(nl); stateRef.current.W = W; stateRef.current.B = B;
  };
  const remLayer = () => {
    if (layers.length <= 2) return;
    const nl = [...layers]; nl.splice(nl.length - 2, 1); setLayers(nl);
    stateRef.current.layers = nl; const { W, B } = initWeights(nl); stateRef.current.W = W; stateRef.current.B = B;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={S.cardTitle}>NETWORK TOPOLOGY</span>
            <span style={{ ...S.label }}>Architecture: [{layers.join(" → ")}]</span>
          </div>
          <div style={S.canvasWrap}>
            <canvas ref={netRef} style={{ width: "100%", height: 280, display: "block" }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={S.card}>
            <div style={S.cardTitle}>DECISION BOUNDARY</div>
            <div style={S.canvasWrap}>
              <canvas ref={decRef} style={{ width: "100%", height: 180, display: "block" }} />
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>TRAINING LOSS</div>
            <div style={S.canvasWrap}>
              <canvas ref={lossRef} style={{ width: "100%", height: 180, display: "block" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>CONFIG</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>Dataset</div>
            <select style={S.select} value={ds} onChange={e => setDs(e.target.value)}>
              <option value="xor">XOR</option>
              <option value="circle">Circles</option>
              <option value="spiral">Spiral</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...S.label, marginBottom: 7 }}>Activation</div>
            <select style={S.select} value={act} onChange={e => setAct(e.target.value)}>
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="tanh">Tanh</option>
              <option value="leaky">Leaky ReLU</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={S.label}>Learning Rate</span><span style={S.val}>{lr.toFixed(3)}</span>
            </div>
            <input type="range" style={S.range} min={0.001} max={0.1} step={0.001} value={lr} onChange={e => setLr(+e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>Hidden Layers</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...S.btn("secondary"), flex: 1, fontSize: 11 }} onClick={addLayer}>+ Add Layer</button>
              <button style={{ ...S.btn("secondary"), flex: 1, fontSize: 11 }} onClick={remLayer}>− Remove</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn("primary"), flex: 1 }} onClick={toggleRun}>{running ? "⏸ Pause" : "▶ Train"}</button>
            <button style={S.btn("danger")} onClick={resetNet}>↺</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>METRICS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Loss", metrics.loss], ["Accuracy", metrics.acc], ["Epoch", metrics.ep], ["Depth", layers.length]].map(([l, v]) => (
              <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>BACKPROP</div>
          <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
            <strong style={{ color: C.accent }}>Forward pass:</strong> Compute activations layer-by-layer.<br/>
            <strong style={{ color: C.accent }}>Loss:</strong> Binary cross-entropy H(y, ŷ).<br/>
            <strong style={{ color: C.purple }}>Backward pass:</strong> Chain rule propagates ∂L/∂w.<br/>
            <strong style={{ color: C.warn }}>Update:</strong> w ← w − α·∂L/∂w
          </div>
        </div>
      </div>
    </div>
  );
}
