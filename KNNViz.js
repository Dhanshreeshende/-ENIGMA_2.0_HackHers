import React, { useState } from "react";

const KNNViz = () => {
  const [kValue, setKValue] = useState(3);

  return (
    <div>
      <h2>K-Nearest Neighbors Visualization</h2>
      <p>Current K: {kValue}</p>
    </div>
  );
};

export default KNNViz;add basic KNN visualization component structure

