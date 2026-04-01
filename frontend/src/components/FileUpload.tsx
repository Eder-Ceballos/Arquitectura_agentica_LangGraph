import React, { useState, useRef } from 'react';

/**
 * COMPONENTE: FileUpload (HU-00: Maquinaria de Agentes)
 * DESCRIPCIÓN: Interfaz moderna y minimalista para la carga y procesamiento de CVs.
 * INTEGRACIÓN: Diseñado para encajar en el ecosistema de Magneto.
 */
export const FileUpload = () => {
  // --- ESTADOS (Lógica de Control) ---
  
  // Almacena el archivo PDF seleccionado por el usuario
  const [file, setFile] = useState<File | null>(null);
  
  // Controla el flujo visual de la "máquina": 
  // 'idle' (espera), 'analyzing' (agentes trabajando), 'done' (proceso terminado)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');

  // Referencia al input de tipo file real (que está oculto)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CONFIGURACIÓN VISUAL ---
  
  // Pasos que representan la orquestación de agentes (HU-00 a HU-02)
  const steps = [
    { id: 1, label: 'Documento', icon: '📄' },
    { id: 2, label: 'Perfil - HU-02', icon: '👤' },
    { id: 3, label: 'Validación', icon: '✅' },
    { id: 4, label: 'Score', icon: '📈' },
  ];

  // --- HANDLERS (Funciones de Acción) ---

  /**
   * Dispara el selector de archivos del sistema usando la referencia del input oculto
   */
  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Se ejecuta cuando el usuario selecciona un archivo
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle'); // Reiniciar estado al cambiar de archivo
    }
  };

  /**
   * PUNTO DE INTEGRACIÓN (Para Thomas/David):
   * Aquí es donde se debe implementar la llamada a la API de FastAPI.
   */
  const startAnalysis = async () => {
    if (!file) return;
    
    // 1. Cambiamos la UI al modo "Procesando"
    setStatus('analyzing');

    /* TODO: Implementar lógica real aquí:
       const formData = new FormData();
       formData.append('file', file);
       const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData });
    */

    // Simulación temporal de procesamiento (4 segundos)
    setTimeout(() => {
      setStatus('done');
    }, 4000);
  };

  return (
    // Contenedor principal con fondo sutil y bordes redondeados (Estilo Moderno)
    <div className="min-h-[500px] flex items-center justify-center p-6 bg-gray-50/50 rounded-3xl">
      
      {/* Tarjeta del Componente (Neumorfismo suave / Minimalista) */}
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
        
        {/* CABECERA: Identidad visual de Magneto */}
        <div className="p-8 pb-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            M
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Analizador de CV con IA</h2>
            <p className="text-sm text-slate-400 font-medium tracking-tight text-uppercase">Maquinaria de Agentes (HU-00)</p>
          </div>
        </div>

        <div className="p-8 pt-4">
          {/* INPUT TÉCNICO: Oculto para no romper el diseño, activado por la Ref */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf" 
          />

          {/* ÁREA DE CARGA: Se muestra solo si no hay archivo seleccionado */}
          {!file ? (
            <div 
              onClick={handleZoneClick}
              className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                📄
              </div>
              <p className="text-slate-500 text-sm font-medium text-center leading-relaxed">
                Arrastre su CV aquí o haga clic para <br />
                <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">subir (Solo .PDF)</span>
              </p>
            </div>
          ) : (
            /* FLUJO DE AGENTES: Se activa al seleccionar un archivo */
            <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center relative px-2">
                
                {/* Línea decorativa que conecta los pasos */}
                <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 -z-10" />
                
                {/* Mapeo de la red de agentes */}
                {steps.map((step, idx) => {
                  // Lógica visual: Se ilumina si estamos en ese paso o si ya terminó
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

              {/* INDICADOR DE ARCHIVO: Muestra el nombre del PDF cargado */}
              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full shadow-sm">
                  <span className="text-indigo-500 text-sm">📎</span>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                  <button 
                    onClick={() => {setFile(null); setStatus('idle')}} 
                    className="ml-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar archivo"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOTONERA DE ACCIÓN */}
          <div className="mt-8 space-y-4">
            <button
              onClick={startAnalysis}
              disabled={!file || status === 'analyzing'}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 transform active:scale-[0.98]
                ${!file 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'bg-[#1a1438] hover:bg-[#2a2458] shadow-xl shadow-indigo-100'}`}
            >
              {/* Texto dinámico basado en el estado del agente */}
              {status === 'analyzing' ? (
                <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                   </svg>
                   Orquestando Agentes...
                </span>
              ) : 'Analizar Hoja de Vida con IA'}
            </button>
            
            {/* Opción para resetear el componente */}
            {file && status !== 'analyzing' && (
              <button 
                onClick={() => {setFile(null); setStatus('idle')}}
                className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
              >
                Limpiar selección y reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};