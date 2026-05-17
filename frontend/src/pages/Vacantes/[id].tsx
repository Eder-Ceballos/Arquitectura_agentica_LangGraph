import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../../context/MagnetoContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import {
  ArrowLeft, MapPin, Briefcase, Building2,
  GraduationCap, DollarSign, CheckCircle, Send
} from 'lucide-react';

interface VacanteDetalle {
  id_vacante: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  modalidad: string;
  salario_min: number;
  salario_max: number;
  habilidades_requeridas: string[];
  experiencia_minima: number;
  educacion: string;
  descripcion: string;
  estado: string;
}

interface ScoreDetalle {
  score: number;
  breakdown: {
    habilidades: number;
    experiencia: number;
    salario: number;
    ubicacion: number;
    habilidades_match: string[];
  };
}

function FactorBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? Math.min((score / max) * 100, 100) : 0;
  const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#BA7517' : '#E24B4A';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{score} / {max} pts</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'rgba(128,128,128,0.2)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

const VacanteDetallePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { state } = useMagneto();
  const isAuthenticated = useAuthGuard();

  const [vacante, setVacante] = useState<VacanteDetalle | null>(null);
  const [scoreData, setScoreData] = useState<ScoreDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [postulando, setPostulando] = useState(false);
  const [estadoPostulacion, setEstadoPostulacion] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    mensaje_confirmacion: string;
    siguiente_paso: string;
    estado: string;
    error?: string;
  } | null>(null);

  const email = state?.perfil_normalizado?.email ?? '';
  const idPerfil: number | null = state?.perfil_normalizado?.id ?? state?.perfil_normalizado?.id_perfil ?? null;

  useEffect(() => {
    if (!id) return;

    const fetchVacante = fetch(`http://localhost:8000/api/v1/vacantes/${id}`)
      .then(r => r.json())
      .then(d => setVacante(d.vacante));

    const fetchScore = email
      ? fetch(`http://localhost:8000/api/v1/candidates/ranking?email=${encodeURIComponent(email)}`)
          .then(r => r.json())
          .then(d => {
            const entrada = (d.ranking ?? []).find((v: any) => v.id_vacante === id);
            if (entrada) setScoreData({ score: entrada.score, breakdown: entrada.breakdown });
          })
      : Promise.resolve();

    const fetchPostulacion = idPerfil
      ? fetch(`http://localhost:8000/api/v1/postulaciones/${idPerfil}`)
          .then(r => r.json())
          .then(d => {
            const existente = (d.postulaciones ?? []).find((p: any) => p.id_vacante === id);
            if (existente) setEstadoPostulacion(existente.estado);
          })
      : Promise.resolve();

    Promise.all([fetchVacante, fetchScore, fetchPostulacion]).finally(() => setLoading(false));
  }, [id, email]);

  const handlePostular = async () => {
    if (!idPerfil || !id) return;
    setPostulando(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/postulaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_perfil: idPerfil, id_vacante: id }),
      });
      const data = await res.json();
      setResultado({
        mensaje_confirmacion: data.mensaje_confirmacion,
        siguiente_paso: data.siguiente_paso,
        estado: data.estado,
        error: data.error,
      });
      if (data.estado && !data.error) setEstadoPostulacion(data.estado);
    } catch {
      setResultado({ mensaje_confirmacion: '', siguiente_paso: '', estado: '', error: 'Error de conexión con el servidor.' });
    } finally {
      setPostulando(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400 font-mono animate-pulse uppercase tracking-widest text-xs">
        Cargando vacante...
      </div>
    );
  }

  if (!vacante) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <p className="text-slate-400 mb-4">Vacante no encontrada.</p>
        <button onClick={() => router.back()} className="text-indigo-400 text-sm hover:underline">Volver</button>
      </div>
    );
  }

  const scoreColor = scoreData
    ? scoreData.score >= 70 ? '#1D9E75' : scoreData.score >= 40 ? '#BA7517' : '#E24B4A'
    : '#64748b';

  const formatSalario = (min: number, max: number) => {
    if (!min && !max) return 'No especificado';
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    return min ? `Desde $${min.toLocaleString()}` : `Hasta $${max.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Volver a vacantes
        </button>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight mb-1">
                {vacante.cargo}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-2">
                <span className="flex items-center gap-1.5"><Building2 size={13} /> {vacante.empresa}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {vacante.ubicacion || 'No especificada'}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={13} /> {vacante.modalidad || 'No especificada'}</span>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={(() => {
                const label = estadoPostulacion ?? vacante.estado;
                const map: Record<string, { bg: string; color: string }> = {
                  'Enviada':      { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8' },
                  'En revisión':  { bg: 'rgba(186,117,23,0.15)',  color: '#BA7517' },
                  'Entrevista':   { bg: 'rgba(29,158,117,0.15)',  color: '#1D9E75' },
                  'Rechazada':    { bg: 'rgba(226,75,74,0.15)',   color: '#E24B4A' },
                  'Activa':       { bg: 'rgba(29,158,117,0.15)',  color: '#1D9E75' },
                };
                return map[label] ?? { bg: 'rgba(226,75,74,0.15)', color: '#E24B4A' };
              })()}
            >
              {estadoPostulacion ?? vacante.estado ?? 'Sin estado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Columna izquierda */}
          <div className="space-y-6">

            {/* Score de compatibilidad */}
            {scoreData && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2 mb-4">
                  Compatibilidad
                </h3>
                <div className="text-center mb-6">
                  <span style={{ fontSize: 48, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                    {scoreData.score}%
                  </span>
                </div>
                <FactorBar label="Habilidades" score={scoreData.breakdown.habilidades} max={40} />
                <FactorBar label="Experiencia" score={scoreData.breakdown.experiencia} max={30} />
                <FactorBar label="Salario" score={scoreData.breakdown.salario} max={20} />
                <FactorBar label="Ubicación" score={scoreData.breakdown.ubicacion} max={10} />
              </div>
            )}

            {/* Info rápida */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
                Requisitos
              </h3>
              <div className="flex items-start gap-3">
                <DollarSign size={14} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Salario</p>
                  <p className="text-sm text-white font-mono">{formatSalario(vacante.salario_min, vacante.salario_max)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase size={14} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Experiencia mínima</p>
                  <p className="text-sm text-white font-mono">{vacante.experiencia_minima ?? 0} años</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap size={14} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Educación</p>
                  <p className="text-sm text-white font-mono">{vacante.educacion || 'No especificada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="md:col-span-2 space-y-6">

            {/* Descripción */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Descripción del cargo</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {vacante.descripcion || 'Sin descripción disponible.'}
              </p>
            </div>

            {/* Habilidades requeridas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Habilidades requeridas</h3>
              {vacante.habilidades_requeridas?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vacante.habilidades_requeridas.map((h) => {
                    const coincide = scoreData?.breakdown.habilidades_match.includes(h.toLowerCase());
                    return (
                      <span
                        key={h}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold"
                        style={{
                          background: coincide ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.05)',
                          color: coincide ? '#1D9E75' : '#94a3b8',
                          border: `1px solid ${coincide ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {coincide && <CheckCircle size={11} />}
                        {h}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Sin habilidades especificadas.</p>
              )}
            </div>

            {/* Resultado de postulación */}
            {resultado && (
              <div className={`rounded-2xl p-6 border ${resultado.error ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                {resultado.error ? (
                  <p className="text-red-400 text-sm font-medium">{resultado.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-2">Postulación enviada — {resultado.estado}</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{resultado.mensaje_confirmacion}</p>
                    </div>
                    {resultado.siguiente_paso && (
                      <div className="border-t border-emerald-500/20 pt-4">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Siguiente paso sugerido</p>
                        <p className="text-slate-400 text-sm leading-relaxed italic">"{resultado.siguiente_paso}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botón postular */}
            {!resultado && (
              <button
                onClick={handlePostular}
                disabled={postulando || !idPerfil}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                {postulando ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Procesando postulación...
                  </>
                ) : (
                  <><Send size={16} /> POSTULAR A ESTA VACANTE</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacanteDetallePage;
