import React from "react";
import type { AgentMeta, AgentStatus } from "../types/agents";

// ============================================================
// Paleta por agente — fácil de cambiar cuando haya branding
// ============================================================
const AGENT_COLORS: Record<AgentMeta["id"], { accent: string; iconBg: string; iconText: string }> = {
  cv_parser:            { accent: "#5DCAA5", iconBg: "#E1F5EE", iconText: "#085041" },
  validador_candidato:  { accent: "#7F77DD", iconBg: "#EEEDFE", iconText: "#3C3489" },
  validador_empresa:    { accent: "#378ADD", iconBg: "#E6F1FB", iconText: "#0C447C" },
  profile_agent:        { accent: "#D4537E", iconBg: "#FBEAF0", iconText: "#72243E" },
  vacancy_agent:        { accent: "#BA7517", iconBg: "#FAEEDA", iconText: "#633806" },
  advisor_agent:        { accent: "#639922", iconBg: "#EAF3DE", iconText: "#27500A" },
  application_agent:    { accent: "#D85A30", iconBg: "#FAECE7", iconText: "#4A1B0C" },
  tracker_agent:        { accent: "#534AB7", iconBg: "#EEEDFE", iconText: "#26215C" },
};

const AGENT_ICONS: Record<AgentMeta["id"], string> = {
  cv_parser:           "CV",
  validador_candidato: "V1",
  validador_empresa:   "V2",
  profile_agent:       "Pf",
  vacancy_agent:       "Vac",
  advisor_agent:       "As",
  application_agent:   "Po",
  tracker_agent:       "Tr",
};

// ============================================================
// Badge de estado
// ============================================================
const STATUS_CONFIG: Record<AgentStatus, { label: string; dotColor: string; bg: string; text: string }> = {
  active:  { label: "Activo",     dotColor: "#63b75c", bg: "#EAF3DE", text: "#27500A" },
  done:    { label: "Completado", dotColor: "#1D9E75", bg: "#E1F5EE", text: "#085041" },
  idle:    { label: "En reposo",  dotColor: "#888780", bg: "#F1EFE8", text: "#444441" },
  waiting: { label: "Esperando", dotColor: "#BA7517", bg: "#FAEEDA", text: "#633806" },
  error:   { label: "Error",      dotColor: "#E24B4A", bg: "#FCEBEB", text: "#791F1F" },
};

interface StatusBadgeProps {
  status: AgentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 8,
        background: cfg.bg,
        color: cfg.text,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: cfg.dotColor,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
};

// ============================================================
// Chip de campo JSON
// ============================================================
const JsonChip: React.FC<{ field: string }> = ({ field }) => (
  <span
    style={{
      fontSize: 11,
      fontFamily: "monospace",
      padding: "3px 10px",
      borderRadius: 99,
      background: "#E6F1FB",
      color: "#0C447C",
      display: "inline-block",
    }}
  >
    {field}
  </span>
);

// ============================================================
// AgentCard
// ============================================================
interface AgentCardProps {
  agent: AgentMeta;
  selected: boolean;
  onClick: (id: AgentMeta["id"]) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, selected, onClick }) => {
  const colors = AGENT_COLORS[agent.id];
  const icon = AGENT_ICONS[agent.id];

  return (
    <div
      onClick={() => onClick(agent.id)}
      style={{
        position: "relative",
        background: "var(--color-background-primary)",
        border: selected
          ? "2px solid var(--color-border-info)"
          : "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Acento superior */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: colors.accent,
          borderRadius: "12px 12px 0 0",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: colors.iconBg,
              color: colors.iconText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {agent.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "monospace" }}>
              {agent.role}
            </div>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Acción actual */}
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 12, minHeight: 38 }}>
        {agent.currentAction}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Procesados hoy:{" "}
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{agent.processedToday}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Ver detalle →</span>
      </div>

      {/* Chips JSON en detalle expandido (solo en mobile o si selected) */}
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 8, fontWeight: 500 }}>
            Campos del AgentState que maneja
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agent.jsonKeys.map((k) => (
              <JsonChip key={k} field={k as string} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
export { StatusBadge, JsonChip, STATUS_CONFIG, AGENT_COLORS, AGENT_ICONS };
