import { useState, useRef, useEffect, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function CrossValidationViz() {
    const canvasRef = useRef(null);
    const [nFolds, setNFolds] = useState(5);
    const [nSamples, setNSamples] = useState(50);
    const [currentFold, setCurrentFold] = useState(-1);
    const [running, setRunning] = useState(false);
    const [scores, setScores] = useState([]);
    const CL_TRAIN = "#7C3AED", CL_TEST = "#ff3264";

    // Generate fake accuracy scores
    const genScores = useCallback((k) => {
        const base = 0.82;
        return Array.from({ length: k }, () => base + rand(-0.08, 0.08));
    }, []);

    useEffect(() => {
        setScores(genScores(nFolds));
        setCurrentFold(-1);
    }, [nFolds, nSamples, genScores]);

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            setCurrentFold(f => {
                if (f >= nFolds - 1) { setRunning(false); return nFolds - 1; }
                return f + 1;
            });
        }, 800);
        return () => clearInterval(timer);
    }, [running, nFolds]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const pad = 30, foldH = 36, gap = 8;
        const totalH = nFolds * (foldH + gap);
        const startY = Math.max(pad, (H - totalH) / 2);
        const barW = W - pad * 2;

        ctx.fillStyle = "rgba(156,163,175,0.5)"; ctx.font = "bold 11px Inter"; ctx.textAlign = "center";
        ctx.fillText(`${nFolds}-FOLD CROSS VALIDATION`, W / 2, startY - 14);

        for (let fold = 0; fold < nFolds; fold++) {
            const y = startY + fold * (foldH + gap);
            const foldWidth = barW / nFolds;
            const isActive = fold <= currentFold;
            const isCurrent = fold === currentFold;

            // Label
            ctx.fillStyle = isCurrent ? "#ffc800" : isActive ? C.accent : "rgba(156,163,175,0.3)";
            ctx.font = `bold 10px Inter`; ctx.textAlign = "right";
            ctx.fillText(`Fold ${fold + 1}`, pad - 6, y + foldH / 2 + 3);

            // Draw each segment
            for (let seg = 0; seg < nFolds; seg++) {
                const x = pad + seg * foldWidth;
                const isTestSeg = seg === fold;
                const color = isTestSeg ? CL_TEST : CL_TRAIN;
                const alpha = isActive ? (isTestSeg ? "40" : "25") : "08";

                ctx.fillStyle = color + alpha;
                ctx.fillRect(x + 1, y, foldWidth - 2, foldH);
                ctx.strokeStyle = color + (isActive ? "60" : "15");
                ctx.lineWidth = isCurrent && isTestSeg ? 2 : 1;
                ctx.strokeRect(x + 1, y, foldWidth - 2, foldH);

                // Label inside segment
                if (foldWidth > 40) {
                    ctx.fillStyle = color + (isActive ? "80" : "30");
                    ctx.font = "bold 9px Inter"; ctx.textAlign = "center";
                    ctx.fillText(isTestSeg ? "TEST" : "TRAIN", x + foldWidth / 2, y + foldH / 2 + 3);
                }
            }

            // Score
            if (isActive && scores[fold] !== undefined) {
                ctx.fillStyle = isCurrent ? "#ffc800" : C.accent;
                ctx.font = "bold 11px Inter"; ctx.textAlign = "left";
                ctx.fillText(`${(scores[fold] * 100).toFixed(1)}%`, W - pad + 6, y + foldH / 2 + 3);
            }

            // Current fold highlight
            if (isCurrent) {
                ctx.strokeStyle = "#ffc800"; ctx.lineWidth = 2;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(pad - 2, y - 2, barW + 4, foldH + 4);
                ctx.setLineDash([]);
            }
        }

        // Average score line
        if (currentFold >= 0) {
            const activeScores = scores.slice(0, currentFold + 1);
            const avg = activeScores.reduce((s, v) => s + v, 0) / activeScores.length;
            const bottomY = startY + nFolds * (foldH + gap) + 10;
            ctx.fillStyle = "rgba(156,163,175,0.1)";
            ctx.fillRect(pad, bottomY, barW, 32);
            ctx.strokeStyle = C.accent + "30"; ctx.lineWidth = 1;
            ctx.strokeRect(pad, bottomY, barW, 32);
            ctx.fillStyle = C.accent; ctx.font = "bold 12px Inter"; ctx.textAlign = "center";
            ctx.fillText(`Mean Accuracy: ${(avg * 100).toFixed(2)}% ± ${(Math.sqrt(activeScores.reduce((s, v) => s + (v - avg) ** 2, 0) / activeScores.length) * 100).toFixed(2)}%`, W / 2, bottomY + 20);
        }
    }, [nFolds, currentFold, scores]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const activeScores = currentFold >= 0 ? scores.slice(0, currentFold + 1) : [];
    const mean = activeScores.length > 0 ? activeScores.reduce((s, v) => s + v, 0) / activeScores.length : 0;
    const std = activeScores.length > 0 ? Math.sqrt(activeScores.reduce((s, v) => s + (v - mean) ** 2, 0) / activeScores.length) : 0;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>CROSS-VALIDATION FOLDS</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: CL_TRAIN + "20", color: CL_TRAIN }}>TRAIN</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: CL_TEST + "20", color: CL_TEST }}>TEST</span>
                    </div>
                </div>
                <div style={S.canvasWrap}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>SETTINGS</div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>K (Number of Folds)</span><span style={S.val}>{nFolds}</span>
                        </div>
                        <input type="range" style={S.range} min={2} max={10} step={1} value={nFolds} onChange={e => setNFolds(+e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={S.label}>Samples</span><span style={S.val}>{nSamples}</span>
                        </div>
                        <input type="range" style={S.range} min={20} max={200} step={10} value={nSamples} onChange={e => setNSamples(+e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...S.btn("primary"), flex: 1 }} onClick={() => { setCurrentFold(-1); setScores(genScores(nFolds)); setRunning(true); }}>▶ Run CV</button>
                        <button style={S.btn("danger")} onClick={() => { setRunning(false); setCurrentFold(-1); }}>↺</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>FOLD RESULTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Mean Acc", mean > 0 ? (mean * 100).toFixed(2) + "%" : "—"], ["Std Dev", std > 0 ? (std * 100).toFixed(2) + "%" : "—"], ["Folds Done", `${currentFold + 1}/${nFolds}`], ["Train Size", Math.floor(nSamples * (nFolds - 1) / nFolds)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                    {activeScores.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            {activeScores.map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 9, color: C.textMuted, minWidth: 40 }}>F{i + 1}</span>
                                    <div style={{ flex: 1, height: 6, background: "rgba(156,163,175,0.07)", borderRadius: 3, overflow: "hidden" }}>
                                        <div style={{ width: `${s * 100}%`, height: "100%", background: i === currentFold ? "#ffc800" : C.accent, borderRadius: 3, transition: "width 0.3s" }} />
                                    </div>
                                    <span style={{ fontSize: 9, color: C.textMuted, minWidth: 40, textAlign: "right" }}>{(s * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>WHY CROSS-VALIDATE?</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Problem:</strong> Single split is unreliable<br />
                        <strong style={{ color: "#a855f7" }}>Solution:</strong> Rotate test set K times<br />
                        <strong style={{ color: "#ffc800" }}>Result:</strong> Mean ± std of performance<br />
                        <strong style={{ color: "#ff3264" }}>Common:</strong> K=5 or K=10 folds
                    </div>
                </div>
            </div>
        </div>
    );
}
