import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Terminal, ShieldCheck, FileText, Code2, Search, Send, Edit3, Save
} from 'lucide-react';

const Profile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 1. CARGAR DATOS DE LA DB AL INICIAR
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const email = "ederceballos874@gmail.com"; // Email base en tu db [cite: 150]
        const res = await fetch(`/api/profile/${email}`);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error cargando DB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. ACTUALIZAR EN LA DB
  const handleSave = async () => {
    try {
      await fetch(`/api/profile/${profile.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      setIsEditing(false);
      alert("Base de datos actualizada.");
    } catch (err) {
      alert("Error al guardar.");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Conectando a app.db...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* BOTÓN PEQUEÑO DE EDICIÓN */}
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-indigo-600 rounded-full transition-all text-white z-20"
          >
            {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
          </button>

          <div className="bg-gradient-to-b from-slate-800/50 to-slate-900 p-8 border-b border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2 w-full">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} /> Datos de app.db 
                </div>
                
                {isEditing ? (
                  <input 
                    className="bg-slate-950 text-4xl font-black text-white w-full border-b border-indigo-500 outline-none"
                    value={profile.nombre}
                    onChange={(e) => setProfile({...profile, nombre: e.target.value})}
                  />
                ) : (
                  <h1 className="text-4xl font-black text-white tracking-tight">{profile.nombre}</h1>
                )}

                <p className="text-indigo-400 font-mono text-sm">{profile.cargo}</p>
              </div>

              <div className="flex flex-col w-full md:w-auto gap-3">
                <button onClick={() => router.push('/Matching')} className="flex items-center justify-center gap-2 bg-indigo-600 px-6 py-3 rounded-xl font-bold text-sm shadow-indigo-600/20 shadow-lg">
                  <Search size={18} /> Ver Vacantes
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Habilidades leídas de la tabla habilidades [cite: 31, 188] */}
            <div className="space-y-6">
              <div>
                <h3 className="text-white text-[10px] font-black mb-4 tracking-[0.2em] uppercase opacity-50">Tech Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.habilidades?.map((skill: string, i: number) => (
                    <span key={i} className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-indigo-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-white text-[10px] font-black mb-3 tracking-[0.2em] uppercase opacity-50 text-indigo-400">Resumen Profesional</h3>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-slate-950 text-slate-400 text-sm p-4 border border-indigo-500 rounded-xl outline-none"
                    value={profile.descripcion}
                    onChange={(e) => setProfile({...profile, descripcion: e.target.value})}
                    rows={4}
                  />
                ) : (
                  <p className="text-slate-400 text-sm leading-relaxed font-light">{profile.descripcion}</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;