import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_URL } from "../lib/api";

interface BreakdownItem {
  habilidades: number;
  experiencia: number;
  salario: number;
  ubicacion: number;
  habilidades_match: string[];
}

interface RankingEntry {
  id_vacante: string;
  cargo: string;
  empresa: string;
  ubicacion: string;
  modalidad: string;
  salario_min: number;
  salario_max: number;
  score: number;
  breakdown: BreakdownItem;
}

interface RankingTableProps {
  email: string;
  nombreCandidato: string;
  dark?: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color = pct >= 70 ? "#1D9E75" : pct >= 40 ? "#BA7517" : "#E24B4A";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 4, background: "rgba(128,128,128,0.25)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 38, textAlign: "right" }}>
        {score}%
      </span>
    </div>
  );
}

const LIGHT = {
  border: "#e5e5e5",
  textPrimary: "#1a1a1a",
  textSecondary: "#555555",
  textTertiary: "#888888",
  rowAlt: "#f9f9f9",
};

const DARK = {
  border: "#334155",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  rowAlt: "rgba(255,255,255,0.03)",
};

const RankingTable: React.FC<RankingTableProps> = ({ email, nombreCandidato, dark = false }) => {
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = dark ? DARK : LIGHT;

  useEffect(() => {
    if (!email) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/v1/candidates/ranking?email=${encodeURIComponent(email)}`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo obtener el ranking");
        return r.json();
      })
      .then((data) => setRanking(data.ranking ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [email]);

  return (
    <div style={{ marginTop: dark ? 0 : "2rem", paddingTop: dark ? 0 : "1.5rem", borderTop: dark ? "none" : `0.5px solid ${c.border}` }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary, marginBottom: 4 }}>
          Vacantes
        </h2>
        <p style={{ fontSize: 13, color: c.textSecondary }}>
          Vacantes ordenadas por compatibilidad con el perfil de{" "}
          <strong style={{ color: c.textPrimary }}>{nombreCandidato || email}</strong>
        </p>
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: c.textTertiary }}>Calculando ranking…</p>
      )}

      {error && (
        <p style={{ fontSize: 13, color: "#E24B4A" }}>{error}</p>
      )}

      {!loading && !error && ranking.length === 0 && (
        <p style={{ fontSize: 13, color: c.textTertiary }}>
          Sin vacantes disponibles para calcular compatibilidad.
        </p>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["#", "Cargo", "Empresa", "Modalidad", "Habilidades coincidentes", "Compatibilidad"].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: c.textTertiary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: `0.5px solid ${c.border}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((v, i) => (
                <tr
                  key={v.id_vacante}
                  onClick={() => router.push(`/Vacantes/${v.id_vacante}`)}
                  style={{
                    borderBottom: `0.5px solid ${c.border}`,
                    background: i % 2 === 0 ? "transparent" : c.rowAlt,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = dark ? "rgba(99,102,241,0.08)" : "#f0f0ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : c.rowAlt)}
                >
                  <td style={{ padding: "10px 12px", color: c.textTertiary, fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px", color: c.textPrimary, fontWeight: 500 }}>{v.cargo}</td>
                  <td style={{ padding: "10px 12px", color: c.textSecondary }}>{v.empresa}</td>
                  <td style={{ padding: "10px 12px", color: c.textSecondary }}>{v.modalidad || "—"}</td>
                  <td style={{ padding: "10px 12px", maxWidth: 260 }}>
                    {v.breakdown.habilidades_match.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {v.breakdown.habilidades_match.map((h) => (
                          <span
                            key={h}
                            style={{
                              fontSize: 11,
                              padding: "2px 7px",
                              borderRadius: 6,
                              background: dark ? "rgba(99,183,92,0.15)" : "#EAF3DE",
                              color: dark ? "#63b75c" : "#27500A",
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: c.textTertiary }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", minWidth: 160 }}>
                    <ScoreBar score={v.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingTable;
