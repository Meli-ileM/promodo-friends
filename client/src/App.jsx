import { Navigate, Route, Routes } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import PomodoroPage from "./pages/PomodoroPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/room/:roomId" element={<PomodoroPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
