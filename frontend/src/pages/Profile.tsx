import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext'; 
import { 
  Mail, MapPin, Briefcase, ShieldCheck, Search, Edit3, Save, GraduationCap, 
  AlertCircle, ArrowLeft, ClipboardList, X, Terminal, Plus
} from 'lucide-react';

const Profile = () => {
  const router = useRouter();
  const { state } = useMagneto(); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [newSkill, setNewSkill] = useState(''); 
  
  const [editSections, setEditSections] = useState({
    header: false,
    resumen: false,
    info: false,
    skills: false
  });

  const fetchProfile = useCallback(async () => {
    // Priorizamos el email del estado global de Magneto
    const emailToFetch = state?.perfil_normalizado?.email;
    
    if (!emailToFetch) {
      if (state?.perfil_normalizado) setProfile(state.perfil_normalizado);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/v1/profile/${emailToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        // Fallback al estado local si la API falla o el perfil es nuevo
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
      const res = await fetch(`http://localhost:8000/api/v1/profile/${profile.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          // Limpieza de tipos para SQLite
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
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12} /> Sync: database/app.db
              </div>
              
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
              <button onClick={() => router.push('/Matching')} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                <Search size={16}/> BUSCAR VACANTES
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-500 py-4 rounded-2xl font-bold text-xs hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                <Terminal size={16}/> AGENT LOGS
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;