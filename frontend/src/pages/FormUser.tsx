// FormUser.tsx - Página contenedor para formulario de validación de perfiles
// Implementa lógica de navegación y sincronización con contexto global,
// utilizando Next.js router y React hooks para manejo de estado y efectos.

'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';
import Form from '../components/Form';

const FormUser = () => {
  const { magnetoState, setMagnetoState } = useMagneto();
  const router = useRouter();

  // Efecto de seguridad: redirige a home si no hay estado de agentes
  useEffect(() => {
    if (!magnetoState) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [magnetoState, router]);

  // Handler de actualización: procesa datos corregidos y actualiza estado global
  const handleUpdate = (updatedProfile: any) => {
    console.log("Datos corregidos recibidos en el contenedor:", updatedProfile);

    setMagnetoState({
      ...magnetoState,
      perfil_normalizado: updatedProfile,
      es_valido: true,
      campos_a_corregir: []
    });

    alert("Perfil actualizado correctamente. Listo para el matching.");
  };

  // Renderizado condicional: muestra loading si no hay estado de agentes
  if (!magnetoState) {
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

  // Renderizado principal: layout con navegación y componente Form
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
          state={magnetoState}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
};

export default FormUser;