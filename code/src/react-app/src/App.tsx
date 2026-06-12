import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import SsoCallback from "./pages/SsoCallback";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sso-callback" element={<SsoCallback />} />
    </Routes>
  );
}
