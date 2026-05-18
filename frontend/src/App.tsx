import React from "react";
import DashboardPage from "./pages/DashboardPage";
import { Login } from "./pages/Login";
import { UploadCV } from "./pages/UploadCV";
import { useMagneto } from "./context/MagnetoContext";

const AppContent: React.FC = () => {
  const { state } = useMagneto();

  // Si no está logueado, va directo al Login (Sin props sobrantes)
  if (!state.isAuthenticated) {
    return <Login />;
  }

  // Si está logueado pero no tiene CV, va a subirlo
  const hasCv = state.perfil_normalizado?.has_cv;
  if (!hasCv) {
    return <UploadCV />;
  }

  // Si todo está correcto, va al Dashboard
  return <DashboardPage />;
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;