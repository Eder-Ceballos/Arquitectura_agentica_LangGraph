import React, { useEffect, useState } from "react";
import type { AgentId, AgentMeta } from "../types/agents";
import { StatusBadge, JsonChip } from "./AgentCard";
import { useMagneto } from "../context/MagnetoContext";
import { API_URL } from "../lib/api";

// Mismo mapeo que en DashboardPage: AgentId → nombre del agente en BD
const FRONTEND_TO_BACKEND: Partial<Record<AgentId, string>> = {
  profile_agent: "agente_perfil",
  validador_candidato: "agente_validador",
  advisor_agent: "agente_recomendaciones",
  application_agent: "agente_postulaciones",
  tracker_agent: "agente_seguimiento",
};

interface AgentLogEntry {
  id: number;
  run_id: string;
  agente: string;
  evento: string;
  nivel: string;
  mensaje: string | null;
  detalle: string | null;
  duracion_ms: number | null;
  timestamp: string;
}

const NIVEL_COLOR: Record<string, string> = {
  INFO: "#1D9E75",
  WARNING: "#BA7517",
  ERROR: "#E24B4A",
  DEBUG: "#888780",
};

interface DetailPanelProps {
  agent: AgentMeta;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ agent, onClose }) => {
  const { state } = useMagneto();
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const backendAgente = FRONTEND_TO_BACKEND[agent.id];

  useEffect(() => {
    if (!state.run_id || !backendAgente) return;

    setLoadingLogs(true);
    fetch(`${API_URL}/api/v1/logs/${state.run_id}`)
      .then((r) => r.json())
      .then((data) => {
        const filtrados: AgentLogEntry[] = (data.logs ?? []).filter(
          (l: AgentLogEntry) => l.agente === backendAgente
        );
        setLogs(filtrados);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [state.run_id, backendAgente]);

  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.5rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {agent.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
              nodo: {agent.role}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={agent.status} />
          <button
            onClick={onClose}
            style={{
              fontSize: 20,
              color: "var(--color-text-tertiary)",
              cursor: "pointer",
              background: "none",
              border: "none",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Descripción */}
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
        {agent.description}
      </p>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Acción actual</div>
          <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.4 }}>
            {agent.currentAction}
          </div>
        </div>
        <div
          style={{
            background: "var(--color-background-secondary)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Procesados hoy</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {agent.processedToday}
          </div>
        </div>
      </div>

      {/* Campos del AgentState */}
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            fontWeight: 500,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Campos del AgentState que lee / escribe
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {agent.jsonKeys.map((k) => (
            <JsonChip key={k as string} field={k as string} />
          ))}
        </div>
      </div>

      {/* Historial de logs */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "0.5px solid var(--color-border-tertiary)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            fontWeight: 500,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Historial de ejecución
          {state.run_id && (
            <span
              style={{
                marginLeft: 8,
                fontFamily: "monospace",
                fontWeight: 400,
                background: "var(--color-background-secondary)",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 10,
              }}
            >
              {state.run_id.slice(0, 8)}…
            </span>
          )}
        </div>

        {!state.run_id && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Sin ejecución activa. Sube un CV para ver el historial.
          </p>
        )}

        {state.run_id && !backendAgente && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Este agente aún no registra logs.
          </p>
        )}

        {state.run_id && backendAgente && loadingLogs && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Cargando…</p>
        )}

        {state.run_id && backendAgente && !loadingLogs && logs.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Sin eventos registrados para esta ejecución.
          </p>
        )}

        {logs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: "var(--color-background-secondary)",
                  borderRadius: 8,
                  padding: "0.6rem 0.75rem",
                  borderLeft: `3px solid ${NIVEL_COLOR[log.nivel] ?? "#888780"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: NIVEL_COLOR[log.nivel] ?? "#888780" }}>
                    {log.evento}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                    {log.duracion_ms != null ? `${log.duracion_ms}ms` : ""}
                    {" "}
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.mensaje && (
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                    {log.mensaje}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
