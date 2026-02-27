import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

export default function SVMViz() {
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [mode, setMode] = useState(0);
    const [kernelType, setKernelType] = useState("linear");
    const [cParam, setCParam] = useState(1.0);
    const [gamma, setGamma] = useState(0.5);

    const classify = useCallback((x, y, pts, kernel, g) => {
        if (pts.length < 2) return 0;
        let sum = 0, count = [0, 0];
        for (const p of pts) count[p.cls]++;
        if (count[0] === 0 || count[1] === 0) return pts[0]?.cls === 0 ? -1 : 1;

        for (const p of pts) {
            const label = p.cls === 0 ? -1 : 1;
            let k;
            if (kernel === "linear") k = x * p.x + y * p.y;
            else if (kernel === "rbf") k = Math.exp(-g * ((x - p.x) ** 2 + (y - p.y) ** 2));
            else if (kernel === "poly") k = (1 + x * p.x + y * p.y) ** 3;
            else k = x * p.x + y * p.y;
            sum += label * k;
        }
        return sum / pts.length;
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Decision boundary heatmap
        if (points.length >= 2) {
            const res = 4;
            for (let px = 0; px < W; px += res) {
                for (let py = 0; py < H; py += res) {
                    const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
                    const score = classify(wx, wy, points, kernelType, gamma);
                    const t = Math.min(1, Math.abs(score) * 2);
                    if (score > 0) ctx.fillStyle = `rgba(124,58,237,${t * 0.15})`;
                    else ctx.fillStyle = `rgba(255,50,100,${t * 0.15})`;
                    ctx.fillRect(px, py, res, res);
                }
            }
            // Decision boundary line
            for (let px = 1; px < W - 1; px += 2) {
                for (let py = 1; py < H - 1; py += 2) {
                    const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
                    const s0 = classify(wx, wy, points, kernelType, gamma);
                    const s1 = classify(wx + 2 / W, wy, points, kernelType, gamma);
                    const s2 = classify(wx, wy + 2 / H, points, kernelType, gamma);
                    if ((s0 > 0) !== (s1 > 0) || (s0 > 0) !== (s2 > 0)) {
                        ctx.fillStyle = "rgba(168,85,247,0.8)";
                        ctx.fillRect(px, py, 2, 2);
                    }
                    // Margin lines
                    const margin = 0.15 * cParam;
                    if (Math.abs(Math.abs(s0) - margin) < 0.05) {
                        ctx.fillStyle = "rgba(168,85,247,0.25)";
                        ctx.fillRect(px, py, 2, 2);
                    }
                }
            }
        }

        // Support vectors highlight
        if (points.length >= 2) {
            const dists = points.map(p => ({
                ...p,
                dist: Math.abs(classify(p.x, p.y, points, kernelType, gamma))
            })).sort((a, b) => a.dist - b.dist);
            const svCount = Math.min(6, Math.floor(points.length * 0.3) + 1);
            for (let i = 0; i < svCount && i < dists.length; i++) {
                const sv = dists[i];
                const px = (sv.x + 1) / 2 * W, py = (sv.y + 1) / 2 * H;
                ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(168,85,247,0.6)"; ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
            }
        }

        // Points
        for (const p of points) {
            const px = (p.x + 1) / 2 * W, py = (p.y + 1) / 2 * H;
            const col = p.cls === 0 ? "#7C3AED" : "#ff3264";
            ctx.shadowBlur = 8; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = col + "cc"; ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
            ctx.fillText("Select class below first", W / 2, H / 2 + 20);
        }
    }, [points, kernelType, gamma, cParam, classify]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const wx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const wy = ((e.clientY - r.top) / r.height) * 2 - 1;
        setPoints(prev => [...prev, { x: wx, y: wy, cls: mode }]);
    };

    const addPreset = (type) => {
        const pts = [];
        if (type === "linear") {
            for (let i = 0; i < 20; i++) pts.push({ x: rand(-0.8, -0.1), y: rand(-0.8, 0.8), cls: 0 });
            for (let i = 0; i < 20; i++) pts.push({ x: rand(0.1, 0.8), y: rand(-0.8, 0.8), cls: 1 });
        } else if (type === "circle") {
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI * 2), r = rand(0, 0.35); pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 0 }); }
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI * 2), r = rand(0.55, 0.85); pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, cls: 1 }); }
        } else if (type === "moons") {
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI); pts.push({ x: Math.cos(a) * 0.5, y: Math.sin(a) * 0.5 + rand(-0.05, 0.05), cls: 0 }); }
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI); pts.push({ x: Math.cos(a) * 0.5 + 0.5, y: -Math.sin(a) * 0.5 + 0.3 + rand(-0.05, 0.05), cls: 1 }); }
        }
        setPoints(pts);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>SVM DECISION SPACE</span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
                        <span style={{ color: "#a855f7" }}>●</span> Support Vectors | <span style={{ color: "#a855f7" }}>━</span> Boundary
                    </span>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {[["● Class −1", 0, "#7C3AED"], ["● Class +1", 1, "#ff3264"]].map(([l, m, col]) => (
                        <button key={m} onClick={() => setMode(m)} style={{
                            flex: 1, padding: "8px", borderRadius: 7, border: `2px solid ${mode === m ? col : "transparent"}`,
                            background: mode === m ? col + "18" : "transparent", color: col, cursor: "pointer",
                            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, transition: "all 0.2s",
                        }}>{l}</button>
                    ))}
                </div>
                <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 400, display: "block" }} onClick={handleClick} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>KERNEL</div>
                    <select style={S.select} value={kernelType} onChange={e => setKernelType(e.target.value)}>
                        <option value="linear">Linear</option>
                        <option value="rbf">RBF (Gaussian)</option>
                        <option value="poly">Polynomial (d=3)</option>
                    </select>
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={S.label}>C (Regularization)</span><span style={S.val}>{cParam.toFixed(2)}</span>
                        </div>
                        <input type="range" style={S.range} min={0.1} max={5} step={0.1} value={cParam} onChange={e => setCParam(+e.target.value)} />
                    </div>
                    {kernelType === "rbf" && <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={S.label}>γ (Gamma)</span><span style={S.val}>{gamma.toFixed(2)}</span>
                        </div>
                        <input type="range" style={S.range} min={0.1} max={5} step={0.1} value={gamma} onChange={e => setGamma(+e.target.value)} />
                    </div>}
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>PRESETS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={S.btn("primary")} onClick={() => addPreset("linear")}>Linear Separable</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("circle")}>Circular</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("moons")}>Half Moons</button>
                        <button style={S.btn("danger")} onClick={() => setPoints([])}>↺ Clear</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>SVM THEORY</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Objective:</strong> max margin = 2/‖w‖<br />
                        <strong style={{ color: "#a855f7" }}>Kernel Trick:</strong> K(x,x') = φ(x)·φ(x')<br />
                        <strong style={{ color: "#ffc800" }}>RBF:</strong> exp(−γ‖x−x'‖²)<br />
                        <strong style={{ color: "#ff3264" }}>Soft Margin:</strong> C controls slack
                    </div>
                </div>
            </div>
        </div>
    );
}
