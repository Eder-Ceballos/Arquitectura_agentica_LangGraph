import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';

export default function Home() {
  const router = useRouter();
  const { state, login } = useMagneto();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // CAMBIO CLAVE: Al estar autenticado, va DIRECTO al Perfil sin validar el CV
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/Profile');
    }
  }, [state.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        login(data.access_token, data.user);
        // Al ejecutarse el login, el useEffect de arriba te enviará de inmediato a /Profile
      } else {
        alert(data.detail || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-sm shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Inicio de Sesión</h1>
          <p className="text-slate-400">Ingresa para gestionar tus agentes e historial</p>
        </div>
                
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="correo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-lg transition-all active:scale-[0.98]"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/register')}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>

      </div>
    </div>
  );
}