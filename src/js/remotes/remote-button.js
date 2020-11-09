import React, { useState } from 'react';

const RemoteButton = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((prev) => prev + 1)}>Count: {count}</button>;
};

export default RemoteButton;
