import React, { useState } from "react";

/*
  KNN Visualization Component
  ---------------------------
  This component demonstrates how the K-Nearest Neighbors algorithm works.
  Users can adjust the value of K and observe classification changes.
*/

const KNNViz = () => {
  // State for K value (number of neighbors)
  const [kValue, setKValue] = useState(3);

  // Sample dataset (2D points with labels)
  const samplePoints = [
    { x: 1, y: 2, label: "A" },
    { x: 2, y: 3, label: "A" },
    { x: 3, y: 1, label: "A" },
    { x: 6, y: 5, label: "B" },
    { x: 7, y: 7, label: "B" },
    { x: 8, y: 6, label: "B" },
  ];

  // New test point to classify
  const testPoint = { x: 4, y: 4 };

  /*
    Function to calculate Euclidean Distance
    Formula:
    sqrt((x2 - x1)^2 + (y2 - y1)^2)
  */
  const calculateDistance = (p1, p2) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    );
  };

  // Compute distances and sort neighbors
  const getNearestNeighbors = () => {
    const distances = samplePoints.map((point) => ({
      ...point,
      distance: calculateDistance(point, testPoint),
    }));

    // Sort by smallest distance
    distances.sort((a, b) => a.distance - b.distance);

    // Return top K neighbors
    return distances.slice(0, kValue);
  };

  const neighbors = getNearestNeighbors();

  // Determine predicted class based on majority vote
  const getPrediction = () => {
    const votes = {};

    neighbors.forEach((neighbor) => {
      votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
    });

    return Object.keys(votes).reduce((a, b) =>
      votes[a] > votes[b] ? a : b
    );
  };

  const prediction = getPrediction();

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>K-Nearest Neighbors Visualization</h2>

      <div style={styles.sliderContainer}>
        <label>Choose K Value: {kValue}</label>
        <input
          type="range"
          min="1"
          max="5"
          value={kValue}
          onChange={(e) => setKValue(parseInt(e.target.value))}
        />
      </div>

      <div style={styles.section}>
        <h3>Test Point</h3>
        <p>
          ({testPoint.x}, {testPoint.y})
        </p>
      </div>

      <div style={styles.section}>
        <h3>Nearest Neighbors</h3>
        <ul>
          {neighbors.map((neighbor, index) => (
            <li key={index}>
              ({neighbor.x}, {neighbor.y}) - Class {neighbor.label} -
              Distance: {neighbor.distance.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.prediction}>
        <h3>Predicted Class: {prediction}</h3>
      </div>
    </div>
  );
};

/*
  Styling Object
  --------------
  Keeping styling modular and clean.
*/

const styles = {
  container: {
    padding: "25px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderRadius: "12px",
    marginTop: "20px",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },
  sliderContainer: {
    marginBottom: "20px",
  },
  section: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#1e293b",
    borderRadius: "8px",
  },
  prediction: {
    padding: "15px",
    backgroundColor: "#2563eb",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
  },
};

export default KNNViz;





