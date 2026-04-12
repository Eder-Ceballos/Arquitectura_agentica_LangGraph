import React from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Terminal, Calendar, DollarSign, GraduationCap 
} from 'lucide-react';

const Profile = () => {
  const { state } = useMagneto();
  const router = useRouter();

  // Si no hay datos, mostramos un estado de carga o redirigimos
  if (!state || !state.perfil_normalizado) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500 mb-4"></div>
        <p>Cargando perfil extraído...</p>
      </div>
    );
  }

  const p = state.perfil_normalizado;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header con Neumorfismo sutil */}
        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight capitalize">
                {p.nombre}
              </h1>
              <p className="text-indigo-400 text-lg font-mono mt-1">
                {p.cargo} | {p.profesion}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-slate-400">
                <span className="flex items-center gap-2"><Mail size={16}/> {p.email}</span>
                <span className="flex items-center gap-2"><MapPin size={16}/> {p.ubicacion}</span>
                <span className="flex items-center gap-2"><Phone size={16}/> {p.telefono}</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/vacantes')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Ver Vacantes Compatibles
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Lateral: Habilidades y Stats */}
          <aside className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-white font-bold mb-4">
                <Terminal size={18} className="text-indigo-400"/> Habilidades Técnicas
              </h3>
              <div className="flex flex-wrap gap-2">
                {p.habilidades.map((s: string, i: number) => (
                  <span key={i} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-sm text-indigo-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><DollarSign size={14}/> Salario</span>
                <span className="text-white font-mono">{p.salario}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2"><Calendar size={14}/> Disponibilidad</span>
                <span className="text-white">{p.disponibilidad}</span>
              </div>
            </div>
          </aside>

          {/* Panel Principal: Resumen y Experiencia */}
          <main className="lg:col-span-2 space-y-8">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Resumen Profesional</h3>
              <p className="text-slate-400 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-2">
                {p.descripcion}
              </p>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6">
                <Briefcase size={20} className="text-indigo-400"/> Trayectoria Extraída
              </h3>
              <div className="space-y-6">
                <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                  <h4 className="text-indigo-300 font-bold text-lg">{p.cargo}</h4>
                  <p className="text-slate-500 text-sm mb-3 underline decoration-indigo-500/30">{p.sectores}</p>
                  <p className="text-slate-300">
                    Sistemas Engineering Student con {p.años_experiencia} años de trayectoria en el sector.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                <GraduationCap size={20} className="text-indigo-400"/> Educación
              </h3>
              <p className="text-slate-300 capitalize bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
                Nivel {p.educativo} - Sin discapacidades registradas: {p.discapacidades}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;