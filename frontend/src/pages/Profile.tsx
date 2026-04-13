import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext'; 
import { 
  Mail, MapPin, Briefcase, ShieldCheck, Search, Edit3, Save, GraduationCap, AlertCircle, ArrowLeft, ClipboardList, X
} from 'lucide-react';

const Profile = () => {
  const router = useRouter();
  const { state } = useMagneto(); 
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // ESTADOS DE EDICIÓN INDEPENDIENTES
  const [editSections, setEditSections] = useState({
    header: false,
    resumen: false,
    info: false
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
      const res = await fetch(`http://localhost:8000/api/v1/profile/${emailToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setProfile(state.perfil_normalizado);
      }
    } catch (err) {
      console.error("Error en sincronización:", err);
    } finally {
      setLoading(false);
    }
  }, [state?.perfil_normalizado?.email]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // FUNCIÓN DE GUARDADO ÚNICA QUE PRESERVA TODO EL OBJETO
  const saveChanges = async (sectionKey: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/profile/${profile.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: profile.nombre,
          cargo: profile.cargo,
          descripcion: profile.descripcion,
          ubicacion: profile.ubicacion,
          profesion: profile.profesion,
          años_experiencia: parseInt(profile.años_experiencia || profile["aÃ±os_experiencia"]) || 0
          // Nota: Las habilidades se mantienen en la DB por el id_perfil, 
          // pero aquí nos aseguramos de no romper el objeto local.
        })
      });

      if (res.ok) {
        setEditSections(prev => ({ ...prev, [sectionKey]: false }));
        // No necesitamos hacer fetch de nuevo si actualizamos el estado localmente bien
      }
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400 font-mono animate-pulse uppercase tracking-widest">Sincronizando app.db...</div>;
  if (!profile) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white"><AlertCircle className="mb-4 text-slate-800" size={50}/><button onClick={() => router.push('/')} className="bg-indigo-600 px-6 py-2 rounded-xl text-xs font-bold">VOLVER AL CARGADOR</button></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* --- CABECERA (NOMBRE Y CARGO) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl group">
          <button 
            onClick={() => editSections.header ? saveChanges('header') : setEditSections({...editSections, header: true})}
            className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all z-10"
          >
            {editSections.header ? <Save size={16} /> : <Edit3 size={16} />}
          </button>

          <div className="bg-gradient-to-r from-indigo-500/10 to-transparent p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={12} /> ID: {profile.id_perfil || 'Temporal'}
              </div>
              
              <div className="space-y-2">
                {editSections.header ? (
                  <div className="space-y-3">
                    <input className="bg-slate-950 text-3xl font-black text-white w-full border-b border-indigo-500 outline-none px-2" 
                           value={profile.nombre} onChange={e => setProfile({...profile, nombre: e.target.value})} />
                    <input className="bg-slate-950 text-indigo-400 font-mono w-full border-b border-slate-700 outline-none px-2" 
                           value={profile.cargo} onChange={e => setProfile({...profile, cargo: e.target.value})} />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{profile.nombre}</h1>
                    <p className="text-indigo-400 font-mono text-sm uppercase tracking-widest">{profile.cargo}</p>
                  </>
                )}
              </div>
              <div className="flex gap-4 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5"><Mail size={12}/> {profile.email}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.ubicacion}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* --- COLUMNA LATERAL (SKILLS Y ACCIONES) --- */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <h3 className="text-white text-[10px] font-black mb-4 uppercase opacity-40 border-l-2 border-indigo-500 pl-2">Skills Extraídas</h3>
              <div className="flex flex-wrap gap-2">
                {profile.habilidades?.map((skill: string, i: number) => (
                  <span key={i} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-indigo-300">{skill}</span>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <button onClick={() => router.push('/Matching')} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                <Search size={16}/> BUSCAR VACANTES
              </button>
              <button onClick={() => router.push('/Applications')} className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 py-4 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all">
                <ClipboardList size={16}/> MIS POSTULACIONES
              </button>
            </div>
          </div>

          {/* --- CONTENIDO PRINCIPAL --- */}
          <div className="md:col-span-2 space-y-6">
            
            {/* SECCIÓN RESUMEN */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative group">
              <button 
                onClick={() => editSections.resumen ? saveChanges('resumen') : setEditSections({...editSections, resumen: true})}
                className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                {editSections.resumen ? <Save size={16} /> : <Edit3 size={16} />}
              </button>
              <h3 className="text-indigo-400 text-[10px] font-black uppercase mb-4 tracking-widest">Resumen Profesional</h3>
              {editSections.resumen ? (
                <textarea className="w-full bg-slate-950 text-slate-300 text-sm p-4 border border-indigo-500/30 rounded-2xl outline-none" 
                          value={profile.descripcion} onChange={e => setProfile({...profile, descripcion: e.target.value})} rows={5} />
              ) : (
                <p className="text-slate-400 text-sm leading-relaxed font-light italic">"{profile.descripcion}"</p>
              )}
            </div>

            {/* SECCIÓN INFO TÉCNICA */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative group">
              <button 
                onClick={() => editSections.info ? saveChanges('info') : setEditSections({...editSections, info: true})}
                className="absolute top-6 right-6 p-2 rounded-lg bg-slate-800 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                {editSections.info ? <Save size={16} /> : <Edit3 size={16} />}
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2"><Briefcase size={12}/> Experiencia</p>
                  {editSections.info ? (
                    <input type="number" className="bg-slate-950 border-b border-indigo-500 text-white text-xs w-20 outline-none" 
                           value={profile.años_experiencia} onChange={e => setProfile({...profile, años_experiencia: e.target.value})} />
                  ) : (
                    <p className="text-white text-xs font-mono">{profile.años_experiencia || profile["aÃ±os_experiencia"] || 0} AÑOS</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-2"><GraduationCap size={12}/> Formación</p>
                  {editSections.info ? (
                    <input className="bg-slate-950 border-b border-indigo-500 text-white text-xs w-full outline-none" 
                           value={profile.profesion} onChange={e => setProfile({...profile, profesion: e.target.value})} />
                  ) : (
                    <p className="text-white text-xs font-mono truncate">{profile.profesion}</p>
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