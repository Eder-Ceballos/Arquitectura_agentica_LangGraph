import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { FileUpload } from './FileUpload';
import { Login } from './Login';

export default function Home() {
  const router = useRouter();
  const { state, setState, logout } = useMagneto();

  // SI NO ESTÁ AUTENTICADO: Mostramos la pantalla de Login
  if (!state.isAuthenticated) {
    return <Login />;
  }

  // SI ESTÁ AUTENTICADO: Mostramos la aplicación principal
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Botón de logout corregido */}
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