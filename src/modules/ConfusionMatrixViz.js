import { useState, useRef, useEffect, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function ConfusionMatrixViz() {
    const rocRef = useRef(null);
    const [threshold, setThreshold] = useState(0.5);
    const [nSamples, setNSamples] = useState(100);
    const [data, setData] = useState([]);
    const [matrix, setMatrix] = useState({ tp: 0, fp: 0, tn: 0, fn: 0 });

    const generateData = useCallback((n) => {
        const d = [];
        for (let i = 0; i < n; i++) {
            const actual = Math.random() > 0.5 ? 1 : 0;
            const score = actual === 1
                ? Math.min(1, Math.max(0, 0.65 + rand(-0.35, 0.3)))
                : Math.min(1, Math.max(0, 0.35 + rand(-0.3, 0.35)));
            d.push({ actual, score });
        }
        return d;
    }, []);

    useEffect(() => { setData(generateData(nSamples)); }, [nSamples, generateData]);

    useEffect(() => {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        data.forEach(d => {
            const pred = d.score >= threshold ? 1 : 0;
            if (pred === 1 && d.actual === 1) tp++;
            else if (pred === 1 && d.actual === 0) fp++;
            else if (pred === 0 && d.actual === 0) tn++;
            else fn++;
        });
        setMatrix({ tp, fp, tn, fn });
    }, [data, threshold]);

    // Draw ROC curve
    const drawROC = useCallback(() => {
        const canvas = rocRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const pad = 40;
        const pw = W - pad * 2, ph = H - pad * 2;
        // Axes
        ctx.strokeStyle = "rgba(156,163,175,0.15)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
        ctx.fillStyle = "rgba(156,163,175,0.3)"; ctx.font = "9px Inter"; ctx.textAlign = "center";
        ctx.fillText("FPR (False Positive Rate)", W / 2, H - 6);
        ctx.save(); ctx.translate(10, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("TPR (True Positive Rate)", 0, 0); ctx.restore();

        // Diagonal
        ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, pad);
        ctx.strokeStyle = "rgba(156,163,175,0.1)"; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

        // ROC curve
        const rocPoints = [];
        let auc = 0;
        for (let t = 0; t <= 1.001; t += 0.01) {
            let tp = 0, fp = 0, fn2 = 0, tn = 0;
            data.forEach(d => {
                const pred = d.score >= t ? 1 : 0;
                if (pred === 1 && d.actual === 1) tp++;
                else if (pred === 1 && d.actual === 0) fp++;
                else if (pred === 0 && d.actual === 0) tn++;
                else fn2++;
            });
            const tpr = tp + fn2 > 0 ? tp / (tp + fn2) : 0;
            const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
            rocPoints.push({ fpr, tpr, t });
        }
        // Calculate AUC using trapezoidal rule
        rocPoints.sort((a, b) => a.fpr - b.fpr);
        for (let i = 1; i < rocPoints.length; i++) {
            auc += (rocPoints[i].fpr - rocPoints[i - 1].fpr) * (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
        }

        // Fill under curve
        ctx.beginPath(); ctx.moveTo(pad, H - pad);
        rocPoints.forEach(p => ctx.lineTo(pad + p.fpr * pw, H - pad - p.tpr * ph));
        ctx.lineTo(W - pad, H - pad); ctx.closePath();
        ctx.fillStyle = "rgba(124,58,237,0.08)"; ctx.fill();

        // Curve line
        ctx.beginPath();
        rocPoints.forEach((p, i) => { const x = pad + p.fpr * pw, y = H - pad - p.tpr * ph; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.shadowBlur = 6; ctx.shadowColor = C.accent; ctx.stroke(); ctx.shadowBlur = 0;

        // Current threshold point
        const { tp: ctp, fp: cfp, tn: ctn, fn: cfn } = matrix;
        const curTPR = ctp + cfn > 0 ? ctp / (ctp + cfn) : 0;
        const curFPR = cfp + ctn > 0 ? cfp / (cfp + ctn) : 0;
        ctx.beginPath(); ctx.arc(pad + curFPR * pw, H - pad - curTPR * ph, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ffc800"; ctx.shadowBlur = 12; ctx.shadowColor = "#ffc800"; ctx.fill(); ctx.shadowBlur = 0;

        // AUC label
        ctx.fillStyle = "rgba(156,163,175,0.7)"; ctx.font = "bold 12px Inter"; ctx.textAlign = "right";
        ctx.fillText(`AUC = ${auc.toFixed(3)}`, W - pad, pad + 16);
    }, [data, matrix]);

    useEffect(() => {
        const c = rocRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        drawROC();
    }, []);

    useEffect(() => { drawROC(); }, [drawROC]);

    const { tp, fp, tn, fn } = matrix;
    const accuracy = (tp + tn) / (tp + fp + tn + fn) || 0;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * precision * recall / (precision + recall) || 0;
    const specificity = tn / (tn + fp) || 0;

    const CellStyle = (color, val, isHigh) => ({
        padding: "18px 12px", textAlign: "center", borderRadius: 8,
        background: `${color}${isHigh ? "20" : "08"}`,
        border: `1px solid ${color}${isHigh ? "50" : "20"}`,
        transition: "all 0.3s",
    });

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <span style={S.cardTitle}>CONFUSION MATRIX</span>
                        <button style={{ ...S.btn("secondary"), fontSize: 10 }} onClick={() => setData(generateData(nSamples))}>↺ Regenerate</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gridTemplateRows: "30px 1fr 1fr", gap: 6 }}>
                        <div />
                        <div style={{ textAlign: "center", fontSize: 10, color: C.accent, fontWeight: 700 }}>Pred: Positive</div>
                        <div style={{ textAlign: "center", fontSize: 10, color: "#ff3264", fontWeight: 700 }}>Pred: Negative</div>
                        <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, display: "flex", alignItems: "center" }}>Actual: P</div>
                        <div style={CellStyle("#7C3AED", tp, true)}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#7C3AED", fontFamily: "Inter" }}>{tp}</div>
                            <div style={{ fontSize: 9, color: "#7C3AED", marginTop: 4 }}>True Positive</div>
                        </div>
                        <div style={CellStyle("#ff3264", fn, false)}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#ff3264", fontFamily: "Inter" }}>{fn}</div>
                            <div style={{ fontSize: 9, color: "#ff3264", marginTop: 4 }}>False Negative</div>
                        </div>
                        <div style={{ fontSize: 10, color: "#ff3264", fontWeight: 700, display: "flex", alignItems: "center" }}>Actual: N</div>
                        <div style={CellStyle("#ffc800", fp, false)}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#ffc800", fontFamily: "Inter" }}>{fp}</div>
                            <div style={{ fontSize: 9, color: "#ffc800", marginTop: 4 }}>False Positive</div>
                        </div>
                        <div style={CellStyle("#4cc9f0", tn, true)}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#4cc9f0", fontFamily: "Inter" }}>{tn}</div>
                            <div style={{ fontSize: 9, color: "#4cc9f0", marginTop: 4 }}>True Negative</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Classification Threshold</span><span style={S.val}>{threshold.toFixed(2)}</span>
                        </div>
                        <input type="range" style={S.range} min={0} max={1} step={0.01} value={threshold} onChange={e => setThreshold(+e.target.value)} />
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>ROC CURVE</div>
                    <div style={S.canvasWrap}>
                        <canvas ref={rocRef} style={{ width: "100%", height: 240, display: "block" }} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>CLASSIFICATION METRICS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[["Accuracy", fmt(accuracy, 3)], ["Precision", fmt(precision, 3)], ["Recall", fmt(recall, 3)], ["F1 Score", fmt(f1, 3)], ["Specificity", fmt(specificity, 3)], ["Samples", data.length]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>FORMULAS</div>
                    <div style={{ ...S.infoBox(), fontSize: 9, lineHeight: 2 }}>
                        <strong style={{ color: "#7C3AED" }}>Precision:</strong> TP/(TP+FP) — of predicted +, how many correct?<br />
                        <strong style={{ color: "#a855f7" }}>Recall:</strong> TP/(TP+FN) — of actual +, how many found?<br />
                        <strong style={{ color: "#ffc800" }}>F1:</strong> 2·P·R/(P+R) — harmonic mean<br />
                        <strong style={{ color: "#4cc9f0" }}>AUC:</strong> Area under ROC — overall quality
                    </div>
                </div>
            </div>
        </div>
    );
}
