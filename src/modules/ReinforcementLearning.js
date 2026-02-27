import { useState, useEffect, useRef, useCallback } from "react";
import { S, C } from "../styles";
import { rand } from "../utils";

const GRID_SIZE = 8;
const ACTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
const ACTION_NAMES = ["↑", "↓", "←", "→"];

export default function ReinforcementLearning() {
    const canvasRef = useRef(null);
    const [qTable, setQTable] = useState(() => Array.from({ length: GRID_SIZE * GRID_SIZE }, () => [0, 0, 0, 0]));
    const [agent, setAgent] = useState({ r: 0, c: 0 });
    const [goal, setGoal] = useState({ r: GRID_SIZE - 1, c: GRID_SIZE - 1 });
    const [walls, setWalls] = useState(new Set(["2,2", "2,3", "2,4", "3,4", "5,1", "5,2", "6,5", "4,6"]));
    const [traps, setTraps] = useState(new Set(["1,5", "4,2", "6,3"]));
    const [lr, setLr] = useState(0.1);
    const [gamma, setGamma] = useState(0.95);
    const [epsilon, setEpsilon] = useState(0.2);
    const [episodes, setEpisodes] = useState(0);
    const [totalReward, setTotalReward] = useState(0);
    const [running, setRunning] = useState(false);
    const [speed, setSpeed] = useState(50);
    const stateRef = useRef({ q: null, running: false });

    useEffect(() => { stateRef.current.q = qTable; }, [qTable]);
    useEffect(() => { stateRef.current.running = running; }, [running]);

    const stateIdx = (r, c) => r * GRID_SIZE + c;
    const isWall = (r, c) => walls.has(`${r},${c}`);
    const isTrap = (r, c) => traps.has(`${r},${c}`);
    const isGoal = (r, c) => r === goal.r && c === goal.c;

    const getReward = (r, c) => {
        if (isGoal(r, c)) return 100;
        if (isTrap(r, c)) return -50;
        return -1;
    };

    const step = useCallback((q, pos) => {
        // Epsilon-greedy action selection
        let action;
        if (Math.random() < epsilon) {
            action = Math.floor(Math.random() * 4);
        } else {
            const s = stateIdx(pos.r, pos.c);
            action = q[s].indexOf(Math.max(...q[s]));
        }

        let nr = pos.r + ACTIONS[action][0];
        let nc = pos.c + ACTIONS[action][1];
        if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isWall(nr, nc)) {
            nr = pos.r; nc = pos.c;
        }

        const reward = getReward(nr, nc);
        const s = stateIdx(pos.r, pos.c);
        const ns = stateIdx(nr, nc);
        const maxNextQ = Math.max(...q[ns]);
        const newQ = [...q.map(a => [...a])];
        newQ[s][action] = q[s][action] + lr * (reward + gamma * maxNextQ - q[s][action]);

        return { q: newQ, pos: { r: nr, c: nc }, reward, done: isGoal(nr, nc) || isTrap(nr, nc) };
    }, [epsilon, lr, gamma, goal, walls, traps]);

    const runEpisode = useCallback(() => {
        let q = stateRef.current.q || qTable;
        let pos = { r: 0, c: 0 };
        let totalR = 0;
        for (let i = 0; i < 200; i++) {
            const result = step(q, pos);
            q = result.q; pos = result.pos; totalR += result.reward;
            if (result.done) break;
        }
        return { q, totalR };
    }, [qTable, step]);

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            let q = stateRef.current.q;
            let totalR = 0;
            for (let ep = 0; ep < speed; ep++) {
                let pos = { r: 0, c: 0 };
                for (let i = 0; i < 200; i++) {
                    const result = step(q, pos);
                    q = result.q; pos = result.pos; totalR += result.reward;
                    if (result.done) break;
                }
            }
            setQTable(q);
            stateRef.current.q = q;
            setEpisodes(e => e + speed);
            setTotalReward(totalR / speed);
        }, 100);
        return () => clearInterval(timer);
    }, [running, speed, step]);

    // Animate agent following policy
    const [animating, setAnimating] = useState(false);
    const animateAgent = useCallback(() => {
        setAnimating(true);
        let pos = { r: 0, c: 0 };
        setAgent(pos);
        let steps = 0;
        const timer = setInterval(() => {
            const s = stateIdx(pos.r, pos.c);
            const q = stateRef.current.q;
            const action = q[s].indexOf(Math.max(...q[s]));
            let nr = pos.r + ACTIONS[action][0];
            let nc = pos.c + ACTIONS[action][1];
            if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isWall(nr, nc)) { nr = pos.r; nc = pos.c; }
            pos = { r: nr, c: nc };
            setAgent({ ...pos });
            steps++;
            if (isGoal(nr, nc) || isTrap(nr, nc) || steps > 100) {
                clearInterval(timer); setAnimating(false);
            }
        }, 200);
    }, [goal]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const cellW = W / GRID_SIZE, cellH = H / GRID_SIZE;

        // Cells
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const x = c * cellW, y = r * cellH;
                if (isWall(r, c)) { ctx.fillStyle = "#1a1a2e"; ctx.fillRect(x, y, cellW, cellH); continue; }
                // Q-value heatmap
                const s = stateIdx(r, c);
                const maxQ = Math.max(...qTable[s]);
                const norm = Math.min(1, Math.max(0, (maxQ + 50) / 150));
                if (isGoal(r, c)) ctx.fillStyle = "rgba(124,58,237,0.3)";
                else if (isTrap(r, c)) ctx.fillStyle = "rgba(255,50,100,0.2)";
                else ctx.fillStyle = `rgba(124,58,237,${norm * 0.15})`;
                ctx.fillRect(x, y, cellW, cellH);

                // Grid line
                ctx.strokeStyle = "rgba(124,58,237,0.08)"; ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cellW, cellH);

                // Action arrows
                if (!isGoal(r, c) && !isTrap(r, c) && episodes > 0) {
                    const bestA = qTable[s].indexOf(Math.max(...qTable[s]));
                    const arrowX = x + cellW / 2, arrowY = y + cellH / 2;
                    const dx = ACTIONS[bestA][1] * cellW * 0.25, dy = ACTIONS[bestA][0] * cellH * 0.25;
                    ctx.beginPath(); ctx.moveTo(arrowX - dx * 0.3, arrowY - dy * 0.3);
                    ctx.lineTo(arrowX + dx, arrowY + dy);
                    ctx.strokeStyle = `rgba(124,58,237,${Math.min(0.8, norm * 1.5)})`; ctx.lineWidth = 2; ctx.stroke();
                    // Arrowhead
                    const angle = Math.atan2(dy, dx);
                    ctx.beginPath(); ctx.moveTo(arrowX + dx, arrowY + dy);
                    ctx.lineTo(arrowX + dx - 6 * Math.cos(angle - 0.4), arrowY + dy - 6 * Math.sin(angle - 0.4));
                    ctx.lineTo(arrowX + dx - 6 * Math.cos(angle + 0.4), arrowY + dy - 6 * Math.sin(angle + 0.4));
                    ctx.closePath(); ctx.fillStyle = `rgba(124,58,237,${Math.min(0.8, norm * 1.5)})`; ctx.fill();
                }

                // Labels
                if (isGoal(r, c)) {
                    ctx.fillStyle = "#7C3AED"; ctx.font = `bold ${Math.min(cellW, cellH) * 0.4}px Inter`; ctx.textAlign = "center";
                    ctx.fillText("⭐", x + cellW / 2, y + cellH / 2 + 5);
                }
                if (isTrap(r, c)) {
                    ctx.fillStyle = "#ff3264"; ctx.font = `${Math.min(cellW, cellH) * 0.35}px Inter`; ctx.textAlign = "center";
                    ctx.fillText("💀", x + cellW / 2, y + cellH / 2 + 5);
                }
            }
        }

        // Agent
        const ax = agent.c * cellW + cellW / 2, ay = agent.r * cellH + cellH / 2;
        ctx.shadowBlur = 15; ctx.shadowColor = "#ffc800";
        ctx.beginPath(); ctx.arc(ax, ay, Math.min(cellW, cellH) * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "#ffc800"; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = "#000"; ctx.font = `bold ${Math.min(cellW, cellH) * 0.2}px Inter`; ctx.textAlign = "center";
        ctx.fillText("🤖", ax, ay + 4);
    }, [qTable, agent, episodes, goal, walls, traps]);

    useEffect(() => {
        const c = canvasRef.current; if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
        draw();
    }, []);

    useEffect(() => { draw(); }, [draw]);

    const reset = () => {
        setQTable(Array.from({ length: GRID_SIZE * GRID_SIZE }, () => [0, 0, 0, 0]));
        setAgent({ r: 0, c: 0 }); setEpisodes(0); setTotalReward(0); setRunning(false);
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
            <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={S.cardTitle}>Q-LEARNING GRID WORLD</span>
                    <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
                        🤖 Agent → ⭐ Goal | 💀 Traps | ■ Walls
                    </span>
                </div>
                <div style={S.canvasWrap}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 420, display: "block" }} />
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={S.card}>
                    <div style={S.cardTitle}>Q-LEARNING PARAMS</div>
                    {[["Learning Rate (α)", lr, 0.01, 0.5, 0.01, setLr],
                    ["Discount (γ)", gamma, 0.5, 0.99, 0.01, setGamma],
                    ["Exploration (ε)", epsilon, 0, 1, 0.05, setEpsilon]].map(([l, v, min, max, step, set]) => (
                        <div key={l} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={S.label}>{l}</span><span style={S.val}>{v.toFixed(2)}</span>
                            </div>
                            <input type="range" style={S.range} min={min} max={max} step={step} value={v} onChange={e => set(+e.target.value)} />
                        </div>
                    ))}
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={S.label}>Speed (eps/tick)</span><span style={S.val}>{speed}</span>
                        </div>
                        <input type="range" style={S.range} min={1} max={200} step={1} value={speed} onChange={e => setSpeed(+e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ ...S.btn(running ? "danger" : "primary"), flex: 1 }} onClick={() => setRunning(r => !r)}>{running ? "⏸ Stop" : "▶ Train"}</button>
                        <button style={S.btn("secondary")} onClick={animateAgent} disabled={animating}>👁</button>
                        <button style={S.btn("danger")} onClick={reset}>↺</button>
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>METRICS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Episodes", episodes], ["Avg Reward", totalReward.toFixed(1)], ["ε", epsilon.toFixed(2)], ["γ", gamma.toFixed(2)]].map(([l, v]) => (
                            <div key={l} style={S.metric}><span style={S.metricVal}>{v}</span><span style={S.metricLabel}>{l}</span></div>
                        ))}
                    </div>
                </div>
                <div style={S.card}>
                    <div style={S.cardTitle}>Q-LEARNING</div>
                    <div style={{ ...S.infoBox(), fontSize: 10, lineHeight: 1.9 }}>
                        <strong style={{ color: C.accent }}>Bellman:</strong> Q(s,a) ← Q + α[r + γ·max Q(s') − Q]<br />
                        <strong style={{ color: "#ffc800" }}>ε-greedy:</strong> Explore random vs exploit best<br />
                        <strong style={{ color: "#a855f7" }}>γ:</strong> Value future rewards (0=myopic, 1=far-sighted)<br />
                        <strong style={{ color: "#ff3264" }}>Goal:</strong> Learn optimal policy π*
                    </div>
                </div>
            </div>
        </div>
    );
}
