import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ArrowLeft, Briefcase, Building2, MapPin } from 'lucide-react';

interface PostulacionItem {
  id: number;
  id_vacante: string;
  estado: string;
  mensaje_confirmacion: string;
  siguiente_paso: string;
  fecha_postulacion: string;
  vacante: {
    cargo: string;
    empresa: string;
    modalidad: string;
    ubicacion: string;
  };
}

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  'Enviada':     { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'En revisión': { bg: 'rgba(186,117,23,0.15)', color: '#BA7517' },
  'Entrevista':  { bg: 'rgba(29,158,117,0.15)', color: '#1D9E75' },
  'Rechazada':   { bg: 'rgba(226,75,74,0.15)',  color: '#E24B4A' },
};

const Postulaciones = () => {
  const router = useRouter();
  const { state } = useMagneto();
  const isAuthenticated = useAuthGuard();
  const [postulaciones, setPostulaciones] = useState<PostulacionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const idPerfil: number | null = state?.perfil_normalizado?.id ?? state?.perfil_normalizado?.id_perfil ?? null;

  useEffect(() => {
    if (!idPerfil) { setLoading(false); return; }

    fetch(`http://localhost:8000/api/v1/postulaciones/${idPerfil}`)
      .then(r => r.json())
      .then(d => setPostulaciones(d.postulaciones ?? []))
      .catch(() => setPostulaciones([]))
      .finally(() => setLoading(false));
  }, [idPerfil]);

  if (!isAuthenticated) return null;

  const formatFecha = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Volver
        </button>

        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Mis postulaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Historial de vacantes a las que has aplicado</p>
        </div>

        {loading && (
          <p className="text-indigo-400 font-mono text-xs animate-pulse uppercase tracking-widest">Cargando postulaciones...</p>
        )}

        {!loading && !idPerfil && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <p className="text-slate-500 text-sm mb-4">No hay un perfil activo. Inicia sesión para ver tus postulaciones.</p>
            <button onClick={() => router.push('/')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors">
              IR AL INICIO
            </button>
          </div>
        )}

        {!loading && idPerfil && postulaciones.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <p className="text-slate-500 text-sm mb-4">Aún no has postulado a ninguna vacante.</p>
            <button onClick={() => router.push('/Vacantes')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors">
              VER VACANTES
            </button>
          </div>
        )}

        <div className="space-y-4">
          {postulaciones.map(p => {
            const estilo = ESTADO_STYLE[p.estado] ?? { bg: 'rgba(128,128,128,0.1)', color: '#94a3b8' };
            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-indigo-500/40 transition-colors"
                onClick={() => router.push(`/Vacantes/${p.id_vacante}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-white font-black text-lg uppercase tracking-tight leading-tight">
                      {p.vacante?.cargo || p.id_vacante}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      {p.vacante?.empresa && <span className="flex items-center gap-1"><Building2 size={11}/> {p.vacante.empresa}</span>}
                      {p.vacante?.modalidad && <span className="flex items-center gap-1"><Briefcase size={11}/> {p.vacante.modalidad}</span>}
                      {p.vacante?.ubicacion && <span className="flex items-center gap-1"><MapPin size={11}/> {p.vacante.ubicacion}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: estilo.bg, color: estilo.color }}>
                      {p.estado}
                    </span>
                    <span className="text-[11px] text-slate-600">{formatFecha(p.fecha_postulacion)}</span>
                  </div>
                </div>

                {p.mensaje_confirmacion && (
                  <p className="text-slate-400 text-sm leading-relaxed mb-3 border-l-2 border-indigo-500/30 pl-3">
                    {p.mensaje_confirmacion}
                  </p>
                )}

                {p.siguiente_paso && (
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Siguiente paso</p>
                    <p className="text-slate-400 text-xs italic">"{p.siguiente_paso}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Postulaciones;
