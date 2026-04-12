// FileUpload.tsx - Página de carga de CV con integración a grafo de agentes
// Implementa interfaz de usuario para subida de archivos PDF y comunicación con backend FastAPI,
// utilizando React hooks para gestión de estado y efectos visuales.

'use client';
import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onSuccess: (data: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, label: 'Documento', icon: '📄' },
    { id: 2, label: 'Perfil - HU-02', icon: '👤' },
    { id: 3, label: 'Validación', icon: '✅' },
    { id: 4, label: 'Score', icon: '📈' },
  ];

  // Handler para activar selector de archivos: simula clic en input oculto
  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Handler para cambio de archivo: actualiza estado y resetea status
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  // Función principal de análisis: envía archivo al backend y procesa respuesta
  const startAnalysis = async () => {
    if (!file) return;

    setStatus('analyzing');

    try {
      const formData = new FormData();
      formData.append('user_id', 'thomas-01');
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/v1/candidates/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en el servidor de agentes');

      const data = await response.json();

      console.log("🤖 Respuesta del Grafo de Agentes:", data);
      console.log("🚦 ¿El perfil es válido?:", data.es_valido);

      setStatus('done');

      setTimeout(() => {
        onSuccess(data);
      }, 1000);

    } catch (error) {
      console.error("❌ Error en el flujo de agentes:", error);
      setStatus('idle');
      alert("No se pudo conectar con los agentes de Magneto. Revisa que el backend esté corriendo.");
    }
  };

  // Renderizado condicional: muestra zona de carga o timeline de agentes
  return (
    <div className="flex flex-col items-center justify-center p-2 bg-transparent rounded-3xl">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden">

        <div className="p-8 pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf"
          />

          {!file ? (
            <div
              onClick={handleZoneClick}
              className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                📄
              </div>
              <p className="text-slate-500 text-sm font-medium text-center">
                Arrastra tu CV aquí o haz clic para <br />
                <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">subir PDF</span>
              </p>
            </div>
          ) : (
            <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center relative px-2">
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 -z-10" />

                {steps.map((step, idx) => {
                  const isActive = (status === 'analyzing' && idx <= 1) || status === 'done';
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                        isActive
                        ? 'bg-indigo-100 text-indigo-600 scale-110 shadow-sm border-indigo-200'
                        : 'bg-white border border-slate-100 text-slate-300'
                      }`}>
                        {step.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors duration-500 ${
                        isActive ? 'text-indigo-500' : 'text-slate-300'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full shadow-sm">
                  <span className="text-indigo-500 text-sm">📎</span>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                  <button
                    onClick={() => {setFile(null); setStatus('idle')}}
                    className="ml-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={startAnalysis}
              disabled={!file || status === 'analyzing'}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 transform active:scale-[0.98]
                ${!file
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-[#1a1438] hover:bg-[#2a2458] shadow-xl shadow-indigo-100'}`}
            >
              {status === 'analyzing' ? (
                <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                   </svg>
                   Invocando Agentes de IA...
                </span>
              ) : 'Lanzar Análisis de Perfil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};