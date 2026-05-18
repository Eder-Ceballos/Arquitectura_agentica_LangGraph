import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import DashboardPage from './DashboardPage';

export default function DashboardRoute() {
  const router = useRouter();
  const { state, logout } = useMagneto(); // Extraemos la función de cerrar sesión

  // Control de acceso de seguridad
  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push('/');
    } else if (!state.perfil_normalizado?.has_cv) {
      router.push('/upload_cv');
    }
  }, [state.isAuthenticated, state.perfil_normalizado, router]);

  if (!state.isAuthenticated || !state.perfil_normalizado?.has_cv) return null;

  return (
    <div className="relative min-h-screen">
      
      {/* Botón de logout arriba a la derecha (idéntico al de subir CV) */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="text-slate-500 hover:text-white text-sm bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800 transition-all hover:bg-slate-800"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Renderizado de tu Dashboard original sin alterar su diseño */}
      <DashboardPage />
      
    </div>
  );
}