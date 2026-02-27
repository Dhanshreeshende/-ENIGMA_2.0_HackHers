import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function LinearRegression() {
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [showResiduals, setShowResiduals] = useState(true);
    const [showEquation, setShowEquation] = useState(true);
    const [animating, setAnimating] = useState(false);
    const animRef = useRef({ m: 0, b: 0, targetM: 0, targetB: 0 });

    const fitLine = useCallback((pts) => {
        if (pts.length < 2) return { m: 0, b: 0.5, r2: 0, mse: 0 };
        const n = pts.length;
        let sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (const p of pts) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
        const denom = n * sxx - sx * sx;
        if (Math.abs(denom) < 1e-10) return { m: 0, b: sy / n, r2: 0, mse: 0 };
        const m = (n * sxy - sx * sy) / denom;
        const b = (sy - m * sx) / n;
        const yMean = sy / n;
        let ssTot = 0, ssRes = 0;
        for (const p of pts) { ssTot += (p.y - yMean) ** 2; ssRes += (p.y - (m * p.x + b)) ** 2; }
        const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
        const mse = ssRes / n;
        return { m, b, r2, mse };
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Axes
        ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(40, H - 40); ctx.lineTo(W - 20, H - 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, H - 40); ctx.stroke();
        ctx.fillStyle = "rgba(156,163,175,0.3)"; ctx.font = "9px Inter";
        ctx.textAlign = "center"; ctx.fillText("Feature (x)", W / 2, H - 8);
        ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText("Target (y)", 0, 0); ctx.restore();

        const px = (x) => 40 + x * (W - 60);
        const py = (y) => H - 40 - y * (H - 60);

        // Regression line
        if (points.length >= 2) {
            const a = animRef.current;
            const y0 = a.m * 0 + a.b, y1 = a.m * 1 + a.b;
            // Confidence band
            const bandW = 0.08;
            ctx.fillStyle = "rgba(124,58,237,0.06)";
            ctx.beginPath();
            ctx.moveTo(px(0), py(y0 + bandW)); ctx.lineTo(px(1), py(y1 + bandW));
            ctx.lineTo(px(1), py(y1 - bandW)); ctx.lineTo(px(0), py(y0 - bandW));
            ctx.closePath(); ctx.fill();

            // Line
            ctx.beginPath(); ctx.moveTo(px(0), py(y0)); ctx.lineTo(px(1), py(y1));
            ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10; ctx.shadowColor = C.accent; ctx.stroke(); ctx.shadowBlur = 0;

            // Residuals
            if (showResiduals) {
                for (const p of points) {
                    const predicted = a.m * p.x + a.b;
                    ctx.beginPath(); ctx.moveTo(px(p.x), py(p.y)); ctx.lineTo(px(p.x), py(predicted));
                    ctx.strokeStyle = "rgba(255,50,100,0.5)"; ctx.lineWidth = 1.5;
                    ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
                    // Residual square
                    const resH = Math.abs(py(p.y) - py(predicted));
                    const resW = resH;
                    ctx.fillStyle = "rgba(255,50,100,0.06)";
                    ctx.fillRect(px(p.x), Math.min(py(p.y), py(predicted)), resW, resH);
                }
            }

            // Equation
            if (showEquation) {
                const eq = `y = ${fmt(a.m, 3)}x + ${fmt(a.b, 3)}`;
                ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(W - 200, 10, 190, 28);
                ctx.strokeStyle = C.accent + "40"; ctx.strokeRect(W - 200, 10, 190, 28);
                ctx.fillStyle = C.accent; ctx.font = "bold 12px Inter"; ctx.textAlign = "right";
                ctx.fillText(eq, W - 18, 29);
            }
        }

        // Points
        for (const p of points) {
            const x = px(p.x), y = py(p.y);
            ctx.shadowBlur = 8; ctx.shadowColor = "#4cc9f0";
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#4cc9f0cc"; ctx.fill();
            ctx.strokeStyle = "#4cc9f0"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
        }
    }, [points, showResiduals, showEquation]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => {
        if (points.length >= 2) {
            const { m, b } = fitLine(points);
            animRef.current.targetM = m; animRef.current.targetB = b;
            setAnimating(true);
        }
        draw();
    }, [points, draw, fitLine]);

    useEffect(() => {
        if (!animating) return;
        let raf;
        const animate = () => {
            const a = animRef.current;
            a.m += (a.targetM - a.m) * 0.12;
            a.b += (a.targetB - a.b) * 0.12;
            if (Math.abs(a.m - a.targetM) < 0.0001 && Math.abs(a.b - a.targetB) < 0.0001) {
                a.m = a.targetM; a.b = a.targetB; setAnimating(false);
            }
            draw();
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [animating, draw]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const cx = e.clientX - r.left, cy = e.clientY - r.top;
        const W = canvasRef.current.width, H = canvasRef.current.height;
        const x = (cx - 40) / (W - 60), y = 1 - (cy - 20) / (H - 60);
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) setPoints(prev => [...prev, { x, y }]);
    };

    const addRandom = (pattern) => {
        const pts = [];
        if (pattern === "linear") {
            for (let i = 0; i < 25; i++) { const x = rand(0.05, 0.95); pts.push({ x, y: 0.2 + 0.6 * x + rand(-0.08, 0.08) }); }
        } else if (pattern === "noisy") {
            for (let i = 0; i < 30; i++) { const x = rand(0.05, 0.95); pts.push({ x, y: 0.3 + 0.4 * x + rand(-0.2, 0.2) }); }
        } else if (pattern === "nonlinear") {
            for (let i = 0; i < 30; i++) { const x = rand(0.05, 0.95); pts.push({ x, y: 0.1 + 0.8 * Math.sin(x * Math.PI) + rand(-0.06, 0.06) }); }
        }
        setPoints(pts);
    };

    const stats = fitLine(points);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={S.cardTitle}>REGRESSION CANVAS</span>
                        <span style={{ ...S.val, fontSize: 11 }}>Points: {points.length}</span>
                    </div>
                    <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: 380, display: "block" }} onClick={handleClick} />
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>CONTROLS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        <button style={{ ...S.btn("primary") }} onClick={() => addRandom("linear")}>📈 Linear Data</button>
                        <button style={{ ...S.btn("secondary") }} onClick={() => addRandom("noisy")}>📊 Noisy Linear</button>
                        <button style={{ ...S.btn("secondary") }} onClick={() => addRandom("nonlinear")}>🌊 Non-Linear</button>
                        <button style={S.btn("danger")} onClick={() => setPoints([])}>↺ Clear</button>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                        <input type="checkbox" checked={showResiduals} onChange={e => setShowResiduals(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Residuals</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={showEquation} onChange={e => setShowEquation(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Equation</span>
                    </label>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>METRICS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["R²", fmt(stats.r2, 4)], ["MSE", fmt(stats.mse, 4)], ["Slope (m)", fmt(stats.m, 4)], ["Intercept (b)", fmt(stats.b, 4)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>THEORY</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Objective:</strong> Minimize Σ(yᵢ - ŷᵢ)²<br />
                        <strong style={{ color: C.accent }}>Normal Equation:</strong> θ = (XᵀX)⁻¹Xᵀy<br />
                        <strong style={{ color: "#a855f7" }}>R² Score:</strong> 1 - SS_res/SS_tot<br />
                        <strong style={{ color: "#ffc800" }}>Residual:</strong> eᵢ = yᵢ − (mx + b)
                    </div>
                </div>
            </div>
        </div>
    );
}
