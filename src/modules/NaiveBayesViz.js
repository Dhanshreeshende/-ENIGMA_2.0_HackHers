import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function NaiveBayesViz() {
    const canvasRef = useRef(null);
    const distRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [query, setQuery] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [priors, setPriors] = useState([0.5, 0.5]);
    const [posteriors, setPosteriors] = useState([0.5, 0.5]);
    const CL = ["#7C3AED", "#ff3264"];

    const gaussianPDF = (x, mean, std) => {
        if (std < 0.001) std = 0.001;
        return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
    };

    const computeStats = useCallback((pts) => {
        const stats = [{ mx: 0, my: 0, sx: 0.3, sy: 0.3, n: 0 }, { mx: 0, my: 0, sx: 0.3, sy: 0.3, n: 0 }];
        for (let c = 0; c < 2; c++) {
            const cp = pts.filter(p => p.cls === c);
            if (cp.length < 2) continue;
            const mx = cp.reduce((s, p) => s + p.x, 0) / cp.length;
            const my = cp.reduce((s, p) => s + p.y, 0) / cp.length;
            const sx = Math.sqrt(cp.reduce((s, p) => s + (p.x - mx) ** 2, 0) / cp.length) || 0.1;
            const sy = Math.sqrt(cp.reduce((s, p) => s + (p.y - my) ** 2, 0) / cp.length) || 0.1;
            stats[c] = { mx, my, sx, sy, n: cp.length };
        }
        return stats;
    }, []);

    const classify = useCallback((x, y, pts) => {
        if (pts.length < 4) return [0.5, 0.5];
        const stats = computeStats(pts);
        const total = pts.length;
        const post = [0, 0];
        for (let c = 0; c < 2; c++) {
            const prior = stats[c].n / total || 0.5;
            const lx = gaussianPDF(x, stats[c].mx, stats[c].sx);
            const ly = gaussianPDF(y, stats[c].my, stats[c].sy);
            post[c] = prior * lx * ly;
        }
        const sum = post[0] + post[1];
        if (sum > 0) { post[0] /= sum; post[1] /= sum; }
        return post;
    }, [computeStats]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const px = (v) => (v + 1) / 2 * W;
        const py = (v) => (v + 1) / 2 * H;

        // Decision boundary heatmap
        if (points.length >= 4) {
            const res = 5;
            for (let x = 0; x < W; x += res) {
                for (let y = 0; y < H; y += res) {
                    const wx = (x / W) * 2 - 1, wy = (y / H) * 2 - 1;
                    const [p0, p1] = classify(wx, wy, points);
                    const col = p0 > p1 ? [124,58,237] : [255, 50, 100];
                    const alpha = Math.abs(p0 - p1) * 0.2;
                    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
                    ctx.fillRect(x, y, res, res);
                }
            }

            // Gaussian ellipses
            const stats = computeStats(points);
            for (let c = 0; c < 2; c++) {
                const s = stats[c];
                for (let r = 3; r >= 1; r--) {
                    ctx.beginPath(); ctx.ellipse(px(s.mx), py(s.my), s.sx * r * W / 2, s.sy * r * H / 2, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = CL[c] + (r === 1 ? "60" : r === 2 ? "30" : "15");
                    ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
                }
                // Mean marker
                ctx.beginPath(); ctx.arc(px(s.mx), py(s.my), 4, 0, Math.PI * 2);
                ctx.fillStyle = CL[c]; ctx.fill();
                ctx.fillStyle = CL[c]; ctx.font = "bold 9px Inter"; ctx.textAlign = "center";
                ctx.fillText(`μ${c}`, px(s.mx), py(s.my) - 10);
            }
        }

        // Points
        for (const p of points) {
            const x = px(p.x), y = py(p.y);
            ctx.shadowBlur = 6; ctx.shadowColor = CL[p.cls];
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = CL[p.cls] + "cc"; ctx.fill(); ctx.shadowBlur = 0;
        }

        // Query
        if (query) {
            const qx = px(query.x), qy = py(query.y);
            ctx.shadowBlur = 15; ctx.shadowColor = "#a855f7";
            ctx.beginPath(); ctx.arc(qx, qy, 10, 0, Math.PI * 2);
            ctx.fillStyle = "#a855f7"; ctx.fill(); ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.moveTo(qx - 5, qy); ctx.lineTo(qx + 5, qy);
            ctx.moveTo(qx, qy - 5); ctx.lineTo(qx, qy + 5);
            ctx.strokeStyle = "#1F2937"; ctx.lineWidth = 2; ctx.stroke();
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
        }

        // Distribution chart
        const dc = distRef.current; if (!dc || points.length < 4) return;
        const dctx = dc.getContext("2d");
        const DW = dc.width, DH = dc.height;
        dctx.clearRect(0, 0, DW, DH);
        const stats = computeStats(points);
        for (let c = 0; c < 2; c++) {
            dctx.beginPath();
            for (let i = 0; i <= DW; i++) {
                const x = (i / DW) * 2 - 1;
                const pdf = gaussianPDF(x, stats[c].mx, stats[c].sx);
                const y = DH - pdf * DH * stats[c].sx * 2;
                i === 0 ? dctx.moveTo(i, y) : dctx.lineTo(i, y);
            }
            dctx.strokeStyle = CL[c]; dctx.lineWidth = 2; dctx.stroke();
            dctx.lineTo(DW, DH); dctx.lineTo(0, DH); dctx.closePath();
            dctx.fillStyle = CL[c] + "15"; dctx.fill();
        }
        dctx.fillStyle = "rgba(156,163,175,0.3)"; dctx.font = "9px Inter"; dctx.textAlign = "center";
        dctx.fillText("P(x | class) — Feature X distribution", DW / 2, DH - 4);
    }, [points, query, classify, computeStats, CL]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        const d = distRef.current; if (d) { d.width = d.offsetWidth; d.height = d.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    useEffect(() => {
        if (query && points.length >= 4) {
            const post = classify(query.x, query.y, points);
            setPosteriors(post);
            setPrediction(post[0] > post[1] ? 0 : 1);
            const total = points.length;
            setPriors([points.filter(p => p.cls === 0).length / total, points.filter(p => p.cls === 1).length / total]);
        }
    }, [query, points, classify]);

    const [mode, setMode] = useState(0);
    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const wx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const wy = ((e.clientY - r.top) / r.height) * 2 - 1;
        if (mode === 2) setQuery({ x: wx, y: wy });
        else setPoints(prev => [...prev, { x: wx, y: wy, cls: mode }]);
    };

    const addPreset = () => {
        const pts = [];
        for (let i = 0; i < 20; i++) pts.push({ x: rand(-0.7, -0.1), y: rand(-0.5, 0.3), cls: 0 });
        for (let i = 0; i < 20; i++) pts.push({ x: rand(0.1, 0.7), y: rand(-0.2, 0.6), cls: 1 });
        setPoints(pts);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>NAIVE BAYES CLASSIFIER</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {[["● Class 0", 0, "#7C3AED"], ["● Class 1", 1, "#ff3264"], ["⊕ Query", 2, "#a855f7"]].map(([l, m, col]) => (
                            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px", borderRadius: 7, border: `2px solid ${mode === m ? col : "transparent"}`, background: mode === m ? col + "18" : "transparent", color: col, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700 }}>{l}</button>
                        ))}
                    </div>
                    <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: 320, display: "block" }} onClick={handleClick} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>CLASS-CONDITIONAL DISTRIBUTIONS P(x|C)</div>
                    <canvas ref={distRef} style={{ width: "100%", height: 100, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>POSTERIOR P(C|x)</div>
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Inter", color: prediction !== null ? CL[prediction] : "rgba(156,163,175,0.3)", textShadow: prediction !== null ? `0 0 20px ${CL[prediction]}` : "none" }}>
                            {prediction !== null ? `Class ${prediction}` : "?"}
                        </div>
                    </div>
                    {[0, 1].map(c => (
                        <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 10, color: CL[c], minWidth: 50, fontWeight: 700 }}>Class {c}</span>
                            <div style={{ flex: 1, height: 8, background: "rgba(156,163,175,0.07)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${posteriors[c] * 100}%`, background: CL[c], borderRadius: 4, transition: "width 0.3s", boxShadow: `0 0 8px ${CL[c]}` }} />
                            </div>
                            <span style={{ fontSize: 10, color: "rgba(156,163,175,0.5)", minWidth: 40, textAlign: "right" }}>{(posteriors[c] * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>PRIORS P(C)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["P(C₀)", fmt(priors[0], 3)], ["P(C₁)", fmt(priors[1], 3)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>CONTROLS</div>
                    <button style={{ ...S.btn("primary"), width: "100%", marginBottom: 6 }} onClick={addPreset}>Auto Fill Data</button>
                    <button style={{ ...S.btn("danger"), width: "100%" }} onClick={() => { setPoints([]); setQuery(null); setPrediction(null); }}>↺ Clear</button>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>BAYES THEOREM</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>P(C|x) = P(x|C)·P(C) / P(x)</strong><br />
                        <strong style={{ color: "#a855f7" }}>Naive:</strong> Features are independent<br />
                        <strong style={{ color: "#ffc800" }}>P(x|C):</strong> Gaussian per feature<br />
                        <strong style={{ color: "#ff3264" }}>Decision:</strong> argmax P(C|x)
                    </div>
                </div>
            </div>
        </div>
    );
}
