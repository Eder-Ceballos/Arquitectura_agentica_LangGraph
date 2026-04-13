// MagnetoContext.tsx - Contexto React para gestión global del estado de Magneto
// Implementa patrón Provider-Consumer para compartir estado entre componentes,
// utilizando React Context API para evitar prop drilling en la aplicación.

import React, { createContext, useContext, useState } from 'react';

// Creación del contexto con tipo genérico: permite compartir estado complejo
export const MagnetoContext = createContext<any>(null);

// Provider del contexto: envuelve la aplicación y proporciona estado global
export const MagnetoProvider = ({ children }: { children: React.ReactNode }) => {
  // Estado global de Magneto: almacena datos del perfil y validaciones
  const [magnetoState, setMagnetoState] = useState(null);

  return (
    <MagnetoContext.Provider value={{ magnetoState, setMagnetoState }}>
      {children}
    </MagnetoContext.Provider>
  );
};

// Hook personalizado para consumir el contexto: simplifica acceso al estado global
export const useMagneto = () => useContext(MagnetoContext);