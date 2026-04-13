// index.tsx - Página principal (Home) de la aplicación Magneto
// Implementa lógica de enrutamiento condicional basada en validación de perfil,
// utilizando Next.js router y contexto global para navegación inteligente.

import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { FileUpload } from './FileUpload';
//import Profile from './Profile';

export default function Home() {
  const router = useRouter();
  const { setState } = useMagneto();

  // Renderizado principal: layout centrado con componente FileUpload
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <FileUpload
        onSuccess={(data) => {
          console.log("Llegó a onSuccess de Home con:", data);
          setState(data); // Actualiza estado global con respuesta de agentes

          // Enrutamiento condicional: vacantes si válido, formulario si requiere corrección
          if (data.es_valido === true) {
            router.push('/Profile'); // Redirige a perfil si el perfil es válido
          } else {
            router.push('/FormUser');
          }
        }}
      />
    </div>
  );
}