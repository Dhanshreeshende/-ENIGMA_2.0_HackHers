import { useState, useEffect, useRef } from "react";
import { S, C } from "./styles";

// ── EXISTING MODULES ──
import GradientDescent from "./modules/GradientDescent";
import NeuralNet from "./modules/NeuralNet";
import DecisionBoundary from "./modules/DecisionBoundary";
import KNNViz from "./modules/KNNViz";
import OverfittingViz from "./modules/OverfittingViz";
import Scenarios from "./modules/Scenarios";
import Architecture from "./modules/Architecture";

// ── NEW MODULES ──
import LinearRegression from "./modules/LinearRegression";
import SVMViz from "./modules/SVMViz";
import DecisionTreeViz from "./modules/DecisionTreeViz";
import NaiveBayesViz from "./modules/NaiveBayesViz";
import KMeansViz from "./modules/KMeansViz";
import DBSCANViz from "./modules/DBSCANViz";
import PCAViz from "./modules/PCAViz";
import ActivationFunctions from "./modules/ActivationFunctions";
import LossFunctions from "./modules/LossFunctions";
import RegularizationViz from "./modules/RegularizationViz";
import ConfusionMatrixViz from "./modules/ConfusionMatrixViz";
import CrossValidationViz from "./modules/CrossValidationViz";
import FeatureScalingViz from "./modules/FeatureScalingViz";
import CNNViz from "./modules/CNNViz";
import GradientBoostingViz from "./modules/GradientBoostingViz";
import ReinforcementLearning from "./modules/ReinforcementLearning";
import MLComparisonPanel from "./MLComparisonPanel";
import MLAssistant from "./MLAssistant";

const CATEGORIES = [
  {
    name: "REGRESSION",
    modules: [
      { id: "lr", label: "Linear Regression", icon: "📈", component: LinearRegression, desc: "Fit a line to data. Visualize residuals, R² score, and the normal equation in action.", tag: "SUPERVISED" },
      { id: "gd", label: "Gradient Descent", icon: "∇", component: GradientDescent, desc: "Watch gradient descent navigate a 3D loss surface. Tune learning rate & momentum in real-time.", tag: "OPTIMIZATION" },
    ],
  },
  {
    name: "CLASSIFICATION",
    modules: [
      { id: "db", label: "Decision Boundary", icon: "⬡", component: DecisionBoundary, desc: "Place points and classify with logistic regression, polynomial kernels, RBF, or KNN.", tag: "MULTI-CLASS" },
      { id: "svm", label: "SVM", icon: "⊘", component: SVMViz, desc: "Support Vector Machine with linear, RBF, and polynomial kernels. See margin and support vectors.", tag: "KERNEL" },
      { id: "dt", label: "Decision Tree", icon: "🌳", component: DecisionTreeViz, desc: "Build a decision tree with Gini splitting. Visualize the tree structure and decision regions.", tag: "TREE-BASED" },
      { id: "nb", label: "Naive Bayes", icon: "📊", component: NaiveBayesViz, desc: "Gaussian Naive Bayes classifier. See posterior probabilities and class-conditional distributions.", tag: "PROBABILISTIC" },
      { id: "knn", label: "K-Nearest Neighbors", icon: "⊕", component: KNNViz, desc: "Place points and query. KNN votes on classification using K nearest neighbors.", tag: "INSTANCE-BASED" },
    ],
  },
  {
    name: "CLUSTERING",
    modules: [
      { id: "km", label: "K-Means", icon: "◎", component: KMeansViz, desc: "Step-by-step K-Means with animated centroids, Voronoi regions, and convergence detection.", tag: "PARTITION" },
      { id: "dbs", label: "DBSCAN", icon: "◉", component: DBSCANViz, desc: "Density-based clustering. Adjust ε and minPts to find clusters of arbitrary shape.", tag: "DENSITY" },
    ],
  },
  {
    name: "DIM. REDUCTION",
    modules: [
      { id: "pca", label: "PCA", icon: "⟐", component: PCAViz, desc: "Principal Component Analysis. See eigenvectors, variance explained, and data projections.", tag: "LINEAR" },
    ],
  },
  {
    name: "DEEP LEARNING",
    modules: [
      { id: "nn", label: "Neural Network", icon: "◉", component: NeuralNet, desc: "Build and train a neural network. Modify architecture, activations, and watch decision boundaries form.", tag: "MLP" },
      { id: "cnn", label: "CNN Visualizer", icon: "▦", component: CNNViz, desc: "See convolution, stride, padding, and pooling operations step by step with real kernels.", tag: "CONVOLUTIONS" },
      { id: "af", label: "Activation Functions", icon: "ƒ", component: ActivationFunctions, desc: "Compare ReLU, Sigmoid, Tanh, Swish, GELU and more. Toggle derivatives for backprop insight.", tag: "NONLINEARITY" },
      { id: "lf", label: "Loss Functions", icon: "𝕃", component: LossFunctions, desc: "Compare MSE, MAE, Huber, Cross-Entropy side by side. Adjust true value and see behavior.", tag: "OBJECTIVES" },
    ],
  },
  {
    name: "ENSEMBLE",
    modules: [
      { id: "gb", label: "Gradient Boosting", icon: "⇈", component: GradientBoostingViz, desc: "Watch weak learners combine sequentially. See how each tree corrects the previous errors.", tag: "BOOSTING" },
    ],
  },
  {
    name: "REGULARIZATION",
    modules: [
      { id: "reg", label: "L1 / L2 Regularization", icon: "λ", component: RegularizationViz, desc: "Compare Ridge vs Lasso. See how λ controls weight magnitudes and prevents overfitting.", tag: "PENALTY" },
      { id: "of", label: "Overfitting", icon: "〜", component: OverfittingViz, desc: "Slide polynomial degree and witness underfitting → good fit → overfitting. Bias-variance tradeoff.", tag: "GENERALIZATION" },
    ],
  },
  {
    name: "EVALUATION",
    modules: [
      { id: "cm", label: "Confusion Matrix", icon: "▣", component: ConfusionMatrixViz, desc: "Interactive confusion matrix with ROC curve, precision, recall, F1, and AUC metrics.", tag: "METRICS" },
      { id: "cv", label: "Cross Validation", icon: "⟳", component: CrossValidationViz, desc: "Visualize K-Fold cross-validation. See how data splits across folds and accuracy variance.", tag: "VALIDATION" },
      { id: "fs", label: "Feature Scaling", icon: "⇕", component: FeatureScalingViz, desc: "Before/after comparison of StandardScaler, MinMaxScaler, and RobustScaler.", tag: "PREPROCESSING" },
    ],
  },
  {
    name: "REINFORCEMENT",
    modules: [
      { id: "rl", label: "Q-Learning", icon: "🤖", component: ReinforcementLearning, desc: "Train an agent with Q-Learning in a grid world. Watch it learn to navigate to the goal.", tag: "RL" },
    ],
  },
  {
    name: "LEARNING",
    modules: [
      { id: "sc", label: "Guided Scenarios", icon: "📚", component: Scenarios, desc: "Step-by-step learning scenarios designed to build ML intuition from first principles.", tag: "TUTORIALS" },
      { id: "arch", label: "Architecture", icon: "⬡", component: Architecture, desc: "System architecture, simulation pipeline, and technical documentation for this ML Sandbox.", tag: "DOCS" },
    ],
  },
];

const ALL_MODULES = CATEGORIES.flatMap(cat => cat.modules);

// Animated background grid
function BgGrid() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        animation: "gridDrift 30s linear infinite",
      }} />
      <style>{`
        @keyframes gridDrift { from { transform: translate(0, 0); } to { transform: translate(60px, 60px); } }
        @keyframes pulseGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scanline { from { top: -2px; } to { top: 100%; } }
      `}</style>
    </div>
  );
}

// Status indicator
function StatusDot({ color = C.accent, label = "READY" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}`, animation: "pulseGlow 2s infinite" }} />
      <span style={{ fontSize: 10, color: "rgba(156,163,175,0.45)", fontFamily: "Inter, sans-serif", letterSpacing: 1 }}>{label}</span>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("lr");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef(null);

  const mod = ALL_MODULES.find(m => m.id === active) || ALL_MODULES[0];
  const ActiveModule = mod.component;

  // Scroll to top on module change
  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, [active]);

  const filteredCategories = searchQuery
    ? CATEGORIES.map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tag.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })).filter(cat => cat.modules.length > 0)
    : CATEGORIES;

  return (
    <div style={S.app}>
      <BgGrid />

      {/* Sidebar */}
      <aside style={{
        ...S.sidebar,
        width: sidebarOpen ? 240 : 60,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={S.logo}>
          <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0, animation: "spin 12s linear infinite" }}>
            <circle cx="14" cy="14" r="12" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
            <polygon points="14,5 22,19 6,19" fill="#7C3AED" opacity="0.4" />
            <circle cx="14" cy="14" r="3.5" fill="#7C3AED" />
          </svg>
          {sidebarOpen && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <span style={{ color: C.accent }}>ML</span>
              <span style={{ color: C.text }}>Sandbox</span>
              <span style={{ fontSize: 8, color: C.textMuted, marginLeft: 4, verticalAlign: "super" }}>PRO</span>
            </div>
          )}
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div style={{ padding: "8px 12px" }}>
            <input
              type="text"
              placeholder="🔍 Search algorithms..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 6,
                background: "#1F2937", border: `1px solid ${C.border}`,
                color: C.text, fontFamily: "Inter, sans-serif", fontSize: 10,
                outline: "none",
              }}
            />
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 0", overflowY: "auto", overflowX: "hidden" }}>
          {filteredCategories.map(cat => (
            <div key={cat.name}>
              {sidebarOpen && <div style={S.navSection}>{cat.name}</div>}
              {!sidebarOpen && <div style={{ height: 4 }} />}
              {cat.modules.map(m => (
                <div key={m.id} style={S.navItem(active === m.id)} onClick={() => setActive(m.id)} title={m.label}>
                  <div style={S.navIcon(active === m.id)}>{m.icon}</div>
                  {sidebarOpen && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 11 }}>{m.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, fontSize: 8, color: "rgba(156,163,175,0.2)", fontFamily: "Inter, sans-serif", lineHeight: 1.8 }}>
            {ALL_MODULES.length} Modules · Pure JS<br />
            60fps Canvas · Zero Backend
          </div>
        )}

        {/* Collapse button */}
        <div onClick={() => setSidebarOpen(o => !o)} style={{ padding: "10px", cursor: "pointer", textAlign: "center", color: C.textMuted, fontSize: 12, borderTop: `1px solid ${C.border}`, transition: "color 0.2s" }}>
          {sidebarOpen ? "◀" : "▶"}
        </div>
      </aside>

      {/* Main */}
      <div style={S.main}>
        {/* Topbar */}
        <header style={S.topbar}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: 2, color: C.accent, fontFamily: "Inter" }}>{mod.label}</div>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: "Inter, sans-serif", marginTop: 2, letterSpacing: 1 }}>{mod.tag}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 6, marginRight: 12 }}>
            {CATEGORIES.slice(0, 5).map(cat => (
              <div key={cat.name} style={{
                fontSize: 8, padding: "3px 6px", borderRadius: 4,
                background: cat.modules.some(m => m.id === active) ? C.accent + "20" : "transparent",
                color: cat.modules.some(m => m.id === active) ? C.accent : C.textMuted,
                fontFamily: "Inter, sans-serif", cursor: "pointer", letterSpacing: 0.5,
              }} onClick={() => setActive(cat.modules[0].id)}>
                {cat.name}
              </div>
            ))}
          </div>
          <StatusDot color={C.accent} label="LIVE" />
          <div style={{ width: 1, height: 20, background: C.border, margin: "0 8px" }} />
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "Inter, sans-serif" }}>
            {new Date().toLocaleTimeString()}
          </div>
        </header>

        {/* Content */}
        <div ref={contentRef} style={S.content}>
          {/* Module header */}
          <div style={{ marginBottom: 20, animation: "fadeInUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,58,237,0.08)", border: `1px solid rgba(124,58,237,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {mod.icon}
              </div>
              <div>
                <h1 style={{ fontFamily: "Inter, monospace", fontSize: 22, fontWeight: 900, letterSpacing: 2, color: C.text, marginBottom: 6 }}>
                  {mod.label} <span style={{ color: C.accent }}>Visualizer</span>
                </h1>
                <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>{mod.desc}</p>
              </div>
            </div>

            {/* Quick nav category pills */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              {CATEGORIES.map(cat => (
                <div key={cat.name} style={{ display: "flex", gap: 2 }}>
                  {cat.modules.map(m => (
                    <button key={m.id} onClick={() => setActive(m.id)} style={{
                      padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer",
                      fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                      transition: "all 0.2s",
                      background: active === m.id ? C.accent : "rgba(255,255,255,0.03)",
                      color: active === m.id ? "#FFF" : C.textMuted,
                      boxShadow: active === m.id ? `0 0 10px ${C.accentGlow}` : "none",
                    }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Module content */}
          <div style={{ animation: "fadeInUp 0.3s ease" }}>
            <ActiveModule key={active} />
          </div>
        </div>
      </div>
      <MLComparisonPanel />
      <MLAssistant />
    </div>
  );
}
