import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, Send, XCircle, Loader2 } from 'lucide-react';

interface Recommendation {
  id_vacante: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  score: number;
  razon: string;
  breakdown: {
    habilidades: number;
    experiencia: number;
    salario: number;
    ubicacion: number;
    habilidades_match: string[];
  };
}

interface PostulacionResult {
  estado: string;
  mensaje_confirmacion: string;
  siguiente_paso: string;
  error?: string;
}

interface Props {
  email: string;
  idPerfil: number | null;
}

const VISIBLE_COUNT = 3;

const scoreColor = (s: number) =>
  s >= 70 ? '#1D9E75' : s >= 40 ? '#BA7517' : '#E24B4A';

export default function RecommendationsCard({ email, idPerfil }: Props) {
  const router = useRouter();
  const [allRecs, setAllRecs] = useState<Recommendation[]>([]);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, PostulacionResult>>({});
  const [postulando, setPostulando] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`http://localhost:8000/api/v1/candidates/recommendations?email=${encodeURIComponent(email)}&limit=7`)
      .then(r => r.json())
      .then(d => setAllRecs(d.recommendations ?? []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [email]);

  const visible = allRecs
    .filter(r => !rejectedIds.has(r.id_vacante))
    .slice(0, VISIBLE_COUNT);

  const handleRechazar = (id: string) =>
    setRejectedIds(prev => new Set([...prev, id]));

  const handleAceptar = async (rec: Recommendation) => {
    if (!idPerfil) return;
    setPostulando(rec.id_vacante);
    try {
      const res = await fetch('http://localhost:8000/api/v1/postulaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_perfil: idPerfil, id_vacante: rec.id_vacante }),
      });
      const data = await res.json();
      setResults(prev => ({
        ...prev,
        [rec.id_vacante]: {
          estado: data.estado,
          mensaje_confirmacion: data.mensaje_confirmacion,
          siguiente_paso: data.siguiente_paso,
          error: data.error,
        },
      }));
    } catch {
      setResults(prev => ({
        ...prev,
        [rec.id_vacante]: { estado: '', mensaje_confirmacion: '', siguiente_paso: '', error: 'Error de conexión.' },
      }));
    } finally {
      setPostulando(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={14} className="text-indigo-400" />
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Recomendaciones IA
        </h2>
        {!loading && !fetchError && (
          <span className="ml-auto text-[10px] text-slate-600 font-mono">
            {visible.length} de {allRecs.filter(r => !rejectedIds.has(r.id_vacante)).length} disponibles
          </span>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono animate-pulse py-4">
          <Loader2 size={14} className="animate-spin" />
          Analizando tu perfil con IA...
        </div>
      )}

      {!loading && fetchError && (
        <p className="text-slate-500 text-sm py-4">No se pudieron cargar las recomendaciones.</p>
      )}

      {!loading && !fetchError && visible.length === 0 && (
        <p className="text-slate-500 text-sm py-4">No hay más recomendaciones disponibles.</p>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((rec, idx) => {
          const result = results[rec.id_vacante];
          const isPending = postulando === rec.id_vacante;
          const color = scoreColor(rec.score);
          const accepted = !!result && !result.error;

          return (
            <div
              key={rec.id_vacante}
              className={`border rounded-2xl p-5 flex flex-col transition-colors ${
                accepted
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-indigo-500/30'
              }`}
            >
              {/* Rank + Score */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-600 font-mono font-bold uppercase tracking-widest">
                  #{idx + 1} recomendada
                </span>
                <span className="text-xl font-black" style={{ color }}>
                  {rec.score}%
                </span>
              </div>

              {/* Title */}
              <button
                onClick={() => router.push(`/Vacantes/${rec.id_vacante}`)}
                className="text-white font-black text-sm uppercase tracking-tight leading-tight hover:text-indigo-400 transition-colors text-left mb-1"
              >
                {rec.cargo}
              </button>
              <p className="text-xs text-slate-500 mb-4">{rec.empresa}</p>

              {/* AI reason */}
              {!result && (
                <p className="text-slate-400 text-xs leading-relaxed mb-4 border-l-2 border-indigo-500/30 pl-3 italic flex-1">
                  {rec.razon}
                </p>
              )}

              {/* Postulation result */}
              {result && (
                <div className={`rounded-xl p-3 mb-4 flex-1 ${result.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  {result.error ? (
                    <p className="text-red-400 text-xs">{result.error}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                        Enviada — {result.estado}
                      </p>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {result.mensaje_confirmacion}
                      </p>
                      {result.siguiente_paso && (
                        <p className="text-slate-500 text-[11px] italic border-t border-emerald-500/20 pt-2 mt-1">
                          "{result.siguiente_paso}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {!result && (
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleAceptar(rec)}
                    disabled={isPending || !idPerfil}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    {isPending ? 'Postulando...' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => handleRechazar(rec.id_vacante)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    Rechazar
                  </button>
                </div>
              )}

              {accepted && (
                <button
                  onClick={() => router.push(`/Vacantes/${rec.id_vacante}`)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-auto"
                >
                  Ver detalle de la vacante →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
