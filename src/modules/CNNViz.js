import { useState, useRef, useEffect, useCallback } from "react";
import { S, C } from "../styles";

export default function CNNViz() {
    const convRef = useRef(null);
    const [kernel, setKernel] = useState("edge_h");
    const [stride, setStride] = useState(1);
    const [padding, setPadding] = useState(0);
    const [showPool, setShowPool] = useState(true);
    const [inputSize] = useState(8);

    const kernels = {
        edge_h: { name: "Edge (Horizontal)", k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]], color: "#7C3AED" },
        edge_v: { name: "Edge (Vertical)", k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], color: "#a855f7" },
        sharpen: { name: "Sharpen", k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], color: "#ffc800" },
        blur: { name: "Blur (Average)", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)), color: "#4cc9f0" },
        emboss: { name: "Emboss", k: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], color: "#ff3264" },
        identity: { name: "Identity", k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], color: "#ff8c00" },
    };

    // Generate a simple pattern input
    const genInput = useCallback(() => {
        const img = Array.from({ length: inputSize }, () => Array(inputSize).fill(0));
        // Simple cross pattern
        for (let i = 0; i < inputSize; i++) { img[inputSize >> 1][i] = 1; img[i][inputSize >> 1] = 1; }
        // Diagonal
        for (let i = 0; i < inputSize; i++) { if (i < inputSize) img[i][i] = 0.7; }
        // Border
        for (let i = 0; i < inputSize; i++) { img[0][i] = 0.5; img[inputSize - 1][i] = 0.5; img[i][0] = 0.5; img[i][inputSize - 1] = 0.5; }
        return img;
    }, [inputSize]);

    const convolve = useCallback((input, kern, s, p) => {
        const kSize = kern.length;
        const inSize = input.length;
        const padded = Array.from({ length: inSize + 2 * p }, () => Array(inSize + 2 * p).fill(0));
        for (let i = 0; i < inSize; i++) for (let j = 0; j < inSize; j++) padded[i + p][j + p] = input[i][j];
        const outSize = Math.floor((inSize + 2 * p - kSize) / s) + 1;
        const output = Array.from({ length: outSize }, () => Array(outSize).fill(0));
        for (let i = 0; i < outSize; i++) {
            for (let j = 0; j < outSize; j++) {
                let sum = 0;
                for (let ki = 0; ki < kSize; ki++) for (let kj = 0; kj < kSize; kj++) {
                    sum += padded[i * s + ki][j * s + kj] * kern[ki][kj];
                }
                output[i][j] = sum;
            }
        }
        return output;
    }, []);

    const maxPool = useCallback((input, poolSize = 2) => {
        const inSize = input.length;
        const outSize = Math.floor(inSize / poolSize);
        const output = Array.from({ length: outSize }, () => Array(outSize).fill(0));
        for (let i = 0; i < outSize; i++) {
            for (let j = 0; j < outSize; j++) {
                let max = -Infinity;
                for (let pi = 0; pi < poolSize; pi++) for (let pj = 0; pj < poolSize; pj++) {
                    max = Math.max(max, input[i * poolSize + pi]?.[j * poolSize + pj] || 0);
                }
                output[i][j] = max;
            }
        }
        return output;
    }, []);

    const draw = useCallback(() => {
        const canvas = convRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const input = genInput();
        const kern = kernels[kernel].k;
        const convOutput = convolve(input, kern, stride, padding);
        const poolOutput = showPool ? maxPool(convOutput) : null;

        const drawGrid = (data, x, y, cellSize, label, color) => {
            const rows = data.length, cols = data[0]?.length || 0;
            if (rows === 0 || cols === 0) return;
            const maxVal = Math.max(...data.flat().map(Math.abs), 0.01);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const v = data[r][c];
                    const norm = v / maxVal;
                    const px = x + c * cellSize, py = y + r * cellSize;
                    if (norm >= 0) ctx.fillStyle = `rgba(124,58,237,${norm * 0.8})`;
                    else ctx.fillStyle = `rgba(255,50,100,${Math.abs(norm) * 0.8})`;
                    ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
                    // Value
                    if (cellSize >= 20) {
                        ctx.fillStyle = Math.abs(norm) > 0.5 ? "#000" : "rgba(156,163,175,0.5)";
                        ctx.font = `${Math.min(9, cellSize * 0.35)}px Inter`; ctx.textAlign = "center";
                        ctx.fillText(v.toFixed(1), px + cellSize / 2, py + cellSize / 2 + 3);
                    }
                }
            }
            // Border
            ctx.strokeStyle = color + "40"; ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, cols * cellSize + 2, rows * cellSize + 2);
            // Label
            ctx.fillStyle = color; ctx.font = "bold 11px Inter"; ctx.textAlign = "center";
            ctx.fillText(label, x + cols * cellSize / 2, y - 8);
            ctx.fillStyle = "rgba(156,163,175,0.3)"; ctx.font = "9px Inter";
            ctx.fillText(`${rows}×${cols}`, x + cols * cellSize / 2, y + rows * cellSize + 14);
        };

        const cellSize = Math.min(35, (H - 80) / inputSize);
        const yOffset = 50;

        // Input
        drawGrid(input, 30, yOffset, cellSize, "INPUT", "#4cc9f0");

        // Arrow
        const arrowX1 = 30 + inputSize * cellSize + 15;
        ctx.beginPath(); ctx.moveTo(arrowX1, yOffset + inputSize * cellSize / 2);
        ctx.lineTo(arrowX1 + 30, yOffset + inputSize * cellSize / 2);
        ctx.strokeStyle = "rgba(156,163,175,0.2)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "9px Inter"; ctx.textAlign = "center";
        ctx.fillText("Conv2D", arrowX1 + 15, yOffset + inputSize * cellSize / 2 - 8);

        // Convolution output
        const convX = arrowX1 + 40;
        drawGrid(convOutput, convX, yOffset, cellSize, "CONV OUTPUT", kernels[kernel].color);

        // Pooling
        if (showPool && poolOutput && poolOutput.length > 0) {
            const arrowX2 = convX + convOutput[0].length * cellSize + 15;
            ctx.beginPath(); ctx.moveTo(arrowX2, yOffset + convOutput.length * cellSize / 2);
            ctx.lineTo(arrowX2 + 30, yOffset + convOutput.length * cellSize / 2);
            ctx.strokeStyle = "rgba(156,163,175,0.2)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "rgba(156,163,175,0.2)"; ctx.font = "9px Inter"; ctx.textAlign = "center";
            ctx.fillText("MaxPool", arrowX2 + 15, yOffset + convOutput.length * cellSize / 2 - 8);

            const poolX = arrowX2 + 40;
            drawGrid(poolOutput, poolX, yOffset, cellSize * 1.5, "POOL OUTPUT", "#ffc800");
        }

        // Kernel display
        const kx = W - 130, ky = yOffset;
        drawGrid(kern, kx, ky, 28, "KERNEL (3×3)", kernels[kernel].color);
    }, [kernel, stride, padding, showPool, genInput, convolve, maxPool, kernels, inputSize]);

    useEffect(() => {
        const c = convRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const outSize = Math.floor((inputSize + 2 * padding - 3) / stride) + 1;
    const pooledSize = showPool ? Math.floor(outSize / 2) : outSize;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={S.cardTitle}>CONVOLUTION PIPELINE</div>
                <div style={S.canvasWrap}>
                    <canvas ref={convRef} style={{ width: "100%", height: 400, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>KERNEL SELECT</div>
                    <select style={S.select} value={kernel} onChange={e => setKernel(e.target.value)}>
                        {Object.entries(kernels).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>
                    <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={S.label}>Stride</span><span style={S.val}>{stride}</span>
                        </div>
                        <input type="range" style={S.range} min={1} max={3} step={1} value={stride} onChange={e => setStride(+e.target.value)} />
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={S.label}>Padding</span><span style={S.val}>{padding}</span>
                        </div>
                        <input type="range" style={S.range} min={0} max={2} step={1} value={padding} onChange={e => setPadding(+e.target.value)} />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 10 }}>
                        <input type="checkbox" checked={showPool} onChange={e => setShowPool(e.target.checked)} />
                        <span style={{ ...S.label, margin: 0 }}>Show Max Pooling (2×2)</span>
                    </label>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>OUTPUT DIMENSIONS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Input", `${inputSize}×${inputSize}`], ["Conv Out", `${outSize}×${outSize}`], ["Pooled", `${pooledSize}×${pooledSize}`], ["Params", 3 * 3 + 1]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                    <div style={{ ...S.infoBox(), marginTop: 10, fontSize: 10 }}>
                        Out = ⌊(W − K + 2P) / S⌋ + 1<br />
                        = ⌊({inputSize} − 3 + 2·{padding}) / {stride}⌋ + 1 = {outSize}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>CNN CONCEPTS</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Convolution:</strong> Slide kernel → extract features<br />
                        <strong style={{ color: "#a855f7" }}>Stride:</strong> Step size of kernel movement<br />
                        <strong style={{ color: "#ffc800" }}>Pooling:</strong> Downsample → reduce parameters<br />
                        <strong style={{ color: "#ff3264" }}>Depth:</strong> Stack layers → hierarchical features
                    </div>
                </div>
            </div>
        </div>
    );
}
