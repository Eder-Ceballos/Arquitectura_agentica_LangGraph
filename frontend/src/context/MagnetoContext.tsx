import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Añadimos 'user' a la interfaz para mantener separada la sesión del perfil extraído
interface MagnetoState {
  user: any | null; 
  perfil_normalizado: any | null;
  es_valido: boolean;
  history: any[];
  token: string | null;
  isAuthenticated: boolean;
}

export const MagnetoContext = createContext<any>(null);

export const MagnetoProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MagnetoState>({
    user: null, // <--- Nueva propiedad intocable para la cuenta
    perfil_normalizado: null,
    es_valido: false,
    history: [],
    token: null,
    isAuthenticated: false,
  });

  // PERSISTENCIA: Recuperamos token, cuenta de usuario y el último perfil
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedProfile = localStorage.getItem('last_magneto_profile');
    const savedUser = localStorage.getItem('magneto_user'); // Recuperamos el usuario
    
    if (token) {
      setState(prev => ({
        ...prev,
        token: token,
        isAuthenticated: true,
        user: savedUser ? JSON.parse(savedUser) : null,
        perfil_normalizado: savedProfile ? JSON.parse(savedProfile) : null
      }));
    }
  }, []);

  // Función genérica para actualizar el estado
  const updateState = (newState: Partial<MagnetoState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      if (updated.perfil_normalizado) {
        localStorage.setItem('last_magneto_profile', JSON.stringify(updated.perfil_normalizado));
      }
      return updated;
    });
  };

  // Función específica para el login exitoso
  const login = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('magneto_user', JSON.stringify(user)); // Guardamos la cuenta
    
    setState({
      user: user, // Asignamos la cuenta a su espacio dedicado
      perfil_normalizado: null, // Dejamos el perfil vacío hasta cargar el CV
      token: token,
      isAuthenticated: true,
      es_valido: true,
      history: []
    });
  };

  const logout = () => {
    localStorage.clear();
    setState({
      user: null,
      perfil_normalizado: null,
      token: null,
      isAuthenticated: false,
      es_valido: false,
      history: []
    });
  };

  return (
    <MagnetoContext.Provider value={{ state, setState: updateState, login, logout }}>
      {children}
    </MagnetoContext.Provider>
  );
};

export const useMagneto = () => useContext(MagnetoContext);