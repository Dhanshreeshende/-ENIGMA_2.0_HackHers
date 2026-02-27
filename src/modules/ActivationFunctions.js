import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function ActivationFunctions() {
    const canvasRef = useRef(null);
    const [selected, setSelected] = useState(["relu", "sigmoid", "tanh"]);
    const [xRange, setXRange] = useState(5);
    const [showDerivative, setShowDerivative] = useState(false);

    const fns = {
        relu: { name: "ReLU", color: "#7C3AED", fn: x => Math.max(0, x), dfn: x => x > 0 ? 1 : 0, formula: "max(0, x)", desc: "Most popular. Simple, fast. Dies for x<0." },
        sigmoid: { name: "Sigmoid", color: "#a855f7", fn: x => 1 / (1 + Math.exp(-x)), dfn: x => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, formula: "1/(1+e⁻ˣ)", desc: "Output [0,1]. Vanishing gradient problem." },
        tanh: { name: "Tanh", color: "#ffc800", fn: x => Math.tanh(x), dfn: x => 1 - Math.tanh(x) ** 2, formula: "(eˣ-e⁻ˣ)/(eˣ+e⁻ˣ)", desc: "Zero-centered. Better than sigmoid." },
        leaky: { name: "Leaky ReLU", color: "#ff3264", fn: x => x > 0 ? x : 0.01 * x, dfn: x => x > 0 ? 1 : 0.01, formula: "max(0.01x, x)", desc: "Fixes dying ReLU. Small slope for x<0." },
        elu: { name: "ELU", color: "#4cc9f0", fn: x => x > 0 ? x : Math.exp(x) - 1, dfn: x => x > 0 ? 1 : Math.exp(x), formula: "x>0?x:eˣ-1", desc: "Smooth for x<0. Robust to noise." },
        swish: { name: "Swish", color: "#ff8c00", fn: x => x / (1 + Math.exp(-x)), dfn: x => { const s = 1 / (1 + Math.exp(-x)); return s + x * s * (1 - s); }, formula: "x·σ(x)", desc: "Self-gated. Used in EfficientNet." },
        gelu: { name: "GELU", color: "#00d4ff", fn: x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))), dfn: x => { const t = Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)); return 0.5 * (1 + t) + 0.5 * x * (1 - t ** 2) * Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * x ** 2); }, formula: "x·Φ(x)", desc: "Used in BERT, GPT. Smooth gating." },
        softplus: { name: "Softplus", color: "#e879f9", fn: x => Math.log(1 + Math.exp(x)), dfn: x => 1 / (1 + Math.exp(-x)), formula: "ln(1+eˣ)", desc: "Smooth ReLU. Always positive." },
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Axes
        const cx = W / 2, cy = H / 2;
        ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

        // Tick marks
        ctx.fillStyle = "rgba(156,163,175,0.25)"; ctx.font = "9px Inter"; ctx.textAlign = "center";
        for (let i = -xRange; i <= xRange; i++) {
            if (i === 0) continue;
            const x = cx + (i / xRange) * (W / 2 - 20);
            ctx.beginPath(); ctx.moveTo(x, cy - 3); ctx.lineTo(x, cy + 3); ctx.strokeStyle = "rgba(156,163,175,0.2)"; ctx.stroke();
            ctx.fillText(i, x, cy + 16);
        }
        const yScale = H / (xRange * 1.2);

        // Draw functions
        selected.forEach(key => {
            const f = fns[key]; if (!f) return;
            const useFn = showDerivative ? f.dfn : f.fn;
            ctx.beginPath();
            for (let px = 0; px < W; px++) {
                const x = ((px - cx) / (W / 2 - 20)) * xRange;
                const y = useFn(x);
                const py = cy - y * yScale;
                px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = f.color; ctx.lineWidth = 2.5; ctx.shadowBlur = 6; ctx.shadowColor = f.color;
            ctx.stroke(); ctx.shadowBlur = 0;
        });

        // Y-axis labels
        ctx.textAlign = "right";
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            const y = cy - i * yScale;
            if (y > 10 && y < H - 10) {
                ctx.fillStyle = "rgba(156,163,175,0.2)";
                ctx.fillText(i, cx - 8, y + 3);
            }
        }

        // Legend
        ctx.textAlign = "left";
        selected.forEach((key, i) => {
            const f = fns[key]; if (!f) return;
            const ly = 16 + i * 18;
            ctx.fillStyle = f.color; ctx.fillRect(10, ly - 4, 12, 3);
            ctx.fillStyle = f.color; ctx.font = "bold 10px Inter";
            ctx.fillText(f.name, 28, ly);
        });
    }, [selected, xRange, showDerivative, fns]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const toggle = (key) => {
        setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>{showDerivative ? "DERIVATIVES f'(x)" : "ACTIVATION FUNCTIONS f(x)"}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: C.textMuted }}>Range: ±{xRange}</span>
                        <input type="range" style={{ ...S.range, width: 80 }} min={2} max={10} step={1} value={xRange} onChange={e => setXRange(+e.target.value)} />
                    </div>
                </div>
                <div style={S.canvasWrap}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} />
                </div>
                <div style={{ marginTop: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={showDerivative} onChange={e => setShowDerivative(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Derivatives (for backpropagation)</span>
                    </label>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 550, overflowY: "auto" }}>
                {Object.entries(fns).map(([key, f]) => (
                    <div key={key} onClick={() => toggle(key)} style={{
                        ...S.card, cursor: "pointer", transition: "all 0.2s", padding: 12,
                        borderColor: selected.includes(key) ? f.color + "60" : C.border,
                        background: selected.includes(key) ? f.color + "08" : C.surface,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: selected.includes(key) ? f.color : "rgba(156,163,175,0.1)", transition: "all 0.2s" }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: f.color, fontFamily: "Inter" }}>{f.name}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.accent, fontFamily: "Inter, sans-serif", marginBottom: 3 }}>{f.formula}</div>
                        <div style={{ fontSize: 9, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
