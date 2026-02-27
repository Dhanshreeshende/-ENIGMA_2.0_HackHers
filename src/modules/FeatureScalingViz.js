import { useState, useRef, useEffect, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function FeatureScalingViz() {
    const beforeRef = useRef(null);
    const afterRef = useRef(null);
    const [data, setData] = useState([]);
    const [method, setMethod] = useState("standard");

    const generateData = useCallback(() => {
        const d = [];
        for (let i = 0; i < 40; i++) {
            d.push({
                x: rand(10, 1000),  // large range
                y: rand(0.1, 5),    // small range
                cls: Math.random() > 0.5 ? 0 : 1,
            });
        }
        return d;
    }, []);

    useEffect(() => { setData(generateData()); }, [generateData]);

    const scale = useCallback((d, m) => {
        if (d.length === 0) return d;
        const xVals = d.map(p => p.x), yVals = d.map(p => p.y);
        const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
        const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
        const xMean = xVals.reduce((s, v) => s + v, 0) / d.length;
        const yMean = yVals.reduce((s, v) => s + v, 0) / d.length;
        const xStd = Math.sqrt(xVals.reduce((s, v) => s + (v - xMean) ** 2, 0) / d.length) || 1;
        const yStd = Math.sqrt(yVals.reduce((s, v) => s + (v - yMean) ** 2, 0) / d.length) || 1;

        return d.map(p => {
            let sx, sy;
            if (m === "standard") { sx = (p.x - xMean) / xStd; sy = (p.y - yMean) / yStd; }
            else if (m === "minmax") { sx = (p.x - xMin) / (xMax - xMin || 1); sy = (p.y - yMin) / (yMax - yMin || 1); }
            else if (m === "robust") {
                const xSorted = [...xVals].sort((a, b) => a - b), ySorted = [...yVals].sort((a, b) => a - b);
                const xQ1 = xSorted[Math.floor(d.length * 0.25)], xQ3 = xSorted[Math.floor(d.length * 0.75)];
                const yQ1 = ySorted[Math.floor(d.length * 0.25)], yQ3 = ySorted[Math.floor(d.length * 0.75)];
                const xMedian = xSorted[Math.floor(d.length * 0.5)], yMedian = ySorted[Math.floor(d.length * 0.5)];
                sx = (p.x - xMedian) / (xQ3 - xQ1 || 1); sy = (p.y - yMedian) / (yQ3 - yQ1 || 1);
            }
            else { sx = p.x; sy = p.y; }
            return { ...p, sx, sy };
        });
    }, []);

    const drawCanvas = useCallback((canvas, pts, useScaled, label) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        if (pts.length === 0) return;
        const xVals = pts.map(p => useScaled ? p.sx : p.x);
        const yVals = pts.map(p => useScaled ? p.sy : p.y);
        const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
        const yMin = Math.min(...yVals), yMax = Math.max(...yVals);
        const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
        const pad = 35;

        // Axes
        ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

        ctx.fillStyle = "rgba(156,163,175,0.3)"; ctx.font = "8px Inter"; ctx.textAlign = "center";
        ctx.fillText(fmt(xMin, 1), pad, H - pad + 14);
        ctx.fillText(fmt(xMax, 1), W - pad, H - pad + 14);
        ctx.textAlign = "right";
        ctx.fillText(fmt(yMin, 1), pad - 4, H - pad);
        ctx.fillText(fmt(yMax, 1), pad - 4, pad + 4);

        // Title
        ctx.fillStyle = useScaled ? C.accent : "#ff3264"; ctx.font = "bold 11px Inter"; ctx.textAlign = "center";
        ctx.fillText(label, W / 2, 16);

        // Points
        pts.forEach(p => {
            const x = pad + ((useScaled ? p.sx : p.x) - xMin) / xRange * (W - pad * 2);
            const y = H - pad - ((useScaled ? p.sy : p.y) - yMin) / yRange * (H - pad * 2);
            const col = p.cls === 0 ? "#7C3AED" : "#ff3264";
            ctx.shadowBlur = 6; ctx.shadowColor = col;
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = col + "cc"; ctx.fill(); ctx.shadowBlur = 0;
        });

        // Distribution indicator - x spread vs y spread
        const xSpread = xRange, ySpread = yRange;
        const ratio = xSpread / ySpread;
        ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "9px Inter"; ctx.textAlign = "right";
        ctx.fillText(`X range: ${fmt(xSpread, 1)}`, W - 8, H - 8);
        ctx.fillText(`Y range: ${fmt(ySpread, 2)}`, W - 8, H - 20);
        ctx.fillText(`Ratio: ${fmt(ratio, 1)}x`, W - 8, H - 32);
    }, []);

    useEffect(() => {
        [beforeRef, afterRef].forEach(r => { const c = r.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; } });
    }, []);

    useEffect(() => {
        const scaled = scale(data, method);
        drawCanvas(beforeRef.current, data, false, "BEFORE SCALING");
        drawCanvas(afterRef.current, scaled, true, `AFTER ${method.toUpperCase()}`);
    }, [data, method, scale, drawCanvas]);

    const xVals = data.map(p => p.x), yVals = data.map(p => p.y);
    const xRange = data.length > 0 ? Math.max(...xVals) - Math.min(...xVals) : 0;
    const yRange = data.length > 0 ? Math.max(...yVals) - Math.min(...yVals) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={S.card}>
                    <div style={S.canvasWrap}>
                        <canvas ref={beforeRef} style={{ width: "100%", height: 320, display: "block" }} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.canvasWrap}>
                        <canvas ref={afterRef} style={{ width: "100%", height: 320, display: "block" }} />
                    </div>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>SCALER METHOD</div>
                    <select style={{ ...S.select, marginBottom: 10 }} value={method} onChange={e => setMethod(e.target.value)}>
                        <option value="standard">StandardScaler (z-score)</option>
                        <option value="minmax">MinMaxScaler [0,1]</option>
                        <option value="robust">RobustScaler (IQR)</option>
                    </select>
                    <button style={{ ...S.btn("primary"), width: "100%", marginBottom: 6 }} onClick={() => setData(generateData())}>↺ Regenerate Data</button>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        {[["X Range", fmt(xRange, 1)], ["Y Range", fmt(yRange, 2)], ["Ratio", fmt(xRange / (yRange || 1), 1) + "x"], ["Samples", data.length]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>WHY SCALE?</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Problem:</strong> Features with different scales dominate distance calculations<br />
                        <strong style={{ color: "#a855f7" }}>KNN/SVM:</strong> Distance-based → must scale!<br />
                        <strong style={{ color: "#ffc800" }}>Gradient:</strong> Faster convergence with balanced features<br />
                        <strong style={{ color: "#ff3264" }}>Trees:</strong> Scale-invariant → no need!
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>FORMULAS</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 2 }}>
                        <strong style={{ color: C.accent }}>Standard:</strong> z = (x − μ) / σ<br />
                        <strong style={{ color: "#a855f7" }}>MinMax:</strong> x' = (x − min) / (max − min)<br />
                        <strong style={{ color: "#ffc800" }}>Robust:</strong> x' = (x − median) / IQR<br />
                        <em style={{ color: C.textMuted }}>IQR = Q₃ − Q₁ (interquartile range)</em>
                    </div>
                </div>
            </div>
        </div>
    );
}
