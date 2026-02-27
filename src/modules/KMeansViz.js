import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

export default function KMeansViz() {
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [k, setK] = useState(3);
    const [centroids, setCentroids] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [step, setStep] = useState(0);
    const [running, setRunning] = useState(false);
    const [converged, setConverged] = useState(false);
    const CL = ["#7C3AED", "#ff3264", "#ffc800", "#4cc9f0", "#a855f7", "#ff8c00", "#00d4ff"];

    const initCentroids = useCallback((pts, numK) => {
        if (pts.length < numK) return [];
        const cs = [];
        const used = new Set();
        for (let i = 0; i < numK; i++) {
            let idx;
            do { idx = Math.floor(Math.random() * pts.length); } while (used.has(idx));
            used.add(idx);
            cs.push({ x: pts[idx].x + rand(-0.05, 0.05), y: pts[idx].y + rand(-0.05, 0.05) });
        }
        return cs;
    }, []);

    const assignPoints = useCallback((pts, cs) => {
        return pts.map(p => {
            let minD = Infinity, minI = 0;
            cs.forEach((c, i) => {
                const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
                if (d < minD) { minD = d; minI = i; }
            });
            return minI;
        });
    }, []);

    const updateCentroids = useCallback((pts, asgn, numK) => {
        const cs = [];
        for (let i = 0; i < numK; i++) {
            let sx = 0, sy = 0, count = 0;
            pts.forEach((p, j) => { if (asgn[j] === i) { sx += p.x; sy += p.y; count++; } });
            cs.push(count > 0 ? { x: sx / count, y: sy / count } : { x: rand(-0.5, 0.5), y: rand(-0.5, 0.5) });
        }
        return cs;
    }, []);

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

        // Voronoi regions
        if (centroids.length > 0) {
            const res = 5;
            for (let x = 0; x < W; x += res) {
                for (let y = 0; y < H; y += res) {
                    const wx = (x / W) * 2 - 1, wy = (y / H) * 2 - 1;
                    let minD = Infinity, minI = 0;
                    centroids.forEach((c, i) => { const d = (wx - c.x) ** 2 + (wy - c.y) ** 2; if (d < minD) { minD = d; minI = i; } });
                    const col = CL[minI % CL.length];
                    const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
                    ctx.fillStyle = `rgba(${r},${g},${b},0.05)`;
                    ctx.fillRect(x, y, res, res);
                }
            }
        }

        // Assignment lines
        if (assignments.length > 0 && centroids.length > 0) {
            points.forEach((p, i) => {
                const ci = assignments[i];
                if (ci !== undefined && centroids[ci]) {
                    ctx.beginPath(); ctx.moveTo(px(p.x), py(p.y)); ctx.lineTo(px(centroids[ci].x), py(centroids[ci].y));
                    ctx.strokeStyle = CL[ci % CL.length] + "25"; ctx.lineWidth = 1; ctx.stroke();
                }
            });
        }

        // Points
        points.forEach((p, i) => {
            const col = assignments.length > 0 ? CL[assignments[i] % CL.length] : "rgba(156,163,175,0.5)";
            ctx.shadowBlur = 6; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 5, 0, Math.PI * 2);
            ctx.fillStyle = col + "cc"; ctx.fill(); ctx.shadowBlur = 0;
        });

        // Centroids
        centroids.forEach((c, i) => {
            const col = CL[i % CL.length];
            ctx.shadowBlur = 20; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(px(c.x), py(c.y), 12, 0, Math.PI * 2);
            ctx.fillStyle = "#1F2937"; ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
            ctx.shadowBlur = 0;
            // Cross
            ctx.beginPath(); ctx.moveTo(px(c.x) - 6, py(c.y)); ctx.lineTo(px(c.x) + 6, py(c.y));
            ctx.moveTo(px(c.x), py(c.y) - 6); ctx.lineTo(px(c.x), py(c.y) + 6);
            ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.fillStyle = col; ctx.font = "bold 8px Inter"; ctx.textAlign = "center";
            ctx.fillText(`C${i + 1}`, px(c.x), py(c.y) - 16);
        });

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points or use presets", W / 2, H / 2);
        }
    }, [points, centroids, assignments, CL]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const doStep = useCallback(() => {
        if (centroids.length === 0 || points.length === 0) return;
        const asgn = assignPoints(points, centroids);
        const newC = updateCentroids(points, asgn, k);
        const moved = newC.some((c, i) => Math.abs(c.x - centroids[i].x) > 0.001 || Math.abs(c.y - centroids[i].y) > 0.001);
        setAssignments(asgn);
        setCentroids(newC);
        setStep(s => s + 1);
        if (!moved) { setConverged(true); setRunning(false); }
    }, [centroids, points, k, assignPoints, updateCentroids]);

    useEffect(() => {
        if (!running || converged) return;
        const timer = setTimeout(doStep, 500);
        return () => clearTimeout(timer);
    }, [running, converged, doStep, step]);

    const initialize = () => {
        if (points.length < k) return;
        const cs = initCentroids(points, k);
        setCentroids(cs); setAssignments([]); setStep(0); setConverged(false); setRunning(false);
    };

    const addPreset = (type) => {
        const pts = [];
        if (type === "blobs") {
            const centers = [[-0.5, -0.5], [0.5, -0.4], [0, 0.5]];
            centers.forEach(([cx, cy]) => { for (let i = 0; i < 15; i++) pts.push({ x: cx + rand(-0.15, 0.15), y: cy + rand(-0.15, 0.15) }); });
        } else if (type === "random") {
            for (let i = 0; i < 50; i++) pts.push({ x: rand(-0.8, 0.8), y: rand(-0.8, 0.8) });
        } else if (type === "ring") {
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI * 2), r = rand(0, 0.2); pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
            for (let i = 0; i < 30; i++) { const a = rand(0, Math.PI * 2), r = rand(0.5, 0.7); pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
        }
        setPoints(pts); setCentroids([]); setAssignments([]); setStep(0); setConverged(false);
    };

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const wx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const wy = ((e.clientY - r.top) / r.height) * 2 - 1;
        setPoints(prev => [...prev, { x: wx, y: wy }]);
    };

    const wcss = () => {
        if (assignments.length === 0 || centroids.length === 0) return "—";
        let sum = 0;
        points.forEach((p, i) => { const c = centroids[assignments[i]]; if (c) sum += (p.x - c.x) ** 2 + (p.y - c.y) ** 2; });
        return sum.toFixed(4);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>K-MEANS CLUSTERING</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {converged && <span style={{ fontSize: 10, color: C.accent, fontFamily: "Inter, sans-serif" }}>✓ CONVERGED</span>}
                        <span style={{ ...S.val, fontSize: 11 }}>Step: {step}</span>
                    </div>
                </div>
                <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} onClick={handleClick} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>PARAMETERS</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                        <span style={S.label}>K (Clusters)</span><span style={S.val}>{k}</span>
                    </div>
                    <input type="range" style={S.range} min={2} max={7} step={1} value={k} onChange={e => { setK(+e.target.value); setCentroids([]); setAssignments([]); }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                        <button style={S.btn("primary")} onClick={initialize}>⊕ Initialize</button>
                        <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ ...S.btn(running ? "danger" : "primary"), flex: 1 }} onClick={() => setRunning(r => !r)} disabled={centroids.length === 0}>{running ? "⏸ Pause" : "▶ Run"}</button>
                            <button style={S.btn("secondary")} onClick={doStep} disabled={centroids.length === 0 || converged}>⏭</button>
                        </div>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>DATASETS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={S.btn("secondary")} onClick={() => addPreset("blobs")}>3 Blobs</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("random")}>Random</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("ring")}>Ring + Core</button>
                        <button style={S.btn("danger")} onClick={() => { setPoints([]); setCentroids([]); setAssignments([]); setStep(0); }}>↺ Clear</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>METRICS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["WCSS", wcss()], ["K", k], ["Points", points.length], ["Step", step]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>ALGORITHM</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>1.</strong> Initialize K random centroids<br />
                        <strong style={{ color: C.accent }}>2.</strong> Assign each point to nearest centroid<br />
                        <strong style={{ color: "#a855f7" }}>3.</strong> Recompute centroids as mean of cluster<br />
                        <strong style={{ color: "#ffc800" }}>4.</strong> Repeat until convergence<br />
                        <strong style={{ color: "#ff3264" }}>Objective:</strong> min Σ‖xᵢ − μₖ‖²
                    </div>
                </div>
            </div>
        </div>
    );
}
