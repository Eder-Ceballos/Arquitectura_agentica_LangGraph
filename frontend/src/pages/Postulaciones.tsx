import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { ArrowLeft, Briefcase, Building2, MapPin, X, AlertTriangle, Check } from 'lucide-react';
import { API_URL } from '../lib/api';

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
  'Enviada':      { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
  'En revisión':  { bg: 'rgba(186,117,23,0.15)',  color: '#BA7517' },
  'Entrevista':   { bg: 'rgba(29,158,117,0.15)',  color: '#1D9E75' },
  'Rechazada':    { bg: 'rgba(226,75,74,0.15)',   color: '#E24B4A' },
};

const Postulaciones = () => {
  const router = useRouter();
  const { state } = useMagneto();
  const isAuthenticated = useAuthGuard();
  const [postulaciones, setPostulaciones] = useState<PostulacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  // id de la postulación en modo confirmación de cancelación (null = ninguna)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  // id de la postulación que se está cancelando (spinner)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const idPerfil: number | null =
    state?.perfil_normalizado?.id ?? state?.perfil_normalizado?.id_perfil ?? null;

  useEffect(() => {
    if (!idPerfil) { setLoading(false); return; }

    fetch(`${API_URL}/api/v1/postulaciones/${idPerfil}`)
      .then(r => r.json())
      .then(d => setPostulaciones(d.postulaciones ?? []))
      .catch(() => setPostulaciones([]))
      .finally(() => setLoading(false));
  }, [idPerfil]);

  if (!isAuthenticated) return null;

  const formatFecha = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const handleCancelar = async (idPostulacion: number) => {
    if (!idPerfil) return;
    setCancelandoId(idPostulacion);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/postulaciones/${idPostulacion}?id_perfil=${idPerfil}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Error al cancelar la postulación');
      }
      // Eliminar de la lista local sin recargar
      setPostulaciones(prev => prev.filter(p => p.id !== idPostulacion));
      setConfirmandoId(null);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Error inesperado');
    } finally {
      setCancelandoId(null);
    }
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

        {/* Error global */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X size={14} />
            </button>
          </div>
        )}

        {loading && (
          <p className="text-indigo-400 font-mono text-xs animate-pulse uppercase tracking-widest">
            Cargando postulaciones...
          </p>
        )}

        {!loading && !idPerfil && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <p className="text-slate-500 text-sm mb-4">
              No hay un perfil activo. Inicia sesión para ver tus postulaciones.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors"
            >
              IR AL INICIO
            </button>
          </div>
        )}

        {!loading && idPerfil && postulaciones.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <p className="text-slate-500 text-sm mb-4">Aún no has postulado a ninguna vacante.</p>
            <button
              onClick={() => router.push('/Vacantes')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors"
            >
              VER VACANTES
            </button>
          </div>
        )}

        <div className="space-y-4">
          {postulaciones.map(p => {
            const estilo = ESTADO_STYLE[p.estado] ?? { bg: 'rgba(128,128,128,0.1)', color: '#94a3b8' };
            const estaConfirmando = confirmandoId === p.id;
            const estaCancelando = cancelandoId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-2xl p-6 transition-colors ${
                  estaConfirmando
                    ? 'border-red-500/40'
                    : 'border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                {/* Cabecera de la card */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !estaConfirmando && router.push(`/Vacantes/${p.id_vacante}`)}
                  >
                    <h2 className="text-white font-black text-lg uppercase tracking-tight leading-tight">
                      {p.vacante?.cargo || p.id_vacante}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      {p.vacante?.empresa  && <span className="flex items-center gap-1"><Building2 size={11}/> {p.vacante.empresa}</span>}
                      {p.vacante?.modalidad && <span className="flex items-center gap-1"><Briefcase size={11}/> {p.vacante.modalidad}</span>}
                      {p.vacante?.ubicacion && <span className="flex items-center gap-1"><MapPin size={11}/> {p.vacante.ubicacion}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                      style={{ background: estilo.bg, color: estilo.color }}
                    >
                      {p.estado}
                    </span>
                    <span className="text-[11px] text-slate-600">{formatFecha(p.fecha_postulacion)}</span>
                  </div>
                </div>

                {/* Mensaje de confirmación IA */}
                {p.mensaje_confirmacion && (
                  <p className="text-slate-400 text-sm leading-relaxed mb-3 border-l-2 border-indigo-500/30 pl-3">
                    {p.mensaje_confirmacion}
                  </p>
                )}

                {/* Siguiente paso */}
                {p.siguiente_paso && (
                  <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Siguiente paso</p>
                    <p className="text-slate-400 text-xs italic">"{p.siguiente_paso}"</p>
                  </div>
                )}

                {/* ── Zona de cancelación ── */}
                {!estaConfirmando ? (
                  /* Botón inicial */
                  <button
                    onClick={() => { setConfirmandoId(p.id); setErrorMsg(null); }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-red-400 transition-colors mt-1"
                  >
                    <X size={12} /> Cancelar postulación
                  </button>
                ) : (
                  /* Confirmación inline */
                  <div className="flex items-center gap-3 mt-1 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-xs flex-1">
                      ¿Seguro que quieres cancelar esta postulación? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Confirmar */}
                      <button
                        disabled={estaCancelando}
                        onClick={() => handleCancelar(p.id)}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {estaCancelando ? (
                          <span className="animate-pulse">Cancelando...</span>
                        ) : (
                          <><Check size={11} /> Sí, cancelar</>
                        )}
                      </button>
                      {/* Abortar */}
                      <button
                        disabled={estaCancelando}
                        onClick={() => setConfirmandoId(null)}
                        className="text-slate-500 hover:text-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        No
                      </button>
                    </div>
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
