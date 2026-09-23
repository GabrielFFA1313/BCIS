import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:4000/health/db")
      .then((res) => res.json())
      .then((data) => setStatus(`API: ${data.status}, DB: ${data.database}`))
      .catch(() => setStatus("API unreachable"));
  }, []);

  return <div style={{ padding: 20, fontFamily: "sans-serif" }}>{status}</div>;
}

export default App;