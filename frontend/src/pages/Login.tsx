import React, { useState } from 'react';
import { useMagneto } from '../context/MagnetoContext';

export const Login = () => {
  // Estado para alternar entre Login y Registro
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Nuevo campo para registro
  
  const { login } = useMagneto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Elegimos el endpoint según el modo
    const endpoint = isRegistering 
      ? 'http://localhost:8000/api/v1/auth/register' 
      : 'http://localhost:8000/api/v1/auth/login';

    // Para el registro necesitamos enviar también el nombre
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
          alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
          setIsRegistering(false); // Pasamos al modo login automáticamente
        } else {
          login(data.access_token, data.user);
        }
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
          {/* Ajuste de Título según modo */}
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? 'Crea tu cuenta' : 'Inicio de Sesión'}
          </h1>
          <p className="text-slate-400">
            {isRegistering ? 'Únete a la plataforma de agentes' : 'Ingresa para gestionar tus agentes'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Nombre: Solo aparece en Registro */}
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="correo@gmail.com" // Ajuste del placeholder solicitado
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
            {isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        {/* Opción para alternar entre Login y Registro */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
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