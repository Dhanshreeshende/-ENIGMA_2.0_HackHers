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
