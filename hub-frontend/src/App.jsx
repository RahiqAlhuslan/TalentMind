import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HRDashboard from "./pages/HRDashboard";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/" element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        } />
        <Route path="/game/:gameId" element={
          <PrivateRoute>
            <GamePage />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
