import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function RegularizationViz() {
    const canvasRef = useRef(null);
    const weightRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [lambda, setLambda] = useState(0.1);
    const [regType, setRegType] = useState("l2");
    const [degree, setDegree] = useState(8);

    const fitPoly = useCallback((pts, d, lam, type) => {
        if (pts.length < 2) return null;
        const n = pts.length;
        const X = pts.map(p => { const row = []; for (let i = 0; i <= d; i++) row.push(p.x ** i); return row; });
        const y = pts.map(p => p.y);
        const cols = d + 1;
        const XtX = Array.from({ length: cols }, () => Array(cols).fill(0));
        const Xty = Array(cols).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < cols; j++) {
                Xty[j] += X[i][j] * y[i];
                for (let k = 0; k < cols; k++) XtX[j][k] += X[i][j] * X[i][k];
            }
        }
        for (let j = 0; j < cols; j++) {
            if (j > 0) {
                if (type === "l2") XtX[j][j] += lam * n;
                else if (type === "l1") XtX[j][j] += lam * n * 0.5;
            }
        }
        // Solve via Gaussian elimination
        const A = XtX.map((row, i) => [...row, Xty[i]]);
        for (let i = 0; i < cols; i++) {
            let maxRow = i;
            for (let k = i + 1; k < cols; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
            [A[i], A[maxRow]] = [A[maxRow], A[i]];
            if (Math.abs(A[i][i]) < 1e-12) continue;
            for (let k = i + 1; k < cols; k++) {
                const f = A[k][i] / A[i][i];
                for (let j = i; j <= cols; j++) A[k][j] -= f * A[i][j];
            }
        }
        const w = Array(cols).fill(0);
        for (let i = cols - 1; i >= 0; i--) {
            w[i] = A[i][cols];
            for (let j = i + 1; j < cols; j++) w[i] -= A[i][j] * w[j];
            w[i] /= A[i][i] || 1;
        }
        return w;
    }, []);

    const evalPoly = (w, x) => { if (!w) return 0; return w.reduce((s, c, i) => s + c * x ** i, 0); };

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

        // Fit both with and without regularization
        const wNoReg = fitPoly(points, degree, 0, "none");
        const wReg = fitPoly(points, degree, lambda, regType);

        // Unregularized line
        if (wNoReg && points.length >= 2) {
            ctx.beginPath();
            for (let px = 0; px <= W; px++) {
                const x = (px - 30) / (W - 60);
                const y = evalPoly(wNoReg, x);
                const py = toY(Math.max(-0.5, Math.min(1.5, y)));
                px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = "rgba(255,50,100,0.5)"; ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Regularized line
        if (wReg && points.length >= 2) {
            ctx.beginPath();
            for (let px = 0; px <= W; px++) {
                const x = (px - 30) / (W - 60);
                const y = evalPoly(wReg, x);
                const py = toY(Math.max(-0.5, Math.min(1.5, y)));
                px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5;
            ctx.shadowBlur = 8; ctx.shadowColor = C.accent; ctx.stroke(); ctx.shadowBlur = 0;
        }

        // Points
        for (const p of points) {
            ctx.shadowBlur = 6; ctx.shadowColor = "#4cc9f0";
            ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 5, 0, Math.PI * 2);
            ctx.fillStyle = "#4cc9f0cc"; ctx.fill(); ctx.shadowBlur = 0;
        }

        // Legend
        ctx.fillStyle = C.accent; ctx.fillRect(W - 180, 12, 12, 3);
        ctx.fillStyle = C.accent; ctx.font = "bold 9px Inter"; ctx.textAlign = "left";
        ctx.fillText(`${regType.toUpperCase()} Regularized`, W - 164, 16);
        ctx.fillStyle = "#ff3264"; ctx.fillRect(W - 180, 28, 12, 3);
        ctx.setLineDash([3, 3]);
        ctx.fillStyle = "#ff3264"; ctx.fillText("No Regularization", W - 164, 32);

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
        }

        // Weight magnitude chart
        const wc = weightRef.current; if (!wc) return;
        const wctx = wc.getContext("2d");
        const WW = wc.width, WH = wc.height;
        wctx.clearRect(0, 0, WW, WH);
        if (wReg && wNoReg) {
            const maxW = Math.max(...wNoReg.map(Math.abs), ...wReg.map(Math.abs), 0.1);
            const barW = (WW - 20) / (degree + 1) / 2 - 2;
            for (let i = 0; i <= degree; i++) {
                const x = 10 + i * (WW - 20) / (degree + 1);
                // Unreg
                const h1 = (Math.abs(wNoReg[i] || 0) / maxW) * (WH - 30);
                wctx.fillStyle = "#ff326460";
                wctx.fillRect(x, WH - 20 - h1, barW, h1);
                // Reg
                const h2 = (Math.abs(wReg[i] || 0) / maxW) * (WH - 30);
                wctx.fillStyle = C.accent + "90";
                wctx.fillRect(x + barW + 2, WH - 20 - h2, barW, h2);
                // Label
                wctx.fillStyle = "rgba(156,163,175,0.3)"; wctx.font = "8px Inter"; wctx.textAlign = "center";
                wctx.fillText(`w${i}`, x + barW, WH - 6);
            }
        }
    }, [points, lambda, regType, degree, fitPoly]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        const w = weightRef.current; if (w) { w.width = w.offsetWidth; w.height = w.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - r.left - 30) / (r.width - 60);
        const y = 1 - (e.clientY - r.top - 30) / (r.height - 60);
        if (x >= 0 && x <= 1 && y >= -0.2 && y <= 1.2) setPoints(prev => [...prev, { x, y }]);
    };

    const addPreset = () => {
        const pts = [];
        for (let i = 0; i < 15; i++) {
            const x = rand(0.05, 0.95);
            pts.push({ x, y: 0.3 + 0.4 * Math.sin(x * Math.PI * 2) + rand(-0.1, 0.1) });
        }
        setPoints(pts);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>REGULARIZATION EFFECT</div>
                    <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: 340, display: "block" }} onClick={handleClick} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>WEIGHT MAGNITUDES (|wᵢ|)</div>
                    <canvas ref={weightRef} style={{ width: "100%", height: 120, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>PARAMETERS</div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={S.label}>Regularization Type</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            {[["L1 (Lasso)", "l1"], ["L2 (Ridge)", "l2"]].map(([l, v]) => (
                                <button key={v} onClick={() => setRegType(v)} style={{ ...S.btn(regType === v ? "primary" : "secondary"), flex: 1, fontSize: 10 }}>{l}</button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>λ (Penalty Strength)</span><span style={S.val}>{lambda.toFixed(3)}</span>
                        </div>
                        <input type="range" style={S.range} min={0} max={2} step={0.01} value={lambda} onChange={e => setLambda(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Polynomial Degree</span><span style={S.val}>{degree}</span>
                        </div>
                        <input type="range" style={S.range} min={1} max={12} step={1} value={degree} onChange={e => setDegree(+e.target.value)} />
                    </div>
                    <button style={{ ...S.btn("primary"), width: "100%", marginBottom: 6 }} onClick={addPreset}>Generate Data</button>
                    <button style={{ ...S.btn("danger"), width: "100%" }} onClick={() => setPoints([])}>↺ Clear</button>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>L1 vs L2</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>L2 (Ridge):</strong> L + λΣwᵢ²<br />
                        Shrinks weights uniformly. Never zeroes out.<br />
                        <strong style={{ color: "#ff3264" }}>L1 (Lasso):</strong> L + λΣ|wᵢ|<br />
                        Drives weights to exactly 0 → feature selection.<br />
                        <strong style={{ color: "#ffc800" }}>λ↑:</strong> More penalty → simpler model<br />
                        <strong style={{ color: "#a855f7" }}>λ↓:</strong> Less penalty → risk overfitting
                    </div>
                </div>
            </div>
        </div>
    );
}
