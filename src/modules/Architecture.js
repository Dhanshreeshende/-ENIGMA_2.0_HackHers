import { S, C } from "../styles";

const Node = ({ label, sub, color = C.accent, icon }) => (
  <div style={{ textAlign: "center", padding: "14px 16px", borderRadius: 10, background: C.surfaceDeep, border: `1px solid ${color}40`, minWidth: 110, position: "relative" }}>
    {icon && <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>}
    <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1, fontFamily: "Inter" }}>{label}</div>
    {sub && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{sub}</div>}
  </div>
);

const Arrow = ({ label, vertical }) => (
  <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", gap: 4, padding: vertical ? "6px 0" : "0 6px" }}>
    {!vertical && <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${C.accent}50, transparent)` }} />}
    {vertical && <div style={{ width: 1, flex: 1, background: `linear-gradient(to bottom, transparent, ${C.accent}50, transparent)` }} />}
    <span style={{ fontSize: 9, color: C.textMuted, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{label}</span>
    {!vertical && <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.accent}50, transparent)` }} />}
    {vertical && <div style={{ width: 1, flex: 1, background: `linear-gradient(to bottom, ${C.accent}50, transparent)` }} />}
  </div>
);

export default function Architecture() {
  const modules = [
    { icon: "∇", label: "Gradient Descent", desc: "Loss landscape visualization, ball animation, momentum dynamics, real-time parameter tuning", color: "#7C3AED" },
    { icon: "◉", label: "Neural Network", desc: "Forward/backward pass visualization, weight rendering, decision boundary & loss charts, configurable architecture", color: "#a855f7" },
    { icon: "⬡", label: "Decision Boundary", desc: "Interactive point placement, multi-class classifiers (logistic, polynomial, RBF, KNN), boundary heatmap", color: "#4cc9f0" },
    { icon: "⊕", label: "K-Nearest Neighbors", desc: "Voronoi regions, animated K-neighbor selection, real-time vote bars, distance visualization", color: "#ffc800" },
    { icon: "〜", label: "Overfitting", desc: "Polynomial degree control, bias-variance tradeoff chart, train/test MSE metrics, noise injection", color: "#ff3264" },
    { icon: "📚", label: "Guided Scenarios", desc: "Step-by-step learning paths, concept explanations, formula references, difficulty levels", color: "#00d4ff" },
  ];

  const techStack = [
    ["React 18", "UI Framework", "#61dafb"],
    ["Canvas API", "All Visualizations", "#f7df1e"],
    ["Inter, sans-serif", "Typography", "#a855f7"],
    ["Inter", "Display Font", "#7C3AED"],
    ["Pure JS", "ML Algorithms", "#ff3264"],
    ["60fps RAF", "Animation Loop", "#ffc800"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Pipeline diagram */}
      <div style={S.card}>
        <div style={S.cardTitle}>SIMULATION PIPELINE ARCHITECTURE</div>
        <div style={{ overflowX: "auto", padding: "8px 0" }}>
          {/* Top level */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <Node label="USER INPUT" sub="Parameters / Clicks" icon="🖱" />
            <Arrow label="events →" />
            <Node label="REACT STATE" sub="useState / useRef" color="#61dafb" icon="⚛" />
            <Arrow label="triggers →" />
            <Node label="ML ENGINE" sub="Pure JS algorithms" color="#ffc800" icon="⚙" />
            <Arrow label="outputs →" />
            <Node label="CANVAS 2D" sub="requestAnimationFrame" color="#a855f7" icon="🖼" />
          </div>

          {/* Second level */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Loss Surface", color: "#7C3AED", items: ["Heatmap render", "Ball physics", "Gradient arrow", "Trail history"] },
              { label: "Neural Network", color: "#a855f7", items: ["Weight matrix viz", "Activation fns", "Backpropagation", "Accuracy metric"] },
              { label: "Classifiers", color: "#4cc9f0", items: ["Logistic regr.", "Polynomial feat.", "RBF kernel", "KNN voting"] },
              { label: "Overfitting", color: "#ff3264", items: ["Polynomial fit", "MSE metrics", "Bias-variance", "Data generator"] },
            ].map(col => (
              <div key={col.label} style={{ ...S.card, minWidth: 160, background: C.surfaceDeep, borderColor: col.color + "30" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: col.color, letterSpacing: 1, fontFamily: "Inter", marginBottom: 10 }}>{col.label}</div>
                {col.items.map(item => (
                  <div key={item} style={{ fontSize: 10, color: C.textMuted, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules grid */}
      <div style={S.card}>
        <div style={S.cardTitle}>LEARNING MODULES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {modules.map(m => (
            <div key={m.label} style={{ padding: "14px", borderRadius: 8, background: C.surfaceDeep, border: `1px solid ${m.color}25`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: m.color + "15", border: `1px solid ${m.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: m.color, fontFamily: "Inter", letterSpacing: 0.5 }}>{m.label}</div>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.7 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>TECH STACK</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {techStack.map(([name, role, color]) => (
              <div key={name} style={{ padding: "10px", background: C.surfaceDeep, borderRadius: 7, border: `1px solid ${color}25` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "Inter", marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>{role}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardTitle}>KEY FEATURES</div>
          {[
            ["Zero backend", "Pure client-side computation. No server needed.", C.accent],
            ["60fps animation", "requestAnimationFrame loop for smooth rendering.", "#ffc800"],
            ["No dependencies", "Only React + React-DOM. All ML coded from scratch.", "#a855f7"],
            ["Real algorithms", "Logistic regression, backprop, KNN, polynomial fit.", "#4cc9f0"],
            ["Interactive", "Live parameter sliders, canvas click interactions.", "#ff3264"],
          ].map(([label, desc, color]) => (
            <div key={label} style={{ display: "flex", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 4 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
