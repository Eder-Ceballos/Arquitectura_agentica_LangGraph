import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { FileUpload } from './FileUpload';
import { Login } from './Login';

function hasProfileData(perfil: any): boolean {
  if (!perfil) return false;
  return (
    (Array.isArray(perfil.habilidades) && perfil.habilidades.length > 0) ||
    !!perfil.profesion ||
    (perfil.años_experiencia != null && perfil.años_experiencia > 0)
  );
}

export default function Home() {
  const router = useRouter();
  const { state, setState, logout } = useMagneto();

  const perfil = state.perfil_normalizado;
  const hasProfile = state.isAuthenticated && hasProfileData(perfil);

  // If the user is authenticated and already has a CV, go straight to Profile
  useEffect(() => {
    if (hasProfile) {
      router.replace('/Profile');
    }
  }, [hasProfile]);

  if (!state.isAuthenticated) {
    return <Login />;
  }

  // Show nothing while redirecting to avoid a flash of the upload form
  if (hasProfile) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">

      <div className="absolute top-4 right-4">
        <button
          onClick={() => logout()}
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
        profileEmail={state?.perfil_normalizado?.email ?? undefined}
        onSuccess={(data) => {
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
