import React from "react";
import type { AgentMeta } from "../types/agents";
import { StatusBadge, JsonChip } from "./AgentCard";

interface DetailPanelProps {
  agent: AgentMeta;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ agent, onClose }) => {
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

      {/* Nota futura */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          fontSize: 12,
          color: "var(--color-text-tertiary)",
        }}
      >
        Los datos en vivo vendrán de{" "}
        <code style={{ fontFamily: "monospace", background: "var(--color-background-secondary)", padding: "1px 6px", borderRadius: 4 }}>
          GET /api/agents/status
        </code>{" "}
        cuando el backend esté activo.
      </div>
    </div>
  );
};

export default DetailPanel;
