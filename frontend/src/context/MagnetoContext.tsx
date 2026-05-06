import React, { createContext, useContext, useState, useEffect } from 'react';

// Integramos login nuevo
interface MagnetoState {
  perfil_normalizado: any | null;
  es_valido: boolean;
  history: any[];
  token: string | null;
  isAuthenticated: boolean;
}

export const MagnetoContext = createContext<any>(null);

export const MagnetoProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MagnetoState>({
    perfil_normalizado: null,
    es_valido: false,
    history: [],
    token: null, // Se cargará en el useEffect
    isAuthenticated: false,
  });

  // PERSISTENCIA: Al cargar, recuperamos el token y el último perfil
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedProfile = localStorage.getItem('last_magneto_profile');
    
    if (token) {
      setState(prev => ({
        ...prev,
        token: token,
        isAuthenticated: true,
        perfil_normalizado: savedProfile ? JSON.parse(savedProfile) : null
      }));
    }
  }, []);

  // Función genérica para actualizar el estado (la que usa FileUpload)
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
    localStorage.setItem('last_magneto_profile', JSON.stringify(user));
    setState({
      perfil_normalizado: user,
      token: token,
      isAuthenticated: true,
      es_valido: true,
      history: []
    });
  };

  const logout = () => {
    localStorage.clear();
    setState({
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