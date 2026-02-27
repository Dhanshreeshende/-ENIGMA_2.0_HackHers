import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand, fmt } from "../utils";

export default function PCAViz() {
    const canvasRef = useRef(null);
    const barRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [showPC, setShowPC] = useState(true);
    const [showProjection, setShowProjection] = useState(false);
    const [eigenvalues, setEigenvalues] = useState([0, 0]);

    const computePCA = useCallback((pts) => {
        if (pts.length < 3) return { pc1: [1, 0], pc2: [0, 1], mean: [0, 0], eig: [0, 0] };
        const n = pts.length;
        const mx = pts.reduce((s, p) => s + p.x, 0) / n;
        const my = pts.reduce((s, p) => s + p.y, 0) / n;
        let cxx = 0, cyy = 0, cxy = 0;
        for (const p of pts) { cxx += (p.x - mx) ** 2; cyy += (p.y - my) ** 2; cxy += (p.x - mx) * (p.y - my); }
        cxx /= n; cyy /= n; cxy /= n;
        const trace = cxx + cyy;
        const det = cxx * cyy - cxy * cxy;
        const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
        const e1 = trace / 2 + disc, e2 = trace / 2 - disc;
        let pc1, pc2;
        if (Math.abs(cxy) > 1e-10) {
            pc1 = [e1 - cyy, cxy]; pc2 = [e2 - cyy, cxy];
        } else {
            pc1 = cxx >= cyy ? [1, 0] : [0, 1];
            pc2 = cxx >= cyy ? [0, 1] : [1, 0];
        }
        const n1 = Math.sqrt(pc1[0] ** 2 + pc1[1] ** 2);
        const n2 = Math.sqrt(pc2[0] ** 2 + pc2[1] ** 2);
        if (n1 > 0) { pc1[0] /= n1; pc1[1] /= n1; }
        if (n2 > 0) { pc2[0] /= n2; pc2[1] /= n2; }
        return { pc1, pc2, mean: [mx, my], eig: [Math.max(0, e1), Math.max(0, e2)] };
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(124,58,237,0.04)"; ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const px = (x) => (x + 1) / 2 * W;
        const py = (y) => (y + 1) / 2 * H;
        const { pc1, pc2, mean, eig } = computePCA(points);
        setEigenvalues(eig);

        if (showPC && points.length >= 3) {
            const scale1 = Math.sqrt(eig[0]) * 4;
            const scale2 = Math.sqrt(eig[1]) * 4;
            // PC1
            ctx.beginPath();
            ctx.moveTo(px(mean[0] - pc1[0] * scale1), py(mean[1] - pc1[1] * scale1));
            ctx.lineTo(px(mean[0] + pc1[0] * scale1), py(mean[1] + pc1[1] * scale1));
            ctx.strokeStyle = "#7C3AED"; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = "#7C3AED"; ctx.stroke(); ctx.shadowBlur = 0;
            // Arrowhead
            const ax1 = px(mean[0] + pc1[0] * scale1), ay1 = py(mean[1] + pc1[1] * scale1);
            const angle1 = Math.atan2(pc1[1], pc1[0]);
            ctx.beginPath();
            ctx.moveTo(ax1, ay1);
            ctx.lineTo(ax1 - 12 * Math.cos(angle1 - 0.3), ay1 - 12 * Math.sin(angle1 - 0.3));
            ctx.lineTo(ax1 - 12 * Math.cos(angle1 + 0.3), ay1 - 12 * Math.sin(angle1 + 0.3));
            ctx.closePath(); ctx.fillStyle = "#7C3AED"; ctx.fill();
            ctx.fillStyle = "#7C3AED"; ctx.font = "bold 11px Inter";
            ctx.fillText("PC1", ax1 + 8, ay1 - 8);

            // PC2
            ctx.beginPath();
            ctx.moveTo(px(mean[0] - pc2[0] * scale2), py(mean[1] - pc2[1] * scale2));
            ctx.lineTo(px(mean[0] + pc2[0] * scale2), py(mean[1] + pc2[1] * scale2));
            ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 2.5; ctx.shadowBlur = 8; ctx.shadowColor = "#a855f7"; ctx.stroke(); ctx.shadowBlur = 0;
            const ax2 = px(mean[0] + pc2[0] * scale2), ay2 = py(mean[1] + pc2[1] * scale2);
            const angle2 = Math.atan2(pc2[1], pc2[0]);
            ctx.beginPath(); ctx.moveTo(ax2, ay2);
            ctx.lineTo(ax2 - 10 * Math.cos(angle2 - 0.3), ay2 - 10 * Math.sin(angle2 - 0.3));
            ctx.lineTo(ax2 - 10 * Math.cos(angle2 + 0.3), ay2 - 10 * Math.sin(angle2 + 0.3));
            ctx.closePath(); ctx.fillStyle = "#a855f7"; ctx.fill();
            ctx.fillStyle = "#a855f7"; ctx.font = "bold 11px Inter";
            ctx.fillText("PC2", ax2 + 8, ay2 - 8);

            // Mean
            ctx.beginPath(); ctx.arc(px(mean[0]), py(mean[1]), 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffc800"; ctx.fill();
        }

        // Projections
        if (showProjection && points.length >= 3) {
            for (const p of points) {
                const dx = p.x - mean[0], dy = p.y - mean[1];
                const proj = dx * pc1[0] + dy * pc1[1];
                const projX = mean[0] + proj * pc1[0], projY = mean[1] + proj * pc1[1];
                ctx.beginPath(); ctx.moveTo(px(p.x), py(p.y)); ctx.lineTo(px(projX), py(projY));
                ctx.strokeStyle = "rgba(255,200,0,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
                ctx.beginPath(); ctx.arc(px(projX), py(projY), 3, 0, Math.PI * 2);
                ctx.fillStyle = "#ffc800cc"; ctx.fill();
            }
        }

        // Points
        for (const p of points) {
            ctx.shadowBlur = 6; ctx.shadowColor = "#4cc9f0";
            ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 5, 0, Math.PI * 2);
            ctx.fillStyle = "#4cc9f0cc"; ctx.fill(); ctx.shadowBlur = 0;
        }

        if (points.length === 0) {
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "14px Inter"; ctx.textAlign = "center";
            ctx.fillText("Click to add data points", W / 2, H / 2);
        }

        // Variance bar
        const bar = barRef.current; if (!bar) return;
        const bctx = bar.getContext("2d");
        const BW = bar.width, BH = bar.height;
        bctx.clearRect(0, 0, BW, BH);
        const total = eig[0] + eig[1];
        if (total > 0) {
            const r1 = eig[0] / total, r2 = eig[1] / total;
            bctx.fillStyle = "#7C3AED"; bctx.fillRect(10, 20, (BW - 20) * r1, 24);
            bctx.fillStyle = "#a855f7"; bctx.fillRect(10 + (BW - 20) * r1, 20, (BW - 20) * r2, 24);
            bctx.fillStyle = "rgba(156,163,175,0.7)"; bctx.font = "bold 10px Inter"; bctx.textAlign = "center";
            if (r1 > 0.15) bctx.fillText(`${(r1 * 100).toFixed(1)}%`, 10 + (BW - 20) * r1 / 2, 36);
            if (r2 > 0.15) bctx.fillText(`${(r2 * 100).toFixed(1)}%`, 10 + (BW - 20) * r1 + (BW - 20) * r2 / 2, 36);
            bctx.fillStyle = "#7C3AED"; bctx.textAlign = "left"; bctx.fillText("PC1", 10, 14);
            bctx.fillStyle = "#a855f7"; bctx.textAlign = "right"; bctx.fillText("PC2", BW - 10, 14);
        }
    }, [points, showPC, showProjection, computePCA]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        const b = barRef.current; if (b) { b.width = b.offsetWidth; b.height = b.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const handleClick = (e) => {
        const r = canvasRef.current.getBoundingClientRect();
        setPoints(prev => [...prev, { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 }]);
    };

    const addPreset = (type) => {
        const pts = [];
        if (type === "correlated") {
            for (let i = 0; i < 40; i++) { const x = rand(-0.6, 0.6); pts.push({ x, y: x * 0.8 + rand(-0.12, 0.12) }); }
        } else if (type === "spread") {
            for (let i = 0; i < 40; i++) pts.push({ x: rand(-0.7, 0.7), y: rand(-0.7, 0.7) });
        } else if (type === "diagonal") {
            for (let i = 0; i < 40; i++) { const t = rand(-0.7, 0.7); pts.push({ x: t * 0.7 + rand(-0.15, 0.15), y: -t * 0.5 + rand(-0.1, 0.1) }); }
        }
        setPoints(pts);
    };

    const total = eigenvalues[0] + eigenvalues[1];
    const var1 = total > 0 ? (eigenvalues[0] / total * 100).toFixed(1) : "—";
    const var2 = total > 0 ? (eigenvalues[1] / total * 100).toFixed(1) : "—";

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>PCA VISUALIZATION</div>
                    <div style={{ ...S.canvasWrap, cursor: "crosshair" }}>
                        <canvas ref={canvasRef} style={{ width: "100%", height: 380, display: "block" }} onClick={handleClick} />
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>EXPLAINED VARIANCE RATIO</div>
                    <canvas ref={barRef} style={{ width: "100%", height: 50, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>CONTROLS</div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                        <input type="checkbox" checked={showPC} onChange={e => setShowPC(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Principal Components</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
                        <input type="checkbox" checked={showProjection} onChange={e => setShowProjection(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Projections onto PC1</span>
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button style={S.btn("primary")} onClick={() => addPreset("correlated")}>Correlated Data</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("spread")}>Uniform Spread</button>
                        <button style={S.btn("secondary")} onClick={() => addPreset("diagonal")}>Diagonal</button>
                        <button style={S.btn("danger")} onClick={() => setPoints([])}>↺ Clear</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>VARIANCE</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["PC1 Var", var1 + "%"], ["PC2 Var", var2 + "%"], ["λ₁", fmt(eigenvalues[0], 4)], ["λ₂", fmt(eigenvalues[1], 4)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>PCA THEORY</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Goal:</strong> Find orthogonal axes of maximum variance<br />
                        <strong style={{ color: "#a855f7" }}>Eigenvectors:</strong> of covariance matrix Σ<br />
                        <strong style={{ color: "#ffc800" }}>Eigenvalues:</strong> λ = variance along each PC<br />
                        <strong style={{ color: "#ff3264" }}>Dim. Reduction:</strong> Project onto top-k PCs
                    </div>
                </div>
            </div>
        </div>
    );
}
