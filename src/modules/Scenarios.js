import { useState } from "react";
import { S, C } from "../styles";

const SCENARIOS = [
  {
    id: "s1", icon: "∇", title: "Why Learning Rate Matters",
    module: "Gradient Descent", difficulty: "Beginner",
    steps: [
      { title: "Start with default settings", body: "Set learning rate to 0.05 and momentum to 0.9. Use the Bowl (Convex) surface. Press Start and observe the ball smoothly converge to the minimum." },
      { title: "Try a very large learning rate", body: "Set learning rate to 0.45. Press Reset, then Start. Notice how the ball overshoots and oscillates or diverges — this is an unstable training process." },
      { title: "Try a very small learning rate", body: "Set learning rate to 0.005. Press Reset, then Start. The ball converges but extremely slowly — this is the vanishing gradient problem in action." },
      { title: "Explore the Saddle Point surface", body: "Switch to 'Saddle Point' surface with lr=0.05. Notice how gradient descent can get 'stuck' near the saddle — momentum helps escape it." },
    ],
    concept: "The learning rate α controls step size in parameter space. Too large → diverge. Too small → slow. Momentum β adds 'inertia' to escape local minima and saddle points.",
    formula: "θ ← θ − α ∇L(θ)",
  },
  {
    id: "s2", icon: "◉", title: "Building a Neural Network",
    module: "Neural Network", difficulty: "Intermediate",
    steps: [
      { title: "Start with XOR dataset", body: "XOR is not linearly separable. Select XOR dataset. A single-layer network cannot solve this — it requires at least one hidden layer." },
      { title: "Watch the decision boundary form", body: "Press Train and watch the decision boundary panel. Initially it will be random, but within a few hundred epochs it should classify correctly." },
      { title: "Try the Spiral dataset", body: "Spiral is harder. Reset and switch to 'Spiral'. You may need to add hidden layers (+Layer button) to achieve good accuracy on this complex dataset." },
      { title: "Experiment with activations", body: "Try switching from ReLU to Tanh or Sigmoid. Notice how this affects training speed and the shape of decision boundaries formed." },
    ],
    concept: "Neural networks are universal function approximators. Hidden layers create hierarchical representations. More layers = more capacity but harder to train.",
    formula: "ŷ = σ(W² · σ(W¹x + b¹) + b²)",
  },
  {
    id: "s3", icon: "〜", title: "Overfitting vs Underfitting",
    module: "Overfitting", difficulty: "Beginner",
    steps: [
      { title: "Start with degree 1", body: "Set polynomial degree to 1. The model is too simple — it fits a straight line and misses the sinusoidal pattern. This is underfitting (high bias)." },
      { title: "Find the sweet spot", body: "Increase degree to 4-5. The model now captures the true pattern without being too complex. Check both Train MSE and Test MSE — they should both be low." },
      { title: "Introduce overfitting", body: "Set degree to 10+. The model perfectly fits training data (low train MSE) but fails on test data (high test MSE). It memorized noise!" },
      { title: "See the bias-variance tradeoff", body: "Look at the Bias-Variance chart. Train error always decreases with complexity. Test error has a U-shape — too simple or too complex are both bad." },
    ],
    concept: "Models must generalize, not memorize. The bias-variance tradeoff shows we need the right model complexity. Regularization (L1/L2) helps control this.",
    formula: "Error = Bias² + Variance + Noise",
  },
  {
    id: "s4", icon: "⊕", title: "Understanding KNN",
    module: "K-Nearest Neighbors", difficulty: "Beginner",
    steps: [
      { title: "Add training data", body: "Click '+ Auto Fill' to generate clustered data. This creates 3 classes with natural groupings. Notice the Voronoi regions forming in the background." },
      { title: "Place a query point", body: "Switch to '⊕ Query' mode and click somewhere on the canvas. K nearest neighbors will be highlighted with rank numbers, and their connecting lines show distances." },
      { title: "Adjust K and observe", body: "Change K from 1 to 9. With K=1, the boundary is very jagged. With larger K, the boundary smooths out. Find the K that seems most reasonable." },
      { title: "Test boundary regions", body: "Click near class boundaries (where regions meet) and observe how votes split. A 2-1 vote is more confident than a 3-3 tie would be." },
    ],
    concept: "KNN is a lazy learner — no training needed. It relies on local geometry. K is a regularization parameter: K=1 overfits, K=n underfits. Distance metric matters!",
    formula: "ŷ = mode({y_i : i ∈ KNN(x)})",
  },
];

export default function Scenarios() {
  const [activeId, setActiveId] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  const active = SCENARIOS.find(s => s.id === activeId);

  const diffColor = d => d === "Beginner" ? "#7C3AED" : d === "Intermediate" ? "#ffc800" : "#ff3264";

  return (
    <div style={{ display: "grid", gridTemplateColumns: activeId ? "280px 1fr" : "1fr 1fr", gap: 16 }}>
      {/* Scenario list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={S.card}>
          <div style={S.cardTitle}>GUIDED LEARNING PATHS</div>
          <div style={{ ...S.infoBox(), fontSize: 10, marginBottom: 14 }}>
            Step-by-step scenarios to build intuition about core ML concepts. Follow the instructions in each module.
          </div>
        </div>
        {SCENARIOS.map(sc => (
          <div key={sc.id} onClick={() => { setActiveId(sc.id); setStepIdx(0); }} style={{
            ...S.card, cursor: "pointer", transition: "all 0.2s",
            borderColor: activeId === sc.id ? "rgba(124,58,237,0.4)" : C.border,
            background: activeId === sc.id ? "rgba(124,58,237,0.06)" : C.surface,
            transform: activeId === sc.id ? "translateX(3px)" : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.1)", border: `1px solid rgba(124,58,237,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.accent }}>{sc.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>{sc.title}</div>
                  <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>{sc.module}</div>
                </div>
              </div>
              <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 10, background: diffColor(sc.difficulty) + "18", color: diffColor(sc.difficulty), fontFamily: "Inter, sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{sc.difficulty}</span>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>{sc.steps.length} guided steps</div>
          </div>
        ))}
      </div>

      {/* Scenario detail */}
      {active && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={S.cardTitle}>{active.title}</span>
              <button style={{ ...S.btn("secondary"), fontSize: 10 }} onClick={() => setActiveId(null)}>✕ Close</button>
            </div>
            <div style={{ ...S.infoBox(), marginBottom: 16, fontSize: 11 }}>
              <strong style={{ color: C.accent }}>Navigate to:</strong> {active.module} module in the sidebar, then follow these steps.
            </div>

            {/* Step progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {active.steps.map((_, i) => (
                <div key={i} onClick={() => setStepIdx(i)} style={{
                  flex: 1, height: 4, borderRadius: 2, cursor: "pointer", transition: "all 0.2s",
                  background: i <= stepIdx ? C.accent : "rgba(156,163,175,0.1)",
                  boxShadow: i === stepIdx ? `0 0 8px ${C.accent}` : "none",
                }} />
              ))}
            </div>

            {/* Current step */}
            <div style={{ ...S.card, background: C.surfaceDeep, borderColor: "rgba(124,58,237,0.2)", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: `1px solid rgba(124,58,237,0.4)`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, flexShrink: 0, fontFamily: "Inter" }}>{stepIdx + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{active.steps[stepIdx].title}</div>
                  <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.8 }}>{active.steps[stepIdx].body}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btn("secondary"), flex: 1 }} disabled={stepIdx === 0} onClick={() => setStepIdx(i => i - 1)}>← Previous</button>
              {stepIdx < active.steps.length - 1
                ? <button style={{ ...S.btn("primary"), flex: 1 }} onClick={() => setStepIdx(i => i + 1)}>Next Step →</button>
                : <button style={{ ...S.btn("primary"), flex: 1 }} onClick={() => setStepIdx(0)}>↺ Restart</button>
              }
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>KEY CONCEPT</div>
            <div style={{ ...S.infoBox(), fontSize: 11, lineHeight: 1.9, marginBottom: 14 }}>{active.concept}</div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.accent, textAlign: "center", padding: "12px", background: C.surfaceDeep, borderRadius: 7, border: `1px solid rgba(124,58,237,0.15)`, letterSpacing: 1 }}>
              {active.formula}
            </div>
          </div>

          {/* All steps overview */}
          <div style={S.card}>
            <div style={S.cardTitle}>ALL STEPS</div>
            {active.steps.map((step, i) => (
              <div key={i} onClick={() => setStepIdx(i)} style={{
                display: "flex", gap: 12, padding: "10px", marginBottom: 6,
                borderRadius: 7, cursor: "pointer", transition: "all 0.2s",
                background: i === stepIdx ? "rgba(124,58,237,0.06)" : "transparent",
                border: `1px solid ${i === stepIdx ? "rgba(124,58,237,0.2)" : "transparent"}`,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: i < stepIdx ? C.accent : i === stepIdx ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)", color: i < stepIdx ? "#000" : i === stepIdx ? C.accent : C.textMuted, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i < stepIdx ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: 11, color: i === stepIdx ? C.text : C.textMuted }}>{step.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
