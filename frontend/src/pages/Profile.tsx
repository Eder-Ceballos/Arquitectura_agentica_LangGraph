import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { API_URL } from '../lib/api';
import {
  Mail, MapPin, Briefcase, ShieldCheck, Search, Edit3, Save, GraduationCap,
  AlertCircle, X, Terminal, Plus, DollarSign, Upload, CheckCircle2, Bell,
  ArrowRight, RefreshCw
} from 'lucide-react';
import DashboardPage from './DashboardPage';
import { FileUpload } from './FileUpload';

/* ─── Panel de notificaciones de postulaciones ─────────────────────────────── */
const PostulacionesNotificaciones = ({ idPerfil, onVerTodas }: { idPerfil: number; onVerTodas: () => void }) => {
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPostulaciones = useCallback(async () => {
    if (!idPerfil) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/postulaciones/${idPerfil}`);
      if (res.ok) {
        const data = await res.json();
        setPostulaciones(data.postulaciones || []);
        setLastUpdated(new Date());
      }
    } catch {
      // silencioso — no bloquear el UI
    } finally {
      setLoading(false);
    }
  }, [idPerfil]);

  useEffect(() => {
    fetchPostulaciones();
    // Polling cada 30 segundos para mantener el estado actualizado
    const interval = setInterval(fetchPostulaciones, 30_000);
    return () => clearInterval(interval);
  }, [fetchPostulaciones]);

  const estadoStyles: Record<string, { dot: string; badge: string }> = {
    enviada:     { dot: 'bg-indigo-500 animate-pulse', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
    'en revisión': { dot: 'bg-yellow-400 animate-pulse', badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    aceptada:    { dot: 'bg-emerald-500',               badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    rechazada:   { dot: 'bg-red-500',                   badge: 'text-red-400 bg-red-500/10 border-red-500/30' },
  };

  const getStyles = (estado: string) =>
    estadoStyles[estado?.toLowerCase()] ?? { dot: 'bg-slate-500', badge: 'text-slate-400 bg-slate-800 border-slate-700' };

  const formatFecha = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Bell size={12} />
          Actividad de Postulaciones
          {postulaciones.length > 0 && (
            <span className="ml-1 bg-indigo-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
              {postulaciones.length}
            </span>
          )}
        </h3>
        <button
          onClick={fetchPostulaciones}
          title="Actualizar"
          className="text-slate-700 hover:text-indigo-400 transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Contenido */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : postulaciones.length === 0 ? (
          /* Estado vacío */
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Briefcase size={16} className="text-slate-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Sin postulaciones activas</p>
              <p className="text-slate-700 text-[10px] mt-1">
                Explora vacantes disponibles y postúlate para ver el seguimiento aquí
              </p>
            </div>
          </div>
        ) : (
          /* Lista de postulaciones */
          <div className="space-y-2">
            {postulaciones.slice(0, 4).map((p: any) => {
              const { dot, badge } = getStyles(p.estado);
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {/* Indicador de estado */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-xs font-bold truncate">
                        {p.vacante?.cargo || 'Vacante'}
                      </p>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge}`}>
                        {p.estado}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] truncate">{p.vacante?.empresa}</p>
                    {p.siguiente_paso && (
                      <p className="text-slate-600 text-[10px] mt-1 leading-snug line-clamp-2">
                        → {p.siguiente_paso}
                      </p>
                    )}
                  </div>

                  {/* Fecha */}
                  <span className="text-[9px] text-slate-700 font-mono flex-shrink-0">
                    {formatFecha(p.fecha_postulacion)}
                  </span>
                </div>
              );
            })}

            {/* Ver más */}
            <button
              onClick={onVerTodas}
              className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-600 hover:text-indigo-400 font-mono transition-colors py-2 border border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl mt-1"
            >
              Ver todas mis postulaciones <ArrowRight size={10} />
            </button>
          </div>
        )}

        {/* Timestamp última actualización */}
        {lastUpdated && (
          <p className="text-[9px] text-slate-800 font-mono text-right mt-3">
            Actualizado: {lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const router = useRouter();
  const { state, setState, logout } = useMagneto();
  const isAuthenticated = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [newSkill, setNewSkill] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [showCvUpload, setShowCvUpload] = useState(false);
  const [cvUploadSuccess, setCvUploadSuccess] = useState(false);
  
  const [editSections, setEditSections] = useState({
    header: false,
    resumen: false,
    info: false,
    skills: false
  });

  const fetchProfile = useCallback(async () => {
    const emailToFetch = state?.perfil_normalizado?.email;
    
    if (!emailToFetch) {
      if (state?.perfil_normalizado) setProfile(state.perfil_normalizado);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/profile/${emailToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile(state.perfil_normalizado);
      }
    } catch (err) {
      console.error("Error de sincronización con app.db:", err);
      setProfile(state?.perfil_normalizado);
    } finally {
      setLoading(false);
    }
  }, [state?.perfil_normalizado]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveChanges = async (sectionKey: string) => {
    if (!profile?.email) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/profile/${profile.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          años_experiencia: parseInt(profile.años_experiencia) || 0,
          habilidades: profile.habilidades || []
        })
      });

      if (res.ok) {
        setEditSections(prev => ({ ...prev, [sectionKey]: false }));
      }
    } catch (err) {
      console.error("Error al persistir en database/app.db:", err);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile?.habilidades?.includes(newSkill.trim())) {
      setProfile({ 
        ...profile, 
        habilidades: [...(profile.habilidades || []), newSkill.trim()] 
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = profile.habilidades.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, habilidades: updatedSkills });
  };

  if (!isAuthenticated) return null;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400 font-mono animate-pulse uppercase tracking-[0.3em] text-xs">
      Accediendo a database/app.db...
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle size={48} className="text-slate-800 mb-4" />
      <h2 className="text-white text-xl font-black mb-4 uppercase tracking-tighter">Perfil no indexado</h2>
      <button onClick={() => router.push('/')} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold text-xs text-white hover:bg-indigo-500 transition-colors">
        REINTENTAR CARGA
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => { logout(); router.replace('/'); }}
          className="text-slate-500 hover:text-white text-sm bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800 transition-all hover:bg-slate-800"
        >
          Cerrar Sesión
        </button>
      </div>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* --- HEADER SECTION --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl">
          <button 
            onClick={() => editSections.header ? saveChanges('header') : setEditSections({...editSections, header: true})}
            className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all z-20"
          >
            {editSections.header ? <Save size={16} /> : <Edit3 size={16} />}
          </button>

          <div className="bg-gradient-to-r from-indigo-500/10 to-transparent p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                {editSections.header ? (
                  <div className="space-y-3">
                    <input 
                      className="bg-slate-950 text-3xl font-black text-white w-full border-b border-indigo-500 outline-none px-2 py-1" 
                      value={profile?.nombre ?? ''} 
                      onChange={e => setProfile({...profile, nombre: e.target.value})} 
                    />
                    <input 
                      className="bg-slate-950 text-indigo-400 font-mono w-full border-b border-slate-700 outline-none px-2 py-1 text-sm" 
                      value={profile?.cargo ?? ''} 
                      onChange={e => setProfile({...profile, cargo: e.target.value})} 
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                      {profile?.nombre || "Candidato Magneto"}
                    </h1>
                    <p className="text-indigo-400 font-mono text-sm uppercase tracking-widest">
                      {profile?.cargo || "Posición no definida"}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5"><Mail size={12}/> {profile?.email}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile?.ubicacion || 'Remoto'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- SIDEBAR --- */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
              <button 
                onClick={() => editSections.skills ? saveChanges('skills') : setEditSections({...editSections, skills: true})}
                className="absolute top-4 right-4 text-slate-600 hover:text-indigo-400 transition-colors"
              >
                {editSections.skills ? <Save size={14} /> : <Edit3 size={14} />}
              </button>
              
              <h3 className="text-white text-[10px] font-black mb-4 uppercase opacity-40 border-l-2 border-indigo-500 pl-2 tracking-tighter">Stack Técnico</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(profile?.habilidades || []).map((skill: string, i: number) => (
                  <span key={i} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-indigo-300 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    {skill}
                    {editSections.skills && <X size={10} className="text-red-500 cursor-pointer hover:scale-125 transition-transform" onClick={() => removeSkill(i)} />}
                  </span>
                ))}
              </div>

              {editSections.skills && (
                <div className="flex gap-2">
                  <input 
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] w-full outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Agregar skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <button onClick={addSkill} className="p-1 bg-indigo-600 rounded text-white hover:bg-indigo-500 transition-colors">
                    <Plus size={14}/>
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button onClick={() => router.push('/Vacantes')} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                <Search size={16}/> VACANTES DISPONIBLES
              </button>
              <button onClick={() => router.push('/Postulaciones')} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-4 rounded-2xl font-bold text-xs transition-all active:scale-95">
                MIS POSTULACIONES
              </button>
              <button
                onClick={() => { setShowCvUpload(v => !v); setCvUploadSuccess(false); }}
                className={`w-full flex items-center justify-center gap-2 border py-4 rounded-2xl font-bold text-xs transition-all active:scale-95 ${
                  showCvUpload
                    ? 'bg-slate-800 border-indigo-500/50 text-indigo-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Upload size={14} /> {showCvUpload ? 'CANCELAR' : 'CARGAR NUEVO CV'}
              </button>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-500 py-4 rounded-2xl font-bold text-xs hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                <Terminal size={16}/> {showLogs ? 'HIDE LOGS' : 'AGENT LOGS'}
              </button>
            </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative group">
              <button 
                onClick={() => editSections.resumen ? saveChanges('resumen') : setEditSections({...editSections, resumen: true})} 
                className="absolute top-6 right-6 text-slate-600 hover:text-indigo-400 transition-colors"
              >
                {editSections.resumen ? <Save size={16} /> : <Edit3 size={16} />}
              </button>
              <h3 className="text-indigo-400 text-[10px] font-black uppercase mb-4 tracking-widest">Resumen Profesional</h3>
              {editSections.resumen ? (
                <textarea 
                  className="w-full bg-slate-950 text-slate-300 text-sm p-4 border border-indigo-500/30 rounded-2xl outline-none focus:border-indigo-500 transition-all" 
                  value={profile?.descripcion ?? ''} 
                  onChange={e => setProfile({...profile, descripcion: e.target.value})} 
                  rows={5} 
                />
              ) : (
                <p className="text-slate-400 text-sm leading-relaxed font-light italic">
                  {profile?.descripcion ? `"${profile.descripcion}"` : "Sin descripción disponible en el sistema."}
                </p>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative group">
              <button 
                onClick={() => editSections.info ? saveChanges('info') : setEditSections({...editSections, info: true})} 
                className="absolute top-6 right-6 text-slate-600 hover:text-indigo-400 transition-colors"
              >
                {editSections.info ? <Save size={16} /> : <Edit3 size={16} />}
              </button>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2 tracking-tighter">
                    <Briefcase size={12}/> Experiencia
                  </p>
                  {editSections.info ? (
                    <input
                      type="number"
                      className="bg-slate-950 border-b border-indigo-500 text-white text-xs w-20 outline-none px-1"
                      value={profile?.años_experiencia ?? 0}
                      onChange={e => setProfile({...profile, años_experiencia: e.target.value})}
                    />
                  ) : (
                    <p className="text-white text-xs font-mono">{profile?.años_experiencia || 0} AÑOS</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2 tracking-tighter">
                    <GraduationCap size={12}/> Formación
                  </p>
                  {editSections.info ? (
                    <input
                      className="bg-slate-950 border-b border-indigo-500 text-white text-xs w-full outline-none px-1"
                      value={profile?.profesion ?? ''}
                      onChange={e => setProfile({...profile, profesion: e.target.value})}
                    />
                  ) : (
                    <p className="text-white text-xs font-mono truncate">{profile?.profesion || 'No especificada'}</p>
                  )}
                </div>

                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2 tracking-tighter">
                    <DollarSign size={12}/> Expectativa Salarial
                  </p>
                  {editSections.info ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        className="bg-slate-950 border-b border-indigo-500 text-white text-xs w-40 outline-none px-1"
                        placeholder="ej: 5000000"
                        value={profile?.salario ?? ''}
                        onChange={e => setProfile({...profile, salario: parseFloat(e.target.value) || 0})}
                      />
                      <span className="text-slate-600 text-[10px] font-mono">COP / mes</span>
                    </div>
                  ) : (
                    <p className="text-white text-xs font-mono">
                      {profile?.salario
                        ? `$ ${Number(profile.salario).toLocaleString('es-CO')} COP / mes`
                        : 'No especificada'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- NOTIFICACIONES DE POSTULACIONES ACTIVAS --- */}
            <PostulacionesNotificaciones
              idPerfil={profile?.id_perfil ?? profile?.id}
              onVerTodas={() => router.push('/Postulaciones')}
            />

          </div>
        </div>

        {/* --- CARGA DE NUEVO CV --- */}
        {showCvUpload && (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Upload size={14} className="text-indigo-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Actualizar CV
              </h3>
              <p className="ml-auto text-[10px] text-slate-600">
                Los agentes extraerán la información y actualizarán tu perfil
              </p>
            </div>

            {cvUploadSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest">
                  CV actualizado correctamente
                </p>
                <p className="text-slate-500 text-xs">Tu perfil ha sido actualizado con los datos del nuevo CV.</p>
                <button
                  onClick={() => { setShowCvUpload(false); setCvUploadSuccess(false); }}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <FileUpload
                profileEmail={profile?.email}
                onSuccess={(data) => {
                  if (data?.perfil_normalizado) {
                    const nuevo = {
                      ...data.perfil_normalizado,
                      id: data.perfil_normalizado.id ?? data.perfil_normalizado.id_perfil,
                    };
                    setProfile(prev => ({ ...prev, ...nuevo }));
                    setState({ perfil_normalizado: nuevo, es_valido: true });
                  }
                  setCvUploadSuccess(true);
                  setShowCvUpload(false);
                  // Reload fresh data from DB
                  fetchProfile();
                }}
              />
            )}
          </div>
        )}

        {/* --- DASHBOARD DE AGENTES --- */}
        {showLogs && (
          <div className="mt-4">
            <DashboardPage />
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;