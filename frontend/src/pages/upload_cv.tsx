import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { FileUpload } from './FileUpload';

export default function UploadCVRoute() {
  const router = useRouter();
  const { state, setState, logout } = useMagneto();

  // Control de acceso de seguridad
  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push('/');
    } else if (state.perfil_normalizado?.has_cv) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, state.perfil_normalizado, router]);

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      <div className="absolute top-4 right-4">
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

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Bienvenido a Magneto IA</h2>
        <p className="text-slate-400">Sube un CV para que los agentes lo analicen</p>
      </div>

      <FileUpload
        onSuccess={(data) => {
          console.log("Llegó a onSuccess de Home con:", data);
          setState(data);
          
          if (data.es_valido === true) {
            router.push('/Profile');
          } else {
            router.push('/FormUser');
          }
        }}
      />
      
    </div>
  );
}