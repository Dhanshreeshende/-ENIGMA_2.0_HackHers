import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

export default function DBSCANViz() {
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [eps, setEps] = useState(0.15);
    const [minPts, setMinPts] = useState(3);
    const [clusters, setClusters] = useState([]);
    const [labels, setLabels] = useState([]);
    const CL = ["#7C3AED", "#ff3264", "#ffc800", "#4cc9f0", "#a855f7", "#ff8c00", "#e879f9"];

    const runDBSCAN = useCallback((pts, e, mp) => {
        const n = pts.length;
        const lab = Array(n).fill(-1); // -1 = unvisited
        let clusterId = 0;

        const regionQuery = (idx) => {
            const neighbors = [];
            for (let i = 0; i < n; i++) {
                if (i === idx) continue;
                const d = Math.sqrt((pts[i].x - pts[idx].x) ** 2 + (pts[i].y - pts[idx].y) ** 2);
                if (d <= e) neighbors.push(i);
            }
            return neighbors;
        };

        for (let i = 0; i < n; i++) {
            if (lab[i] !== -1) continue;
            const neighbors = regionQuery(i);
            if (neighbors.length < mp) { lab[i] = -2; continue; } // noise
            lab[i] = clusterId;
            const seed = [...neighbors];
            for (let j = 0; j < seed.length; j++) {
                const q = seed[j];
                if (lab[q] === -2) lab[q] = clusterId;
                if (lab[q] !== -1) continue;
                lab[q] = clusterId;
                const qNeighbors = regionQuery(q);
                if (qNeighbors.length >= mp) {
                    for (const nn of qNeighbors) if (!seed.includes(nn)) seed.push(nn);
                }
            }
            clusterId++;
        }
        return { labels: lab, nClusters: clusterId };
    }, []);

    useEffect(() => {
        if (points.length < 2) { setLabels([]); setClusters([]); return; }
        const { labels: lab, nClusters } = runDBSCAN(points, eps, minPts);
        setLabels(lab);
        setClusters(Array.from({ length: nClusters }, (_, i) => i));
    }, [points, eps, minPts, runDBSCAN]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const px = v => (v + 1) / 2 * W;
        const py = v => (v + 1) / 2 * H;

        // Epsilon circles for each core point
        points.forEach((p, i) => {
            if (labels[i] >= 0) {
                ctx.beginPath(); ctx.arc(px(p.x), py(p.y), eps / 2 * W, 0, Math.PI * 2);
                const col = CL[labels[i] % CL.length];
                ctx.fillStyle = col + "06"; ctx.fill();
            }
        });

        // Points
        points.forEach((p, i) => {
            const x = px(p.x), y = py(p.y);
            const isNoise = labels[i] === -2;
            const col = isNoise ? "rgba(156,163,175,0.3)" : CL[labels[i] % CL.length];
            ctx.shadowBlur = isNoise ? 0 : 8; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(x, y, isNoise ? 4 : 6, 0, Math.PI * 2);
            ctx.fillStyle = isNoise ? col : col + "cc"; ctx.fill();
            if (isNoise) {
                ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 3, y + 3);
                ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 3, y + 3);
                ctx.strokeStyle = "rgba(255,50,100,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
            }
            ctx.shadowBlur = 0;
        });

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data or use presets", W / 2, H / 2);
        }
    }, [points, labels, eps, CL]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        setPoints(prev => [...prev, { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 }]);
    };

    const addPreset = (type) => {
        const pts = [];
        if (type === "blobs") {
            [[-0.5, -0.5], [0.4, 0.3], [-0.2, 0.5]].forEach(([cx, cy]) => {
                for (let i = 0; i < 12; i++) pts.push({ x: cx + rand(-0.12, 0.12), y: cy + rand(-0.12, 0.12) });
            });
            for (let i = 0; i < 5; i++) pts.push({ x: rand(-0.8, 0.8), y: rand(-0.8, 0.8) }); // noise
        } else if (type === "rings") {
            for (let i = 0; i < 20; i++) { const a = rand(0, Math.PI * 2); pts.push({ x: Math.cos(a) * 0.2, y: Math.sin(a) * 0.2 }); }
            for (let i = 0; i < 25; i++) { const a = rand(0, Math.PI * 2); pts.push({ x: Math.cos(a) * 0.55, y: Math.sin(a) * 0.55 }); }
            for (let i = 0; i < 4; i++) pts.push({ x: rand(-0.8, 0.8), y: rand(-0.8, 0.8) });
        } else if (type === "dense") {
            for (let i = 0; i < 15; i++) pts.push({ x: rand(-0.3, 0.0), y: rand(-0.3, 0.0) });
            for (let i = 0; i < 15; i++) pts.push({ x: rand(0.2, 0.5), y: rand(0.2, 0.5) });
            for (let i = 0; i < 8; i++) pts.push({ x: rand(-0.8, 0.8), y: rand(-0.8, 0.8) });
        }
        setPoints(pts);
    };

    const noiseCount = labels.filter(l => l === -2).length;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>DBSCAN CLUSTERING</span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
                        <span style={{ color: "#ff3264" }}>✕</span> = Noise
                    </span>
                </div>
                <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} onClick={handleClick} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>PARAMETERS</div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>ε (Epsilon / Radius)</span><span style={S.val}>{eps.toFixed(2)}</span>
                        </div>
                        <input type="range" style={S.range} min={0.05} max={0.5} step={0.01} value={eps} onChange={e => setEps(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>MinPts (Min Neighbors)</span><span style={S.val}>{minPts}</span>
                        </div>
                        <input type="range" style={S.range} min={1} max={10} step={1} value={minPts} onChange={e => setMinPts(+e.target.value)} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>DATASETS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={S.btn("primary")} onClick={() => addPreset("blobs")}>Blobs + Noise</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("rings")}>Concentric Rings</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("dense")}>Dense Regions</button>
                        <button style={S.btn("danger")} onClick={() => setPoints([])}>↺ Clear</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>RESULTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Clusters", clusters.length], ["Noise", noiseCount], ["Points", points.length], ["ε", eps.toFixed(2)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                    {clusters.length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {clusters.map(i => (
                            <span key={i} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 10, background: CL[i % CL.length] + "18", color: CL[i % CL.length], fontFamily: "Inter, sans-serif" }}>
                                C{i}: {labels.filter(l => l === i).length}pts
                            </span>
                        ))}
                    </div>}
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>ALGORITHM</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Core:</strong> ≥minPts neighbors within ε<br />
                        <strong style={{ color: "#a855f7" }}>Border:</strong> Within ε of core, &lt;minPts<br />
                        <strong style={{ color: "#ff3264" }}>Noise:</strong> Neither core nor border<br />
                        <strong style={{ color: "#ffc800" }}>Advantage:</strong> No need to specify K!
                    </div>
                </div>
            </div>
        </div>
    );
}
