# 🧠 ML Sandbox — Interactive Machine Learning Simulator

A zero-dependency, pure-JavaScript ML learning platform built with React. No backend required.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
# Opens at http://localhost:3000
```

## File Structure

```
ml-sandbox/
├── public/
│   └── index.html          # HTML shell with fonts & CSS resets
├── src/
│   ├── index.js             # React entry point
│   ├── App.js               # Main layout: sidebar, topbar, module router
│   ├── styles.js            # Design tokens & shared style objects
│   ├── utils.js             # Math utilities, sigmoid, polyFeatures, lsqSolve
│   └── modules/
│       ├── GradientDescent.js   # Loss landscape + ball animation
│       ├── NeuralNet.js         # NN training with backprop visualization
│       ├── DecisionBoundary.js  # Multi-classifier boundary heatmap
│       ├── KNNViz.js            # KNN with Voronoi regions
│       ├── OverfittingViz.js    # Bias-variance tradeoff demo
│       ├── Scenarios.js         # Guided step-by-step tutorials
│       └── Architecture.js      # System architecture diagram
├── package.json
└── README.md
```

## Modules

| Module | Algorithm | Key Feature |
|--------|-----------|-------------|
| Gradient Descent | SGD + Momentum | Live loss landscape heatmap, ball animation |
| Neural Network | Backpropagation | Network topology viz, decision boundary |
| Decision Boundary | Log/Poly/RBF/KNN | Click-to-place points, instant boundary |
| KNN Visualizer | K-Nearest Neighbors | Voronoi regions, vote bars |
| Overfitting | Polynomial Regression | Bias-variance chart, MSE metrics |
| Guided Scenarios | N/A | Step-by-step learning paths |
| Architecture | N/A | Pipeline diagram + tech docs |

## Requirements Fulfilled

✅ Interactive ML playground  
✅ Visual explanation modules (5 core algorithms)  
✅ Guided learning scenarios (4 curated paths)  
✅ Architecture diagram of simulation pipeline  
✅ Animated, attractive UI (Orbitron + Space Mono fonts, dark theme)  
✅ 60fps Canvas rendering — no SVG lag  
✅ Zero backend — pure client-side computation  
