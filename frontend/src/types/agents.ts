// ============================================================
// Tipos derivados directamente de backend/agents/state.py
// ============================================================

export type StatusDB = "sync" | "pending" | "error";

export interface PerfilNormalizado {
  id_perfil: number | null;
  nombre: string;
  telefono: string;
  email: string;
  profesion: string;
  descripcion: string;
  habilidades: string[];
  años_experiencia: number;
  sectores: string;
  cargo: string;
  salario: number;
  educativo: string;
  disponibilidad: string;
  discapacidades: string;
  ubicacion: string;
}

export interface VacanteNormalizada {
  id_vacante: number | null;
  cargo: string;
  empresa: string;
  email: string;
  requisitos: string[];
  descripcion: string;
  habilidades: string[];
  palabras_clave: string[];
}

export interface Recomendacion {
  id_vacante: number;
  nombre_puesto: string;
  empresa: string;
  puntuacion: number;
  link_detalle: string;
  comentario: string;
  habilidades_coincidentes: string[];
  habilidades_faltantes: string[];
}

export interface Postulacion {
  postulacion_id: number;
  estado: string;
}

export interface Seguimiento {
  postulacion_id: number;
  fase_actual: string;
  estado_visual: string;
  mensaje_ia: string;
  dias_desde_postulacion: number;
  siguiente_paso: string;
}

// Estado global del grafo (AgentState de LangGraph)
export interface AgentState {
  user_perfil_form: string;
  pdf_file: unknown;
  user_vacante_form: string;
  perfil_normalizado: PerfilNormalizado;
  vacante_normalizada: VacanteNormalizada;
  es_valido: boolean;
  campos_a_corregir: string[];
  motivo_critico: string;
  status_db: StatusDB;
  recomendaciones: Recomendacion[];
  postulacion: Postulacion;
  actualizacion: Seguimiento;
  history: Record<string, unknown>[];
}

// ============================================================
// Tipos propios del frontend (UI state, no de LangGraph)
// ============================================================

export type AgentStatus = "active" | "idle" | "waiting" | "error" | "done";

export type AgentId =
  | "cv_parser"
  | "validador_candidato"
  | "validador_empresa"
  | "profile_agent"
  | "vacancy_agent"
  | "advisor_agent"
  | "application_agent"
  | "tracker_agent";

export interface AgentMeta {
  id: AgentId;
  label: string;         // Nombre visible al usuario
  role: string;          // Nombre técnico corto (del graph.py)
  description: string;   // Qué hace en lenguaje natural
  jsonKeys: (keyof AgentState)[]; // Qué campos del AgentState maneja
  status: AgentStatus;
  currentAction: string;
  processedToday: number;
}

// Respuesta futura del endpoint GET /api/agents/status
// Estructura pensada para cuando el backend esté listo
export interface AgentsStatusResponse {
  agents: Record<AgentId, {
    status: AgentStatus;
    current_action: string;
    processed_today: number;
  }>;
  last_updated: string; // ISO timestamp
  active_run_id: string | null;
}
