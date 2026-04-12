import React from "react";
import type { AgentMeta, AgentStatus } from "../types/agents";
import { FLOW_ORDER } from "../types/mockData";

const FLOW_LABELS: Record<AgentMeta["id"], string> = {
  cv_parser:           "CV",
  validador_candidato: "Val. candidato",
  validador_empresa:   "Val. vacante",
  profile_agent:       "Perfil",
  vacancy_agent:       "Vacante",
  advisor_agent:       "Asesor",
  application_agent:   "Postulación",
  tracker_agent:       "Seguimiento",
};

const STATUS_NODE_STYLE: Record<AgentStatus, React.CSSProperties> = {
  active:  { background: "#EAF3DE", color: "#27500A", border: "0.5px solid #97C459" },
  done:    { background: "#E1F5EE", color: "#085041", border: "0.5px solid #5DCAA5" },
  idle:    { background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", border: "0.5px solid var(--color-border-tertiary)" },
  waiting: { background: "#FAEEDA", color: "#633806", border: "0.5px solid #EF9F27" },
  error:   { background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F09595" },
};

interface FlowBarProps {
  agents: AgentMeta[];
  selectedId: AgentMeta["id"] | null;
  onSelect: (id: AgentMeta["id"]) => void;
}

const FlowBar: React.FC<FlowBarProps> = ({ agents, selectedId, onSelect }) => {
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          marginBottom: 12,
        }}
      >
        Flujo del grafo — LangGraph
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {FLOW_ORDER.map((id, i) => {
          const agent = agentMap[id];
          if (!agent) return null;
          const nodeStyle = STATUS_NODE_STYLE[agent.status];
          const isSelected = selectedId === id;

          return (
            <React.Fragment key={id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => onSelect(id)}
                  style={{
                    ...nodeStyle,
                    minWidth: 80,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    outline: isSelected ? "2px solid var(--color-border-info)" : "none",
                    outlineOffset: 2,
                    padding: "0 8px",
                    whiteSpace: "nowrap",
                    transition: "outline 0.1s",
                  }}
                >
                  {FLOW_LABELS[id]}
                </button>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", maxWidth: 80 }}>
                  {agent.role}
                </span>
              </div>

              {i < FLOW_ORDER.length - 1 && (
                <span style={{ color: "var(--color-text-tertiary)", fontSize: 14, flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FlowBar;
