import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function GradientBoostingViz() {
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [nTrees, setNTrees] = useState(1);
    const [maxTrees, setMaxTrees] = useState(10);
    const [learningRate, setLearningRate] = useState(0.3);
    const [running, setRunning] = useState(false);

    // Simple decision stump
    const fitStump = (pts, residuals) => {
        if (pts.length < 2) return { feat: "x", thresh: 0, leftVal: 0, rightVal: 0 };
        let bestErr = Infinity, bestFeat = "x", bestThresh = 0, bestLV = 0, bestRV = 0;
        for (const feat of ["x"]) {
            const vals = pts.map(p => p[feat]).sort((a, b) => a - b);
            for (let i = 0; i < vals.length - 1; i++) {
                const thresh = (vals[i] + vals[i + 1]) / 2;
                const left = [], right = [];
                pts.forEach((p, j) => { (p[feat] <= thresh ? left : right).push(residuals[j]); });
                if (left.length === 0 || right.length === 0) continue;
                const lv = left.reduce((s, v) => s + v, 0) / left.length;
                const rv = right.reduce((s, v) => s + v, 0) / right.length;
                let err = 0;
                left.forEach(v => err += (v - lv) ** 2);
                right.forEach(v => err += (v - rv) ** 2);
                if (err < bestErr) { bestErr = err; bestFeat = feat; bestThresh = thresh; bestLV = lv; bestRV = rv; }
            }
        }
        return { feat: bestFeat, thresh: bestThresh, leftVal: bestLV, rightVal: bestRV };
    };

    const predictStump = (stump, x) => x <= stump.thresh ? stump.leftVal : stump.rightVal;

    const buildEnsemble = useCallback((pts, n, lr) => {
        if (pts.length < 2) return [];
        const trees = [];
        const predictions = Array(pts.length).fill(0);
        const initialMean = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        predictions.fill(initialMean);

        for (let t = 0; t < n; t++) {
            const residuals = pts.map((p, i) => p.y - predictions[i]);
            const stump = fitStump(pts, residuals);
            trees.push(stump);
            pts.forEach((p, i) => { predictions[i] += lr * predictStump(stump, p.x); });
        }
        return trees;
    }, []);

    const predictEnsemble = useCallback((trees, x, lr, pts) => {
        if (pts.length < 2 || trees.length === 0) return 0;
        const initialMean = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        let pred = initialMean;
        for (const tree of trees) pred += lr * predictStump(tree, x);
        return pred;
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const toX = v => 30 + v * (W - 60);
        const toY = v => H - 30 - v * (H - 60);

        ctx.strokeStyle = "rgba(156,163,175,0.1)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(30, H - 30); ctx.lineTo(W - 30, H - 30); ctx.stroke();

        if (points.length >= 2) {
            const trees = buildEnsemble(points, nTrees, learningRate);

            // Draw predictions for each stage
            for (let stage = 1; stage <= nTrees; stage++) {
                const stageTrees = trees.slice(0, stage);
                ctx.beginPath();
                for (let px = 0; px < W; px++) {
                    const x = (px - 30) / (W - 60);
                    const y = predictEnsemble(stageTrees, x, learningRate, points);
                    const py = toY(Math.max(-0.2, Math.min(1.2, y)));
                    px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                const alpha = stage === nTrees ? 1 : 0.15;
                ctx.strokeStyle = stage === nTrees ? C.accent : `rgba(124,58,237,${alpha})`;
                ctx.lineWidth = stage === nTrees ? 2.5 : 1;
                if (stage === nTrees) { ctx.shadowBlur = 8; ctx.shadowColor = C.accent; }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Single tree prediction (stage 1)
            if (nTrees > 1) {
                ctx.beginPath();
                const singleTree = trees.slice(0, 1);
                for (let px = 0; px < W; px++) {
                    const x = (px - 30) / (W - 60);
                    const y = predictEnsemble(singleTree, x, learningRate, points);
                    const py = toY(Math.max(-0.2, Math.min(1.2, y)));
                    px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.strokeStyle = "rgba(255,50,100,0.3)"; ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            }
        }

        // Points
        points.forEach(p => {
            ctx.shadowBlur = 6; ctx.shadowColor = "#4cc9f0";
            ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 5, 0, Math.PI * 2);
            ctx.fillStyle = "#4cc9f0cc"; ctx.fill(); ctx.shadowBlur = 0;
        });

        // Legend
        ctx.fillStyle = C.accent; ctx.fillRect(W - 200, 12, 12, 3);
        ctx.font = "bold 9px Inter"; ctx.textAlign = "left";
        ctx.fillText(`Ensemble (${nTrees} trees)`, W - 184, 16);
        if (nTrees > 1) {
            ctx.fillStyle = "#ff3264"; ctx.fillRect(W - 200, 28, 12, 3);
            ctx.setLineDash([3, 3]);
            ctx.fillText("Single stump", W - 184, 32);
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
        }
    }, [points, nTrees, learningRate, buildEnsemble, predictEnsemble]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            setNTrees(n => { if (n >= maxTrees) { setRunning(false); return n; } return n + 1; });
        }, 400);
        return () => clearInterval(timer);
    }, [running, maxTrees]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - r.left - 30) / (r.width - 60);
        const y = 1 - (e.clientY - r.top - 30) / (r.height - 60);
        if (x >= 0 && x <= 1 && y >= -0.2 && y <= 1.2) setPoints(prev => [...prev, { x, y }]);
    };

    const addPreset = () => {
        const pts = [];
        for (let i = 0; i < 20; i++) {
            const x = rand(0.05, 0.95);
            pts.push({ x, y: 0.2 + 0.3 * Math.sin(x * Math.PI * 3) + 0.2 * x + rand(-0.05, 0.05) });
        }
        setPoints(pts);
    };

    // MSE
    const mse = points.length >= 2 ? (() => {
        const trees = buildEnsemble(points, nTrees, learningRate);
        let err = 0;
        points.forEach(p => { const pred = predictEnsemble(trees, p.x, learningRate, points); err += (p.y - pred) ** 2; });
        return err / points.length;
    })() : 0;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>GRADIENT BOOSTING</span>
                    <span style={{ ...S.val, fontSize: 11 }}>Trees: {nTrees}/{maxTrees}</span>
                </div>
                <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 400, display: "block" }} onClick={handleClick} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>BOOSTING PARAMS</div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Number of Trees</span><span style={S.val}>{nTrees}</span>
                        </div>
                        <input type="range" style={S.range} min={1} max={maxTrees} step={1} value={nTrees} onChange={e => setNTrees(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Max Trees</span><span style={S.val}>{maxTrees}</span>
                        </div>
                        <input type="range" style={S.range} min={5} max={50} step={5} value={maxTrees} onChange={e => setMaxTrees(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Learning Rate</span><span style={S.val}>{learningRate.toFixed(2)}</span>
                        </div>
                        <input type="range" style={S.range} min={0.01} max={1} step={0.01} value={learningRate} onChange={e => setLearningRate(+e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...S.btn(running ? "danger" : "primary"), flex: 1 }} onClick={() => { setNTrees(1); setRunning(r => !r); }}>{running ? "⏸ Stop" : "▶ Animate"}</button>
                        <button style={S.btn("secondary")} onClick={addPreset}>Data</button>
                        <button style={S.btn("danger")} onClick={() => { setPoints([]); setNTrees(1); }}>↺</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>METRICS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["MSE", fmt(mse, 5)], ["Trees", nTrees], ["LR", learningRate.toFixed(2)], ["Points", points.length]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>HOW IT WORKS</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>1.</strong> Start with mean prediction<br />
                        <strong style={{ color: "#a855f7" }}>2.</strong> Compute residuals (errors)<br />
                        <strong style={{ color: "#ffc800" }}>3.</strong> Fit weak learner to residuals<br />
                        <strong style={{ color: "#ff3264" }}>4.</strong> F(x) += η·h(x), repeat<br />
                        <strong style={{ color: "#4cc9f0" }}>Key:</strong> Each tree corrects previous errors
                    </div>
                </div>
            </div>
        </div>
    );
}
