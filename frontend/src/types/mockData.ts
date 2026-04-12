import type { AgentMeta } from "../types/agents";

// ============================================================
// MOCK DATA — refleja exactamente graph.py y state.py
// Cuando el backend esté listo, esto se reemplaza por
// una llamada a GET /api/agents/status (ver AgentsStatusResponse)
// ============================================================

export const AGENTS_MOCK: AgentMeta[] = [
  {
    id: "cv_parser",
    label: "Lector de CV",
    role: "cv_parser",
    description:
      "Lee el PDF del candidato y extrae el texto crudo para que el resto de agentes pueda trabajar con él. Es el primer paso del flujo.",
    jsonKeys: ["pdf_file", "user_perfil_form"],
    status: "done",
    currentAction: "CV procesado y texto extraído correctamente.",
    processedToday: 14,
  },
  {
    id: "validador_candidato",
    label: "Validador de candidato",
    role: "validador_candidato",
    description:
      "Revisa que el perfil del candidato tenga todos los campos obligatorios completos y coherentes antes de seguir. Si detecta un problema, detiene el flujo y señala qué corregir.",
    jsonKeys: ["perfil_normalizado", "es_valido", "campos_a_corregir", "motivo_critico"],
    status: "done",
    currentAction: "Perfil validado sin errores críticos.",
    processedToday: 14,
  },
  {
    id: "validador_empresa",
    label: "Validador de vacante",
    role: "validador_empresa",
    description:
      "Hace lo mismo que el validador de candidato, pero para la vacante publicada por la empresa. Garantiza que la oferta tenga los datos mínimos para hacer un match justo.",
    jsonKeys: ["vacante_normalizada", "es_valido", "campos_a_corregir", "motivo_critico"],
    status: "active",
    currentAction: "Validando campos de 3 vacantes nuevas recibidas del formulario.",
    processedToday: 9,
  },
  {
    id: "profile_agent",
    label: "Agente de perfil",
    role: "profile_agent",
    description:
      "Construye el perfil profesional normalizado del candidato: habilidades, años de experiencia, sector, cargo esperado y más. Es la base para el matching.",
    jsonKeys: ["perfil_normalizado", "user_perfil_form"],
    status: "waiting",
    currentAction: "Esperando que el validador de vacante termine para cruzar datos.",
    processedToday: 14,
  },
  {
    id: "vacancy_agent",
    label: "Agente de vacante",
    role: "vacancy_agent",
    description:
      "Procesa y normaliza las vacantes publicadas por empresas. Extrae requisitos, habilidades clave y palabras clave para que el advisor pueda comparar correctamente.",
    jsonKeys: ["vacante_normalizada", "user_vacante_form"],
    status: "waiting",
    currentAction: "En espera. Activará el advisor cuando la vacante esté lista.",
    processedToday: 9,
  },
  {
    id: "advisor_agent",
    label: "Agente asesor",
    role: "advisor_agent",
    description:
      "Cruza el perfil del candidato con las vacantes disponibles y genera recomendaciones con puntuación, habilidades coincidentes y habilidades que le faltan al candidato.",
    jsonKeys: ["recomendaciones", "perfil_normalizado", "vacante_normalizada"],
    status: "idle",
    currentAction: "Sin datos listos aún. Activará cuando ambos validadores terminen.",
    processedToday: 6,
  },
  {
    id: "application_agent",
    label: "Agente de postulación",
    role: "application_agent",
    description:
      "Ejecuta la postulación a las vacantes recomendadas una vez que el candidato da su aprobación. Registra el estado inicial de cada postulación.",
    jsonKeys: ["postulacion", "recomendaciones"],
    status: "idle",
    currentAction: "Sin postulaciones pendientes de enviar.",
    processedToday: 3,
  },
  {
    id: "tracker_agent",
    label: "Agente de seguimiento",
    role: "tracker_agent",
    description:
      "Monitorea el estado de las postulaciones enviadas: en qué fase están, cuántos días llevan, qué dice la IA sobre el siguiente paso y cómo va visualmente el proceso.",
    jsonKeys: ["actualizacion", "postulacion"],
    status: "idle",
    currentAction: "Sin postulaciones activas para rastrear en este momento.",
    processedToday: 5,
  },
];

// Orden del flujo según graph.py
export const FLOW_ORDER: AgentMeta["id"][] = [
  "cv_parser",
  "validador_candidato",
  "validador_empresa",
  "profile_agent",
  "vacancy_agent",
  "advisor_agent",
  "application_agent",
  "tracker_agent",
];
