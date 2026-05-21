/**
 * api.ts
 * ------
 * URL base del backend. Leer siempre desde aquí para evitar hardcodear
 * "http://localhost:8000" en cada componente.
 *
 * En producción basta con ajustar NEXT_PUBLIC_API_URL en el entorno de deploy.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
