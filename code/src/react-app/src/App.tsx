import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Could not reach the API."));
  }, []);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          CORE <span className="text-blue">CONFIDENCE</span>
        </h1>
        <p className="mt-3 text-text-secondary">{message}</p>
      </div>
    </div>
  );
}
