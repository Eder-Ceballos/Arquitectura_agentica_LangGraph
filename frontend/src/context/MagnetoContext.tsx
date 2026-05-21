import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../lib/api';

// Integramos login nuevo
interface MagnetoState {
  perfil_normalizado: any | null;
  es_valido: boolean;
  history: any[];
  run_id: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const MagnetoContext = createContext<any>(null);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const MagnetoProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<MagnetoState>({
    perfil_normalizado: null,
    es_valido: false,
    history: [],
    run_id: null,
    token: null,
    isAuthenticated: false,
  });

  // PERSISTENCIA: Al cargar, recuperamos el token y validamos que no haya expirado.
  // Luego hacemos un fetch fresco del perfil desde el backend para garantizar
  // que habilidades y datos del CV estén siempre actualizados.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (isTokenExpired(token)) {
      localStorage.clear();
      return;
    }

    const savedProfile = localStorage.getItem('last_magneto_profile');
    const parsedProfile = savedProfile ? JSON.parse(savedProfile) : null;

    // Restore immediately from localStorage so the UI no longer flickers
    setState(prev => ({
      ...prev,
      token,
      isAuthenticated: true,
      perfil_normalizado: parsedProfile,
      es_valido: !!(parsedProfile?.habilidades?.length > 0 || parsedProfile?.profesion),
    }));

    // Fetch fresh profile in background to pick up any DB changes
    const email = parsedProfile?.email;
    if (email) {
      fetch(`${API_URL}/api/v1/profile/${encodeURIComponent(email)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (!data) return;
          const fullProfile = { ...data, id: data.id_perfil, es_valido: true };
          setState(prev => ({
            ...prev,
            perfil_normalizado: fullProfile,
            es_valido: true,
          }));
          localStorage.setItem('last_magneto_profile', JSON.stringify(fullProfile));
        })
        .catch(() => {});
    }
  }, []);

  // Función genérica para actualizar el estado (la que usa FileUpload)
  const updateState = (newState: Partial<MagnetoState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      // Preservar email, id e id_perfil del perfil anterior si el nuevo no los trae
      if (updated.perfil_normalizado && prev.perfil_normalizado) {
        const prev_p = prev.perfil_normalizado;
        const next_p = updated.perfil_normalizado;
        updated.perfil_normalizado = {
          ...next_p,
          email:      next_p.email      || prev_p.email      || "",
          id:         next_p.id         ?? next_p.id_perfil  ?? prev_p.id         ?? prev_p.id_perfil ?? null,
          id_perfil:  next_p.id_perfil  ?? next_p.id         ?? prev_p.id_perfil  ?? prev_p.id        ?? null,
        };
      }
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
      history: [],
      run_id: null,
    });
  };

  const logout = () => {
    localStorage.clear();
    setState({
      perfil_normalizado: null,
      token: null,
      isAuthenticated: false,
      es_valido: false,
      history: [],
      run_id: null,
    });
  };

  return (
    <MagnetoContext.Provider value={{ state, setState: updateState, login, logout }}>
      {children}
    </MagnetoContext.Provider>
  );
};

export const useMagneto = () => useContext(MagnetoContext);