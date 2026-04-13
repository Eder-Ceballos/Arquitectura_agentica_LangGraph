'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import Form from '../components/Form';

const FormUser = () => {
  const { state, setState } = useMagneto();
  const router = useRouter();

  useEffect(() => {
    if (!state?.perfil_normalizado) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  const handleUpdate = (updatedProfile: any) => {
    setState({
      ...state,
      perfil_normalizado: updatedProfile.perfil_normalizado || updatedProfile,
      es_valido: true,
      campos_a_corregir: []
    });
    router.push('/Profile');
  };

  if (!state?.perfil_normalizado) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold">No se detectaron datos de agentes</h2>
        <p className="text-slate-400 mt-2 text-center">
          Por favor, sube tu CV en la página de inicio. <br />
          Redirigiendo automáticamente...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <button
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-blue-400 text-sm font-bold mb-8 transition-colors flex items-center gap-2"
        >
          ← Volver a subir archivo
        </button>
        <Form
          state={state}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
};

export default FormUser;