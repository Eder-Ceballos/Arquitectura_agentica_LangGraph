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
      router.push('/Profile');
    }
  }, [state.isAuthenticated, state.perfil_normalizado, router]);

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      
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
        onSuccess={async (data) => {
          console.log("Llegó a onSuccess de Home con:", data);
          
          // 1. Guardamos los datos en el estado global en memoria
          setState(data);
          
          // 2. Si el CV es válido, lo persistimos en la base de datos
          if (data.es_valido === true) {
            const perfil = data.perfil_normalizado || data;
            
            // CAMBIO CRUCIAL: Usamos el email de la CUENTA LOGUEADA (user.email) 
            // para que no se guarde en el email extraído del PDF corporativo.
            const emailUsuario = state?.user?.email || perfil?.email;

            if (emailUsuario) {
              try {
                // Forzamos el PUT hacia el email de la cuenta activa
                await fetch(`http://localhost:8000/api/v1/profile/${emailUsuario}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...perfil,
                    email: emailUsuario, // Sobrescribimos el email interno para emparejar la DB
                    has_cv: true,
                    años_experiencia: parseInt(perfil.años_experiencia) || 0,
                    habilidades: perfil.habilidades || []
                  })
                });
                console.log(`¡Éxito! Perfil enlazado y guardado en app.db para: ${emailUsuario}`);
              } catch (err) {
                console.error("Error al intentar persistir el perfil en la base de datos:", err);
              }
            }

            // 3. Redirigimos al Perfil
            router.push('/Profile');
          } else {
            router.push('/FormUser');
          }
        }}
      />
      
    </div>
  );
}