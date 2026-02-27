import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function LossFunctions() {
    const canvasRef = useRef(null);
    const [selected, setSelected] = useState(["mse", "mae", "huber"]);
    const [trueVal, setTrueVal] = useState(0);
    const [xRange, setXRange] = useState(3);
    const [showComparison, setShowComparison] = useState(true);
    const [delta, setDelta] = useState(1.0);

    const losses = {
        mse: { name: "MSE", color: "#7C3AED", fn: (y, t) => (y - t) ** 2, formula: "(y − ŷ)²", desc: "Mean Squared Error. Penalizes large errors heavily. Standard for regression.", grad: (y, t) => 2 * (y - t) },
        mae: { name: "MAE", color: "#ff3264", fn: (y, t) => Math.abs(y - t), formula: "|y − ŷ|", desc: "Mean Absolute Error. Robust to outliers. Non-differentiable at 0.", grad: (y, t) => y > t ? 1 : -1 },
        huber: { name: "Huber", color: "#a855f7", fn: (y, t, d = 1) => Math.abs(y - t) <= d ? 0.5 * (y - t) ** 2 : d * (Math.abs(y - t) - 0.5 * d), formula: "δ²(√(1+((y-ŷ)/δ)²)-1)", desc: "Combines MSE for small errors, MAE for large. Best of both worlds." },
        logcosh: { name: "Log-Cosh", color: "#ffc800", fn: (y, t) => Math.log(Math.cosh(y - t)), formula: "log(cosh(y−ŷ))", desc: "Smooth approximation of MAE. Twice differentiable everywhere." },
        bce: { name: "Binary CE", color: "#4cc9f0", fn: (y, t) => { const p = 1 / (1 + Math.exp(-y)); return -(t * Math.log(p + 1e-8) + (1 - t) * Math.log(1 - p + 1e-8)); }, formula: "−[y·log(ŷ)+(1−y)·log(1−ŷ)]", desc: "Binary Cross-Entropy. Standard for classification. Uses log probability." },
        hinge: { name: "Hinge", color: "#ff8c00", fn: (y, t) => Math.max(0, 1 - (2 * t - 1) * y), formula: "max(0, 1−y·ŷ)", desc: "Used in SVMs. Margin-based loss. Piecewise linear." },
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const cx = W / 2, bottom = H - 40;
        ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, bottom); ctx.lineTo(W, bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, bottom); ctx.stroke();

        // True value marker
        const tvX = cx + (trueVal / xRange) * (W / 2 - 20);
        ctx.beginPath(); ctx.moveTo(tvX, 10); ctx.lineTo(tvX, bottom);
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "9px Inter"; ctx.textAlign = "center";
        ctx.fillText(`true=${trueVal.toFixed(1)}`, tvX, bottom + 14);

        // X axis labels
        ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "9px Inter";
        for (let i = -xRange; i <= xRange; i++) {
            const x = cx + (i / xRange) * (W / 2 - 20);
            ctx.fillText(i, x, bottom + 28);
        }

        const yScale = (bottom - 20) / (xRange * 2);

        // Draw loss functions
        selected.forEach(key => {
            const l = losses[key]; if (!l) return;
            ctx.beginPath();
            for (let px = 0; px < W; px++) {
                const pred = ((px - cx) / (W / 2 - 20)) * xRange;
                let lossVal = l.fn(pred, trueVal, delta);
                lossVal = Math.min(lossVal, xRange * 2);
                const py = bottom - lossVal * yScale;
                px === 0 ? ctx.moveTo(px, Math.max(5, py)) : ctx.lineTo(px, Math.max(5, py));
            }
            ctx.strokeStyle = l.color; ctx.lineWidth = 2.5; ctx.shadowBlur = 6; ctx.shadowColor = l.color;
            ctx.stroke(); ctx.shadowBlur = 0;
        });

        // Legend
        ctx.textAlign = "left";
        selected.forEach((key, i) => {
            const l = losses[key]; if (!l) return;
            ctx.fillStyle = l.color; ctx.fillRect(10, 16 + i * 18, 12, 3);
            ctx.font = "bold 10px Inter"; ctx.fillText(l.name, 28, 20 + i * 18);
        });

        ctx.textAlign = "center"; ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "10px Inter";
        ctx.fillText("Prediction (ŷ)", W / 2, H - 4);
        ctx.save(); ctx.translate(12, (bottom - 20) / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText("Loss", 0, 0); ctx.restore();
    }, [selected, trueVal, xRange, delta, losses]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const toggle = (key) => {
        setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>LOSS LANDSCAPE</span>
                </div>
                <div style={S.canvasWrap}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={S.label}>True Value (y)</span><span style={S.val}>{trueVal.toFixed(1)}</span>
                        </div>
                        <input type="range" style={S.range} min={-2} max={2} step={0.1} value={trueVal} onChange={e => setTrueVal(+e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={S.label}>Huber δ</span><span style={S.val}>{delta.toFixed(1)}</span>
                        </div>
                        <input type="range" style={S.range} min={0.1} max={3} step={0.1} value={delta} onChange={e => setDelta(+e.target.value)} />
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 550, overflowY: "auto" }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>SELECT LOSSES</div>
                    {Object.entries(losses).map(([key, l]) => (
                        <div key={key} onClick={() => toggle(key)} style={{
                            padding: "10px", marginBottom: 6, borderRadius: 7, cursor: "pointer", transition: "all 0.2s",
                            border: `1px solid ${selected.includes(key) ? l.color + "50" : C.border}`,
                            background: selected.includes(key) ? l.color + "08" : "transparent",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: selected.includes(key) ? l.color : "rgba(156,163,175,0.1)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: l.color, fontFamily: "Inter" }}>{l.name}</span>
                            </div>
                            <div style={{ fontSize: 10, color: C.accent, fontFamily: "Inter, sans-serif", marginBottom: 2 }}>{l.formula}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, lineHeight: 1.4 }}>{l.desc}</div>
                        </div>
                    ))}
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>KEY INSIGHTS</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: "#7C3AED" }}>MSE:</strong> Smooth, differentiable, sensitive to outliers<br />
                        <strong style={{ color: "#ff3264" }}>MAE:</strong> Robust but not smooth at 0<br />
                        <strong style={{ color: "#a855f7" }}>Huber:</strong> Best of MSE + MAE<br />
                        <strong style={{ color: "#4cc9f0" }}>BCE:</strong> For classification tasks
                    </div>
                </div>
            </div>
        </div>
    );
}
