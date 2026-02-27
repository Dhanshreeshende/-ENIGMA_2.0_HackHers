// This function calculates gradient updates
// based on the current learning rate
import React, { useState } from "react";

const GradientDescent = () => {
  const [learningRate, setLearningRate] = useState(0.1);
  const [weight, setWeight] = useState(5);

  return (
    <div>
      <h2>Gradient Descent Visualization</h2>
      <p>Learning Rate: {learningRate}</p>
      <p>Current Weight: {weight}</p>
    </div>
  );
};

export default GradientDescent;
const updateWeight = () => {
  const gradient = 2 * weight;
  setWeight(weight - learningRate * gradient);
};
<button onClick={updateWeight}>Update Weight</button>
<input
  type="range"
  min="0.01"
  max="1"
  step="0.01"
  value={learningRate}
  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
/>

