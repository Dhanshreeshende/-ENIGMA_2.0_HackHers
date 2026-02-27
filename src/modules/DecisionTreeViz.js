import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

export default function DecisionTreeViz() {
    const canvasRef = useRef(null);
    const treeRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [maxDepth, setMaxDepth] = useState(3);
    const [minSamples, setMinSamples] = useState(2);
    const [tree, setTree] = useState(null);

    const gini = (labels) => {
        if (labels.length === 0) return 0;
        const counts = {};
        labels.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
        let g = 1;
        Object.values(counts).forEach(c => { g -= (c / labels.length) ** 2; });
        return g;
    };

    const buildTree = useCallback((pts, depth = 0) => {
        const labels = pts.map(p => p.cls);
        const uniqueLabels = [...new Set(labels)];
        if (uniqueLabels.length <= 1 || depth >= maxDepth || pts.length < minSamples) {
            const counts = [0, 0]; labels.forEach(l => counts[l]++);
            return { leaf: true, cls: counts[0] >= counts[1] ? 0 : 1, count: pts.length, gini: gini(labels), depth };
        }
        let bestGain = -1, bestFeat = "x", bestThresh = 0;
        for (const feat of ["x", "y"]) {
            const vals = pts.map(p => p[feat]).sort((a, b) => a - b);
            for (let i = 0; i < vals.length - 1; i++) {
                const thresh = (vals[i] + vals[i + 1]) / 2;
                const left = pts.filter(p => p[feat] <= thresh);
                const right = pts.filter(p => p[feat] > thresh);
                if (left.length === 0 || right.length === 0) continue;
                const parentGini = gini(labels);
                const wGini = (left.length * gini(left.map(p => p.cls)) + right.length * gini(right.map(p => p.cls))) / pts.length;
                const gain = parentGini - wGini;
                if (gain > bestGain) { bestGain = gain; bestFeat = feat; bestThresh = thresh; }
            }
        }
        if (bestGain <= 0) {
            const counts = [0, 0]; labels.forEach(l => counts[l]++);
            return { leaf: true, cls: counts[0] >= counts[1] ? 0 : 1, count: pts.length, gini: gini(labels), depth };
        }
        const left = pts.filter(p => p[bestFeat] <= bestThresh);
        const right = pts.filter(p => p[bestFeat] > bestThresh);
        return {
            leaf: false, feat: bestFeat, thresh: bestThresh, gain: bestGain, gini: gini(labels),
            left: buildTree(left, depth + 1), right: buildTree(right, depth + 1),
            count: pts.length, depth,
        };
    }, [maxDepth, minSamples]);

    const predictTree = useCallback((node, x, y) => {
        if (!node) return 0;
        if (node.leaf) return node.cls;
        const val = node.feat === "x" ? x : y;
        return val <= node.thresh ? predictTree(node.left, x, y) : predictTree(node.right, x, y);
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Decision regions
        if (tree) {
            const res = 4;
            for (let px = 0; px < W; px += res) {
                for (let py = 0; py < H; py += res) {
                    const wx = (px / W) * 2 - 1, wy = (py / H) * 2 - 1;
                    const cls = predictTree(tree, wx, wy);
                    ctx.fillStyle = cls === 0 ? "rgba(124,58,237,0.08)" : "rgba(255,50,100,0.08)";
                    ctx.fillRect(px, py, res, res);
                }
            }
            // Split lines
            const drawSplits = (node, xmin, xmax, ymin, ymax) => {
                if (!node || node.leaf) return;
                const W2 = canvas.width, H2 = canvas.height;
                const toX = v => ((v + 1) / 2) * W2;
                const toY = v => ((v + 1) / 2) * H2;
                if (node.feat === "x") {
                    ctx.beginPath(); ctx.moveTo(toX(node.thresh), toY(ymin)); ctx.lineTo(toX(node.thresh), toY(ymax));
                    ctx.strokeStyle = "rgba(168,85,247,0.6)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);
                    drawSplits(node.left, xmin, node.thresh, ymin, ymax);
                    drawSplits(node.right, node.thresh, xmax, ymin, ymax);
                } else {
                    ctx.beginPath(); ctx.moveTo(toX(xmin), toY(node.thresh)); ctx.lineTo(toX(xmax), toY(node.thresh));
                    ctx.strokeStyle = "rgba(255,200,0,0.6)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);
                    drawSplits(node.left, xmin, xmax, ymin, node.thresh);
                    drawSplits(node.right, xmin, xmax, node.thresh, ymax);
                }
            };
            drawSplits(tree, -1, 1, -1, 1);
        }

        // Points
        for (const p of points) {
            const px = (p.x + 1) / 2 * W, py = (p.y + 1) / 2 * H;
            const col = p.cls === 0 ? "#7C3AED" : "#ff3264";
            ctx.shadowBlur = 6; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = col + "cc"; ctx.fill(); ctx.shadowBlur = 0;
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data or use presets", W / 2, H / 2);
        }

        // Draw tree structure
        const tc = treeRef.current; if (!tc || !tree) return;
        const tctx = tc.getContext("2d");
        const TW = tc.width, TH = tc.height;
        tctx.clearRect(0, 0, TW, TH);

        const drawNode = (node, x, y, w, d) => {
            if (!node) return;
            const col = node.leaf ? (node.cls === 0 ? "#7C3AED" : "#ff3264") : "#a855f7";
            // Node box
            tctx.fillStyle = C.surfaceDeep; tctx.strokeStyle = col + "80";
            tctx.lineWidth = 1.5; tctx.beginPath();
            tctx.roundRect(x - 32, y - 14, 64, 28, 6); tctx.fill(); tctx.stroke();
            tctx.fillStyle = col; tctx.font = "bold 8px Inter"; tctx.textAlign = "center";
            if (node.leaf) { tctx.fillText(node.cls === 0 ? "Class A" : "Class B", x, y + 3); }
            else { tctx.fillText(`${node.feat}≤${node.thresh.toFixed(2)}`, x, y + 3); }

            if (!node.leaf) {
                const nw = w / 2, ny = y + 50;
                const lx = x - nw, rx = x + nw;
                tctx.beginPath(); tctx.moveTo(x, y + 14); tctx.lineTo(lx, ny - 14);
                tctx.strokeStyle = "#7C3AED40"; tctx.lineWidth = 1; tctx.stroke();
                tctx.beginPath(); tctx.moveTo(x, y + 14); tctx.lineTo(rx, ny - 14);
                tctx.strokeStyle = "#ff326440"; tctx.lineWidth = 1; tctx.stroke();
                tctx.fillStyle = "rgba(156,163,175,0.25)"; tctx.font = "7px Inter";
                tctx.fillText("≤", (x + lx) / 2 - 4, (y + ny) / 2);
                tctx.fillText(">", (x + rx) / 2 + 4, (y + ny) / 2);
                drawNode(node.left, lx, ny, nw, d + 1);
                drawNode(node.right, rx, ny, nw, d + 1);
            }
        };
        drawNode(tree, TW / 2, 20, TW / 4, 0);
    }, [points, tree, predictTree]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        const tc = treeRef.current; if (tc) { tc.width = tc.offsetWidth; tc.height = tc.offsetHeight; }
        draw();
    }, []);

    useEffect(() => {
        if (points.length >= 2) setTree(buildTree(points));
        else setTree(null);
    }, [points, buildTree]);

    useEffect(() => { draw(); }, [draw]);

    const [mode, setMode] = useState(0);
    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        setPoints(prev => [...prev, { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, cls: mode }]);
    };

    const addPreset = (type) => {
        const pts = [];
        if (type === "quad") {
            for (let i = 0; i < 15; i++) pts.push({ x: rand(-0.8, -0.1), y: rand(-0.8, -0.1), cls: 0 });
            for (let i = 0; i < 15; i++) pts.push({ x: rand(0.1, 0.8), y: rand(0.1, 0.8), cls: 0 });
            for (let i = 0; i < 15; i++) pts.push({ x: rand(-0.8, -0.1), y: rand(0.1, 0.8), cls: 1 });
            for (let i = 0; i < 15; i++) pts.push({ x: rand(0.1, 0.8), y: rand(-0.8, -0.1), cls: 1 });
        } else if (type === "simple") {
            for (let i = 0; i < 20; i++) pts.push({ x: rand(-0.8, 0), y: rand(-0.6, 0.6), cls: 0 });
            for (let i = 0; i < 20; i++) pts.push({ x: rand(0.1, 0.8), y: rand(-0.6, 0.6), cls: 1 });
        }
        setPoints(pts);
    };

    const countNodes = (node) => { if (!node) return 0; if (node.leaf) return 1; return 1 + countNodes(node.left) + countNodes(node.right); };
    const countLeaves = (node) => { if (!node) return 0; if (node.leaf) return 1; return countLeaves(node.left) + countLeaves(node.right); };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>DECISION REGIONS</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {[["● Class A", 0, "#7C3AED"], ["● Class B", 1, "#ff3264"]].map(([l, m, col]) => (
                            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px", borderRadius: 7, border: `2px solid ${mode === m ? col : "transparent"}`, background: mode === m ? col + "18" : "transparent", color: col, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700 }}>{l}</button>
                        ))}
                    </div>
                    <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: 300, display: "block" }} onClick={handleClick} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>TREE STRUCTURE</div>
                    <canvas ref={treeRef} style={{ width: "100%", height: 200, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>HYPERPARAMETERS</div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span style={S.label}>Max Depth</span><span style={S.val}>{maxDepth}</span></div>
                        <input type="range" style={S.range} min={1} max={8} step={1} value={maxDepth} onChange={e => setMaxDepth(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span style={S.label}>Min Samples Split</span><span style={S.val}>{minSamples}</span></div>
                        <input type="range" style={S.range} min={2} max={10} step={1} value={minSamples} onChange={e => setMinSamples(+e.target.value)} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={S.btn("primary")} onClick={() => addPreset("simple")}>Simple Split</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("quad")}>XOR Pattern</button>
                        <button style={S.btn("danger")} onClick={() => setPoints([])}>↺ Clear</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>TREE STATS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Nodes", tree ? countNodes(tree) : 0], ["Leaves", tree ? countLeaves(tree) : 0], ["Depth", maxDepth], ["Points", points.length]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>THEORY</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Split Criterion:</strong> Gini Impurity<br />
                        <strong style={{ color: "#a855f7" }}>Gini:</strong> 1 − Σpₖ²<br />
                        <strong style={{ color: "#ffc800" }}>Info Gain:</strong> Gini(parent) − Σ weighted Gini(child)<br />
                        <strong style={{ color: "#ff3264" }}>Pruning:</strong> max_depth, min_samples
                    </div>
                </div>
            </div>
        </div>
    );
}
