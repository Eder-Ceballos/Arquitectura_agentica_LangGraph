// _app.tsx - Punto de entrada principal de la aplicación Next.js
// Configura el contexto global y estilos base para toda la aplicación,
// siguiendo el patrón App Router de Next.js 13+.

import "../styles/globals.css";
import type { AppProps } from "next/app";
import { MagnetoProvider } from "../context/MagnetoContext";

// Componente App raíz: envuelve todas las páginas con el contexto Magneto
export default function App({ Component, pageProps }: AppProps) {
  return (
    <MagnetoProvider>
      <Component {...pageProps} />
    </MagnetoProvider>
  );
}