import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Terminal, Calendar, DollarSign, GraduationCap, 
  ShieldCheck, FileText, Code2, Search, Send
} from 'lucide-react';

const Profile = () => {
  const router = useRouter();
  const [showLogs, setShowLogs] = useState(false);

  // Datos estáticos de ejemplo
  const p = {
    nombre: "Eder Santiago Ceballos Quiroz",
    cargo: "Desarrollador React | Aspirante Red Team",
    profesion: "Ingeniero de Sistemas",
    email: "ederceballos874@gmail.com",
    telefono: "+57 3205041789",
    ubicacion: "Medellín, Antioquia",
    descripcion: "Aspirante al área de Red Team y seguridad ofensiva, con conocimientos en programación, redes, sistemas Linux y fundamentos de ciberseguridad. Enfocado en el aprendizaje continuo.",
    habilidades: ["Python", "React", "Linux", "OSINT", "OWASP", "Docker", "Nmap"],
    salario: "$5.000.000 - $7.000.000",
    disponibilidad: "Inmediata",
    educativo: "Ingeniería de Sistemas - Universidad EAFIT",
    años_experiencia: "1",
    sectores: "Tecnología, Ciberseguridad"
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] font-bold text-slate-600 hover:text-indigo-400 transition-colors tracking-widest"
          >
            ← RE-SUBIR CV
          </button>
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center gap-2"
          >
            <Terminal size={12} /> {showLogs ? 'HIDE LOGS' : 'VIEW AGENT LOGS'}
          </button>
        </div>

        {/* Card Principal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-6">
          
          {/* Header con Botones de Navegación */}
          <div className="bg-gradient-to-b from-slate-800/50 to-slate-900 p-8 border-b border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} /> Perfil Procesado
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">{p.nombre}</h1>
                <p className="text-indigo-400 font-mono text-sm">{p.cargo}</p>
              </div>

              {/* ACCIONES PRINCIPALES */}
              <div className="flex flex-col w-full md:w-auto gap-3">
                <button 
                  onClick={() => router.push('/Matching')}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Search size={18} /> Ver Vacantes
                </button>
                <button 
                  onClick={() => router.push('/Postulaciones')}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Send size={18} /> Ver Postulaciones
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Información Detallada */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Sidebar Técnico */}
            <div className="space-y-6">
              <div>
                <h3 className="text-white text-[10px] font-black mb-4 tracking-[0.2em] uppercase opacity-50">Tech Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {p.habilidades.map((skill, i) => (
                    <span key={i} className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-[11px] font-mono text-indigo-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Salario</span>
                  <span className="text-white font-mono">{p.salario}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Ubicación</span>
                  <span className="text-white">{p.ubicacion}</span>
                </div>
              </div>
            </div>

            {/* Contenido Principal */}
            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-white text-[10px] font-black mb-3 tracking-[0.2em] uppercase opacity-50 text-indigo-400">Agent Summary</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  {p.descripcion}
                </p>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <Briefcase size={16} className="text-indigo-500 mb-2"/>
                  <p className="text-white text-xs font-bold">{p.cargo}</p>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase">{p.años_experiencia} Año(s) de exp.</p>
                </div>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <GraduationCap size={16} className="text-indigo-500 mb-2"/>
                  <p className="text-white text-xs font-bold">Educación</p>
                  <p className="text-slate-500 text-[10px] mt-1 uppercase">EAFIT - Ingeniería</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Logs Section */}
        {showLogs && (
          <div className="bg-black border border-slate-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
              <span className="text-[10px] font-mono text-indigo-500 tracking-widest">RUNNING_MAGNETO_GRAV_V2</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div className="p-4 font-mono text-[10px] text-green-500/70 space-y-1 max-h-32 overflow-y-auto">
              <p>{`> [SYSTEM] Profile component mounted`}</p>
              <p>{`> [DATA] Hydrating from MagnetoContext`}</p>
              <p className="text-white">{`> [SUCCESS] Fields mapped for Eder Ceballos`}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;