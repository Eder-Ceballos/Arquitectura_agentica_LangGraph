// MagnetoContext.tsx - Adaptación para Flujo Dinámico
import React, { createContext, useContext, useState, useEffect } from 'react';

// Definimos la interfaz para mantener consistencia con los agentes
interface MagnetoState {
  perfil_normalizado: any | null;
  es_valido: boolean;
  history: any[];
}

export const MagnetoContext = createContext<any>(null);

export const MagnetoProvider = ({ children }: { children: React.ReactNode }) => {
  // Inicializamos con la estructura que esperan tus componentes
  const [state, setState] = useState<MagnetoState>({
    perfil_normalizado: null,
    es_valido: false,
    history: []
  });

  // PERSISTENCIA: Al cargar, intentamos recuperar el último perfil de localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('last_magneto_profile');
    if (savedProfile) {
      try {
        setState(prev => ({
          ...prev,
          perfil_normalizado: JSON.parse(savedProfile)
        }));
      } catch (e) {
        console.error("Error recuperando sesión:", e);
      }
    }
  }, []);

  // Función para actualizar el estado y persistir el email de búsqueda
  const updateMagnetoState = (newState: Partial<MagnetoState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      
      // Si el nuevo estado trae un perfil, lo guardamos para evitar el "No hay perfil activo" al recargar
      if (updated.perfil_normalizado) {
        localStorage.setItem('last_magneto_profile', JSON.stringify(updated.perfil_normalizado));
      }
      
      return updated;
    });
  };

  return (
    <MagnetoContext.Provider value={{ state, setState: updateMagnetoState }}>
      {children}
    </MagnetoContext.Provider>
  );
};

export const useMagneto = () => {
  const context = useContext(MagnetoContext);
  if (!context) {
    throw new Error("useMagneto debe usarse dentro de un MagnetoProvider");
  }
  return context;
};