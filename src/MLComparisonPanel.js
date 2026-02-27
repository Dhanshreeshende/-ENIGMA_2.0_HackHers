import React, { useState, useEffect, useRef } from 'react';
import { S, C } from './styles';

export const algorithmsData = [
    {
        id: "lr", name: "Linear Regression", icon: "📈",
        definition: "Predicts continuous values by fitting a straight line.",
        type: "Supervised", useCases: "Sales, Prices, Trends", advantages: "Fast, Highly Interpretable",
        disadvantages: "Assumes linearity, Outlier sensitive", interpretability: "High", trainingSpeed: "Very Fast",
        task_type: "Regression", best_data_size: "Small/Medium", predictionSpeed: "Very Fast", train_time_complexity: "O(d²n + d³)",
        predict_time_complexity: "O(d)", space_complexity: "O(d)", scalability_level: "High", dimensionality_handling: "Weak",
        noise_sensitivity: "High", requires_scaling: "Yes", assumptions: "Linearity", parallelizable: "Yes"
    },
    {
        id: "logr", name: "Logistic Regression", icon: "S",
        definition: "Predicts class probabilities using a sigmoid curve.",
        type: "Supervised", useCases: "Spam Detection, Binary Medical Dx", advantages: "Outputs probabilities, Fast",
        disadvantages: "Fails with non-linear bounds", interpretability: "High", trainingSpeed: "Very Fast",
        task_type: "Classification", best_data_size: "Small/Medium", predictionSpeed: "Very Fast", train_time_complexity: "O(nd)",
        predict_time_complexity: "O(d)", space_complexity: "O(d)", scalability_level: "High", dimensionality_handling: "Medium",
        noise_sensitivity: "Medium", requires_scaling: "Yes", assumptions: "Linear separability", parallelizable: "Yes"
    },
    {
        id: "dt", name: "Decision Tree", icon: "🌳",
        definition: "Splits data iteratively based on feature thresholds.",
        type: "Supervised", useCases: "Credit Scoring, Simple Rules", advantages: "No scaling needed, Interpretable",
        disadvantages: "Prone to Overfitting, Unstable", interpretability: "High", trainingSpeed: "Fast",
        task_type: "Classification", best_data_size: "Medium", predictionSpeed: "Fast", train_time_complexity: "O(mn log n)",
        predict_time_complexity: "O(log n)", space_complexity: "O(nodes)", scalability_level: "Moderate", dimensionality_handling: "Medium",
        noise_sensitivity: "High", requires_scaling: "No", assumptions: "None", parallelizable: "No"
    },
    {
        id: "rf", name: "Random Forest", icon: "🌲",
        definition: "Ensemble of decision trees voting on the outcome.",
        type: "Supervised", useCases: "Fraud Detection, Churn", advantages: "High accuracy, Handles missing data",
        disadvantages: "Black box, Computationally heavy", interpretability: "Low", trainingSpeed: "Slow",
        task_type: "Classification", best_data_size: "Medium/Large", predictionSpeed: "Medium", train_time_complexity: "O(k * mn log n)",
        predict_time_complexity: "O(k * log n)", space_complexity: "O(k * nodes)", scalability_level: "High", dimensionality_handling: "High",
        noise_sensitivity: "Low", requires_scaling: "No", assumptions: "None", parallelizable: "Yes"
    },
    {
        id: "svm", name: "SVM", icon: "⊘",
        definition: "Finds the hyper-plane maximizing margin between classes.",
        type: "Supervised", useCases: "Text Class., Image Recognition", advantages: "Effective in high-dims, Memory efficient",
        disadvantages: "Slow on large datasets", interpretability: "Medium", trainingSpeed: "Slow",
        task_type: "Classification", best_data_size: "Small/Medium", predictionSpeed: "Fast", train_time_complexity: "O(n²) to O(n³)",
        predict_time_complexity: "O(n_sv * d)", space_complexity: "O(n²)", scalability_level: "Low", dimensionality_handling: "Very High",
        noise_sensitivity: "High", requires_scaling: "Yes", assumptions: "None (with kernel)", parallelizable: "Difficult"
    },
    {
        id: "knn", name: "K-Nearest Neighbors", icon: "⊕",
        definition: "Predicts based on the 'K' closest data points in space.",
        type: "Supervised", useCases: "Recommender Systems", advantages: "Zero training phase, Intuitive",
        disadvantages: "Slow inference, Dimensionality curse", interpretability: "Medium", trainingSpeed: "Zero (Lazy)",
        task_type: "Classification", best_data_size: "Small", predictionSpeed: "Slow", train_time_complexity: "O(1)",
        predict_time_complexity: "O(nd)", space_complexity: "O(nd)", scalability_level: "Low", dimensionality_handling: "Low",
        noise_sensitivity: "High", requires_scaling: "Yes", assumptions: "Local similarity", parallelizable: "Yes"
    },
    {
        id: "nb", name: "Naive Bayes", icon: "📊",
        definition: "Probabilistic classifier based on Bayes' theorem.",
        type: "Supervised", useCases: "Text Classification, Sentiment", advantages: "Extremely fast, Works with small data",
        disadvantages: "Assumes features are independent", interpretability: "High", trainingSpeed: "Very Fast",
        task_type: "Classification", best_data_size: "Large", predictionSpeed: "Very Fast", train_time_complexity: "O(nd)",
        predict_time_complexity: "O(cd)", space_complexity: "O(cd)", scalability_level: "Very High", dimensionality_handling: "High",
        noise_sensitivity: "Low", requires_scaling: "No", assumptions: "Feature independence", parallelizable: "Yes"
    },
    {
        id: "nn", name: "Neural Network", icon: "◉",
        definition: "Layers of interconnected nodes mapping inputs to outputs.",
        type: "Supervised", useCases: "Computer Vision, NLP", advantages: "Handles complex non-linear data",
        disadvantages: "Needs high data volume, Compute intensive", interpretability: "Very Low", trainingSpeed: "Slowest",
        task_type: "Classification", best_data_size: "Very Large", predictionSpeed: "Fast (GPU)", train_time_complexity: "O(epochs * w * n)",
        predict_time_complexity: "O(w)", space_complexity: "O(w)", scalability_level: "Very High", dimensionality_handling: "Very High",
        noise_sensitivity: "Low", requires_scaling: "Yes", assumptions: "None", parallelizable: "Yes"
    },
    {
        id: "km", name: "K-Means", icon: "◎",
        definition: "Partitions data into K distinct non-overlapping clusters.",
        type: "Unsupervised", useCases: "Cust. Segmentation", advantages: "Fast, Scales well",
        disadvantages: "Sensitive to init, Assumes spherical clusters", interpretability: "Medium", trainingSpeed: "Fast",
        task_type: "Clustering", best_data_size: "Large", predictionSpeed: "Fast", train_time_complexity: "O(n*k*d*i)",
        predict_time_complexity: "O(k*d)", space_complexity: "O(k*d)", scalability_level: "High", dimensionality_handling: "Medium",
        noise_sensitivity: "High", requires_scaling: "Yes", assumptions: "Spherical clusters", parallelizable: "Yes"
    }
];

const Theme = {
    primary: "#7C3AED",
    bg: "#020617",
    bgSecondary: "#111827",
    textPrimary: "#E5E7EB",
    textSecondary: "#9CA3AF",
    border: "#1F2937",
    accentGlow: "rgba(124, 58, 237, 0.3)"
};

// --- MINI VISUALIZATION ENGINE ---
function MiniBoundaryViz({ algoId, width = 140, height = 140 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Background Grid
            ctx.strokeStyle = '#1F2937';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
            for (let i = 0; i < height; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

            // Decision regions
            const res = 4;
            for (let x = 0; x < width; x += res) {
                for (let y = 0; y < height; y += res) {
                    const nx = (x / width) * 2 - 1;
                    const ny = (y / height) * 2 - 1;
                    let prediction = 0;

                    if (algoId === 'lr' || algoId === 'logr') {
                        prediction = nx + ny > 0 ? 1 : 0;
                    } else if (algoId === 'dt') {
                        prediction = (nx > -0.2 && ny < 0.3) ? 1 : 0;
                    } else if (algoId === 'rf') {
                        prediction = (nx > -0.2 && ny < 0.3) || (nx < -0.6 && ny > 0.5) ? 1 : 0;
                    } else if (algoId === 'svm') {
                        prediction = (nx * nx + ny * ny < 0.4) ? 1 : 0;
                    } else if (algoId === 'knn') {
                        prediction = (Math.sin(nx * 5) + Math.cos(ny * 5) > 0) ? 1 : 0;
                    } else if (algoId === 'nb') {
                        prediction = (Math.exp(-(nx * nx + ny * ny)) > 0.6) ? 1 : 0;
                    } else if (algoId === 'nn') {
                        prediction = (Math.sin(nx * 3) * ny > 0.1 || nx * nx + ny * ny < 0.2) ? 1 : 0;
                    } else if (algoId === 'km') {
                        prediction = (nx < 0 && ny < 0) ? 0 : (nx > 0 && ny < 0) ? 1 : 2;
                    }

                    ctx.fillStyle = prediction === 1 ? 'rgba(99, 102, 241, 0.15)' : prediction === 2 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(31, 41, 55, 0.05)';
                    ctx.fillRect(x, y, res, res);
                }
            }

            // Sample points
            const points = [
                { x: 0.3, y: 0.4, c: 1 }, { x: -0.5, y: -0.2, c: 0 }, { x: 0.8, y: -0.1, c: 1 }, { x: -0.2, y: 0.7, c: 0 }
            ];
            points.forEach(p => {
                const px = (p.x + 1) / 2 * width;
                const py = (p.y + 1) / 2 * height;
                ctx.fillStyle = p.c === 1 ? '#6366F1' : '#4B5563';
                ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
            });

            // Label
            ctx.fillStyle = '#6B7280';
            ctx.font = '8px Inter';
            ctx.fillText(algoId.toUpperCase() + ' Boundary', 5, height - 5);
        };

        draw();
    }, [algoId]);

    return <canvas ref={canvasRef} style={{ width, height, borderRadius: 8, border: '1px solid #1F2937', background: '#020617' }} />;
}

// --- METRICS GENERATOR ---
const getPerformanceMetrics = (algoId) => {
    const base = {
        'lr': { acc: 0.82, pre: 0.80, rec: 0.81, f1: 0.80, time: '2ms' },
        'logr': { acc: 0.85, pre: 0.84, rec: 0.83, f1: 0.83, time: '3ms' },
        'dt': { acc: 0.88, pre: 0.86, rec: 0.87, f1: 0.86, time: '5ms' },
        'rf': { acc: 0.94, pre: 0.93, rec: 0.94, f1: 0.93, time: '45ms' },
        'svm': { acc: 0.91, pre: 0.90, rec: 0.91, f1: 0.90, time: '12ms' },
        'knn': { acc: 0.87, pre: 0.85, rec: 0.88, f1: 0.86, time: '80ms' },
        'nb': { acc: 0.80, pre: 0.78, rec: 0.82, f1: 0.80, time: '1ms' },
        'nn': { acc: 0.96, pre: 0.95, rec: 0.96, f1: 0.96, time: '250ms' },
        'km': { acc: 0.75, pre: 0.72, rec: 0.74, f1: 0.73, time: '15ms' },
    };
    return base[algoId] || base['lr'];
};

const Tooltip = ({ text, children }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: "relative", display: "inline-block", cursor: "help" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div style={{
                    position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                    background: Theme.textPrimary, padding: "8px 12px", borderRadius: 8, border: `1px solid ${Theme.textPrimary}`,
                    color: Theme.bg, fontSize: 10, whiteSpace: "nowrap", zIndex: 100,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: 8, fontFamily: "Inter, sans-serif",
                    pointerEvents: "none", fontWeight: 500
                }}>
                    {text}
                </div>
            )}
        </div>
    );
};

export default function MLComparisonPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(["lr", "dt"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState("theory"); // 'theory' or 'visual'

    const toggleSelection = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else {
            if (selected.length < 3) setSelected([...selected, id]);
        }
    };

    const filteredAlgorithms = algorithmsData.filter(algo =>
        algo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getVerdict = (algos) => {
        if (algos.length < 2) return null;
        const [a1, a2] = algos;
        const m1 = getPerformanceMetrics(a1.id);
        const m2 = getPerformanceMetrics(a2.id);

        const winner = m1.f1 > m2.f1 ? a1 : a2;
        const loser = m1.f1 > m2.f1 ? a2 : a1;

        return {
            winner,
            loser,
            reason: m1.f1 > m2.f1
                ? `${a1.name} shows superior pattern recognition (F1: ${m1.f1}) with a ${a1.disadvantages.toLowerCase().split(',')[0]} trade-off.`
                : `${a2.name} excels with ${m2.acc * 100}% accuracy, handling data complexity better than ${a1.name}.`,
            caution: `Use ${loser.name} instead if you prioritize ${loser.advantages.toLowerCase()} or have restricted compute budget.`
        };
    };

    return (
        <>
            <div onClick={() => setIsOpen(!isOpen)} style={{
                position: "fixed", left: 240, bottom: isOpen ? "min(600px, 85vh)" : 0,
                padding: "10px 24px", background: Theme.bg, border: `1px solid ${Theme.border}`, borderBottom: "none",
                borderRadius: "12px 12px 0 0", cursor: "pointer", color: Theme.primary, fontWeight: 700,
                fontFamily: "Inter, sans-serif", fontSize: 12, boxShadow: "0 -4px 10px rgba(0,0,0,0.1)", zIndex: 100,
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)"
            }}>
                {isOpen ? "▼ Close Lab" : "▲ Open Comparison Lab"}
            </div>

            <div style={{
                position: "fixed", left: 240, bottom: isOpen ? 0 : "-650px", height: "min(600px, 85vh)", width: 900,
                maxWidth: "calc(100vw - 240px)", background: Theme.bg, border: `1px solid ${Theme.border}`, borderBottom: "none",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.4)", transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", zIndex: 99,
                display: "flex", overflow: "hidden", borderRadius: "0 12px 0 0"
            }}>
                {/* Panel Sidebar */}
                <div style={{ width: 220, padding: "20px", background: Theme.bgSecondary, borderRight: `1px solid ${Theme.border}`, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: "0 0 16px 0", color: "#FFF", fontSize: 16, fontWeight: 800 }}>🔬 COMPARISON LAB</h3>

                    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                        <button onClick={() => setView('theory')} style={{ flex: 1, padding: "6px", fontSize: 10, borderRadius: 6, border: 'none', background: view === 'theory' ? Theme.primary : '#1F2937', color: 'white', cursor: 'pointer' }}>THEORY</button>
                        <button onClick={() => setView('visual')} style={{ flex: 1, padding: "6px", fontSize: 10, borderRadius: 6, border: 'none', background: view === 'visual' ? Theme.primary : '#1F2937', color: 'white', cursor: 'pointer' }}>VISUAL</button>
                    </div>

                    <input
                        type="text" placeholder="Search..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: "100%", background: "#020617", border: "1px solid #1F2937", padding: "8px", borderRadius: 8, color: "white", fontSize: 11, marginBottom: 12 }}
                    />

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filteredAlgorithms.map(algo => (
                            <div key={algo.id} onClick={() => toggleSelection(algo.id)} style={{
                                padding: "8px 12px", borderRadius: 8, fontSize: 11, cursor: 'pointer',
                                background: selected.includes(algo.id) ? Theme.primary + '20' : 'transparent',
                                border: `1px solid ${selected.includes(algo.id) ? Theme.primary : '#1F2937'}`,
                                color: selected.includes(algo.id) ? Theme.primary : '#9CA3AF',
                                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                            }}>
                                <span>{algo.icon}</span> {algo.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
                    {selected.length < 2 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: 14 }}>
                            Select at least 2 algorithms to compare performance visualizers.
                        </div>
                    ) : (
                        <div>
                            {/* Verdict Header */}
                            {(() => {
                                const v = getVerdict(selected.map(id => algorithmsData.find(a => a.id === id)));
                                return (
                                    <div style={{ background: '#7C3AED10', border: '1px solid #7C3AED30', borderRadius: 12, padding: '16px', marginBottom: 24 }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>⭐ Smart Verdict</div>
                                        <div style={{ color: Theme.textPrimary, fontSize: 13, marginBottom: 4 }}>
                                            <span style={{ color: Theme.purple, fontWeight: 700 }}>BETTER CHOICE:</span> {v.winner.name}
                                        </div>
                                        <div style={{ color: Theme.textSecondary, fontSize: 12, lineHeight: 1.5 }}>
                                            <strong>Why:</strong> {v.reason}<br />
                                            <span style={{ color: '#EF4444', opacity: 0.8 }}>⚠️ {v.caution}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {view === 'visual' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                                    {selected.slice(0, 2).map(id => {
                                        const a = algorithmsData.find(x => x.id === id);
                                        const m = getPerformanceMetrics(id);
                                        return (
                                            <div key={id} style={{ background: '#111827', borderRadius: 16, border: '1px solid #1F2937', padding: 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                                    <span style={{ fontSize: 24 }}>{a.icon}</span>
                                                    <span style={{ fontWeight: 800, color: '#FFF' }}>{a.name}</span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                                    <MiniBoundaryViz algoId={id} width={280} height={180} />
                                                </div>

                                                <div style={{ display: 'grid', gap: 10 }}>
                                                    {[
                                                        { label: 'ACCURACY', val: m.acc },
                                                        { label: 'F1-SCORE', val: m.f1 },
                                                        { label: 'RECALL', val: m.rec }
                                                    ].map(metric => (
                                                        <div key={metric.label}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6B7280', marginBottom: 4, fontWeight: 800 }}>
                                                                <span>{metric.label}</span>
                                                                <span>{Math.round(metric.val * 100)}%</span>
                                                            </div>
                                                            <div style={{ height: 4, background: '#1F2937', borderRadius: 2, overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${metric.val * 100}%`, background: Theme.primary }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: 10, color: '#6B7280' }}>LATENCY</span>
                                                        <span style={{ fontSize: 10, color: Theme.purple, fontWeight: 800 }}>{m.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${selected.length}, 1fr)`, gap: "10px" }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Factor</div>
                                    {selected.map(id => (
                                        <div key={id} style={{ textAlign: 'center', fontWeight: 900, color: '#FFF', fontSize: 12 }}>{algorithmsData.find(a => a.id === id).name}</div>
                                    ))}
                                    {[
                                        { key: 'definition', label: 'In a Nutshell' },
                                        { key: 'advantages', label: 'Main Strength' },
                                        { key: 'disadvantages', label: 'Weakness' },
                                        { key: 'train_time_complexity', label: 'Time Comp.' },
                                        { key: 'scalability_level', label: 'Scalability' }
                                    ].map(row => (
                                        <React.Fragment key={row.key}>
                                            <div style={{ padding: '12px 0', borderBottom: '1px solid #1F2937', color: '#9CA3AF', fontSize: 11, fontWeight: 600 }}>{row.label}</div>
                                            {selected.map(id => (
                                                <div key={id} style={{ padding: '12px 0', borderBottom: '1px solid #1F2937', color: '#E5E7EB', fontSize: 11, textAlign: 'center' }}>
                                                    {algorithmsData.find(a => a.id === id)[row.key]}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
