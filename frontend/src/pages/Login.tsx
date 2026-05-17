import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';

export const Login = () => {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useMagneto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering
      ? 'http://localhost:8000/api/v1/auth/register'
      : 'http://localhost:8000/api/v1/auth/login';

    const payload = isRegistering
      ? { email, password, nombre }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setError('');
          setIsRegistering(false);
          setEmail(email);
          setPassword('');
          alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        } else {
          login(data.access_token, data.user);

          // If the user already has CV data in their profile, go straight to Profile
          const user = data.user ?? {};
          const hasProfile =
            (Array.isArray(user.habilidades) && user.habilidades.length > 0) ||
            !!user.profesion;

          if (hasProfile) {
            router.push('/Profile');
          }
          // Otherwise stay on /  — index.tsx will show the FileUpload form
        }
      } else {
        setError(data.detail || 'Credenciales incorrectas. Intenta de nuevo.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? 'Crea tu cuenta' : 'Inicio de Sesión'}
          </h1>
          <p className="text-slate-400">
            {isRegistering ? 'Únete a la plataforma de agentes' : 'Ingresa para gestionar tus agentes'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="correo@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-lg transition-all active:scale-[0.98]"
          >
            {loading
              ? (isRegistering ? 'Registrando...' : 'Entrando...')
              : (isRegistering ? 'Registrarse' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};
