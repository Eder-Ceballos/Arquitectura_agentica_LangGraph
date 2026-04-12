import React, { useState, useEffect, useCallback } from "react";
import type { AgentMeta } from "../types/agents";
import { AGENTS_MOCK } from "../types/mockData";
import AgentCard from "../components/AgentCard";
import FlowBar from "../components/FlowBar";
import DetailPanel from "../components/DetailPanel";

// ============================================================
// Hook de polling — cuando el backend esté listo, cambiar la
// URL y descomentar el fetch real. Todo lo demás queda igual.
// ============================================================
function useAgentsStatus(intervalMs = 10000) {
  const [agents, setAgents] = useState<AgentMeta[]>(AGENTS_MOCK);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(async () => {
    // TODO: descomentar cuando el backend esté listo
    // try {
    //   const res = await fetch("/api/agents/status");
    //   const data: AgentsStatusResponse = await res.json();
    //   setAgents(prev =>
    //     prev.map(a => ({
    //       ...a,
    //       status: data.agents[a.id]?.status ?? a.status,
    //       currentAction: data.agents[a.id]?.current_action ?? a.currentAction,
    //       processedToday: data.agents[a.id]?.processed_today ?? a.processedToday,
    //     }))
    //   );
    // } catch (e) {
    //   console.error("Error polling /api/agents/status:", e);
    // }
    setLastUpdated(new Date());
    setSecondsAgo(0);
  }, []);

  // Polling
  useEffect(() => {
    const poll = setInterval(refresh, intervalMs);
    return () => clearInterval(poll);
  }, [refresh, intervalMs]);

  // Contador de segundos desde último update
  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  return { agents, lastUpdated, secondsAgo, refresh };
}

// ============================================================
// Conteo de estados para el header
// ============================================================
function countByStatus(agents: AgentMeta[]) {
  return agents.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
}

// ============================================================
// DashboardPage
// ============================================================
const DashboardPage: React.FC = () => {
  const { agents, secondsAgo, refresh } = useAgentsStatus();
  const [selectedId, setSelectedId] = useState<AgentMeta["id"] | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedId) ?? null;
  const counts = countByStatus(agents);

  const handleSelect = (id: AgentMeta["id"]) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const timeLabel =
    secondsAgo < 60
      ? `hace ${secondsAgo} s`
      : `hace ${Math.floor(secondsAgo / 60)} min`;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem 3rem" }}>

      {/* Header */}
      <div
        style={{
          padding: "1.5rem 0 1rem",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Panel de agentes
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {counts.active ? (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 500,
                  padding: "3px 10px", borderRadius: 8,
                  background: "#EAF3DE", color: "#27500A",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#63b75c", display: "inline-block" }} />
                {counts.active} activo{counts.active > 1 ? "s" : ""}
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 500,
                  padding: "3px 10px", borderRadius: 8,
                  background: "#F1EFE8", color: "#444441",
                }}
              >
                Sistema en reposo
              </span>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Monitoreo del flujo LangGraph — automatización de perfiles y vacantes
        </p>
      </div>

      {/* Barra de refresh */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          Última actualización: {timeLabel}
        </span>
        <button
          onClick={refresh}
          style={{
            fontSize: 12, padding: "5px 14px", cursor: "pointer",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 8, background: "none",
            color: "var(--color-text-secondary)",
          }}
        >
          Actualizar
        </button>
      </div>

      {/* Flujo del grafo */}
      <FlowBar agents={agents} selectedId={selectedId} onSelect={handleSelect} />

      {/* Panel de detalle */}
      {selectedAgent && (
        <DetailPanel agent={selectedAgent} onClose={() => setSelectedId(null)} />
      )}

      {/* Grid de tarjetas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selectedId === agent.id}
            onClick={handleSelect}
          />
        ))}
      </div>

      {/* Leyenda de estados */}
      <div
        style={{
          marginTop: "2rem",
          paddingTop: "1rem",
          borderTop: "0.5px solid var(--color-border-tertiary)",
          display: "flex", flexWrap: "wrap", gap: 16,
        }}
      >
        {(
          [
            { status: "active",  label: "Procesando en este momento" },
            { status: "done",    label: "Completó su tarea en este ciclo" },
            { status: "waiting", label: "Esperando que otro agente termine" },
            { status: "idle",    label: "Sin tareas asignadas" },
            { status: "error",   label: "Requiere atención" },
          ] as { status: string; label: string }[]
        ).map(({ status, label }) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background:
                  status === "active" ? "#63b75c" :
                  status === "done" ? "#1D9E75" :
                  status === "waiting" ? "#BA7517" :
                  status === "error" ? "#E24B4A" : "#888780",
              }}
            />
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{status}</span>
            — {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
