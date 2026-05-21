import React from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import RankingTable from '../components/RankingTable';
import RecommendationsCard from '../components/RecommendationsCard';
import { ArrowLeft } from 'lucide-react';

const Vacantes = () => {
  const router = useRouter();
  const { state } = useMagneto();
  const isAuthenticated = useAuthGuard();

  const email = state?.perfil_normalizado?.email ?? '';
  const nombre = state?.perfil_normalizado?.nombre ?? '';
  const idPerfil: number | null =
    state?.perfil_normalizado?.id ?? state?.perfil_normalizado?.id_perfil ?? null;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Volver al perfil
        </button>

        {email ? (
          <>
            <RecommendationsCard email={email} idPerfil={idPerfil} />

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
              <RankingTable email={email} nombreCandidato={nombre} dark={true} />
            </div>
          </>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">
                No hay un perfil activo. Sube un CV para ver las vacantes disponibles.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors"
              >
                IR AL INICIO
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Vacantes;
