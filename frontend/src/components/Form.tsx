import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, MapPin, Code, AlertCircle, CheckCircle2 } from 'lucide-react';

const Form = ({ state, onUpdate }: { state: any; onUpdate: (data: any) => void }) => {
  const {
    perfil_normalizado = {},
    campos_a_corregir = [],
    es_valido = false,
    motivo_critico = ""
  } = state || {};

  const [formData, setFormData] = useState({
    nombre: perfil_normalizado?.nombre || '',
    email: perfil_normalizado?.email || '',
    telefono: perfil_normalizado?.telefono || '',
    profesion: perfil_normalizado?.profesion || '',
    descripcion: perfil_normalizado?.descripcion || '',
    habilidades: perfil_normalizado?.habilidades || [],
    ubicacion: perfil_normalizado?.ubicacion || '',
    años_experiencia: perfil_normalizado?.años_experiencia || 0
  });

  const profileKey = perfil_normalizado?.email || perfil_normalizado?.nombre;

  useEffect(() => {
    if (perfil_normalizado && Object.keys(perfil_normalizado).length > 0) {
      setFormData({
        nombre: perfil_normalizado.nombre || '',
        email: perfil_normalizado.email || '',
        telefono: perfil_normalizado.telefono || '',
        profesion: perfil_normalizado.profesion || '',
        descripcion: perfil_normalizado.descripcion || '',
        habilidades: Array.isArray(perfil_normalizado.habilidades) ? perfil_normalizado.habilidades : [],
        ubicacion: perfil_normalizado.ubicacion || '',
        años_experiencia: perfil_normalizado.años_experiencia || 0
      });
    }
  }, [profileKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(s => s.trim());
    setFormData(prev => ({ ...prev, habilidades: skillsArray }));
  };

  const isInvalid = (fieldName) => {
    if (!campos_a_corregir || !Array.isArray(campos_a_corregir)) return false;
    return campos_a_corregir.includes(fieldName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/v1/candidates/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.status === "success") {
        onUpdate(data);
      }
    } catch (error) {
      console.error("Error al revalidar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

        <div className={`p-6 border-b border-slate-800 ${es_valido ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {es_valido ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-red-500" />}
                {es_valido ? 'Perfil Verificado' : 'Revisión Requerida'}
              </h1>
              <p className="text-slate-400 mt-1">
                {es_valido
                  ? 'Gemini extrajo todo correctamente. Puedes continuar.'
                  : motivo_critico || 'Faltan datos críticos para poder postularte.'}
              </p>
            </div>
            {!es_valido && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full uppercase tracking-wider border border-red-500/30">
                Incompleto
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <h3 className="col-span-full text-sm font-bold uppercase tracking-widest text-blue-500">Datos Personales</h3>
            <div className="space-y-2">
              <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <User size={16} /> Nombre Completo
              </label>
              <input
                name="nombre"
                value={formData?.nombre || ''}
                onChange={handleChange}
                className={`w-full bg-slate-800 border p-3 rounded-lg text-white focus:outline-none transition-all ${
                  isInvalid('nombre') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Mail size={16} /> Email de Contacto
              </label>
              <input
                name="email"
                type="email"
                value={formData?.email || ''}
                onChange={handleChange}
                className={`w-full bg-slate-800 border p-3 rounded-lg text-white focus:outline-none transition-all ${
                  isInvalid('email') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500">Trayectoria y Skills</h3>
            <div className="space-y-2">
              <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Briefcase size={16} /> Profesión o Cargo
              </label>
              <input
                name="profesion"
                value={formData?.profesion || ''}
                onChange={handleChange}
                className={`w-full bg-slate-800 border p-3 rounded-lg text-white focus:outline-none transition-all ${
                  isInvalid('profesion') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:border-blue-500'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <Code size={16} /> Habilidades Técnicas
              </label>
              <textarea
                name="habilidades"
                value={Array.isArray(formData?.habilidades) ? formData.habilidades.join(', ') : ''}
                onChange={handleSkillsChange}
                rows={2}
                className={`w-full bg-slate-800 border p-3 rounded-lg text-white focus:outline-none transition-all ${
                  isInvalid('habilidades') ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700 focus:border-blue-500'
                }`}
                placeholder="React, Python, OSINT..."
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-slate-300 flex items-center gap-2 text-sm font-medium">
                <MapPin size={16} /> Ubicación
              </label>
              <input
                name="ubicacion"
                value={formData?.ubicacion || ''}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">Años de Exp.</label>
              <input
                name="años_experiencia"
                type="number"
                value={formData?.años_experiencia || 0}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </section>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className={`px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg ${
                es_valido
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white animate-pulse'
              }`}
            >
              {es_valido ? 'Continuar a Perfil' : 'Guardar y Revalidar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;