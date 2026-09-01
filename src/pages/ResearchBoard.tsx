import { useEffect, useMemo, useState } from "react";
import { rankMarketCandidates, type OddsEvent } from "../lib/research/marketValue";

const SPORTS = ["AFL", "NRL", "NRLW", "NBA", "WNBA"] as const;
type ResearchSport = (typeof SPORTS)[number];

interface BoardResponse {
  sport: ResearchSport;
  fetchedAt: string;
  quota?: { remaining?: string | null; used?: string | null; last?: string | null };
  events: OddsEvent[];
  error?: string;
  code?: string;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function ResearchBoard() {
  const [sport, setSport] = useState<ResearchSport>("AFL");
  const [data, setData] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/market-board?sport=${sport}`, { signal: controller.signal })
      .then(async (r) => {
        const json = (await r.json()) as BoardResponse;
        if (!r.ok) throw new Error(json.error || `Request failed (${r.status})`);
        return json;
      })
      .then(setData)
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err instanceof Error ? err.message : "Unable to load research board");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [sport]);

  const ranked = useMemo(() => rankMarketCandidates(data?.events ?? []), [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--series-1)" }}>Preemiyum Research Engine · Phase 1</div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1" style={{ color: "var(--ink-primary)" }}>Live Market Board</h1>
          <p className="text-sm mt-1 max-w-3xl" style={{ color: "var(--ink-secondary)" }}>
            Australian bookmaker comparison with no-vig consensus pricing. This first layer detects price/value discrepancies; it is not yet the full player-projection model.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map((s) => (
            <button key={s} onClick={() => setSport(s)} className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
              style={{ background: s === sport ? "var(--series-1)" : "var(--surface-sunken)", color: s === sport ? "var(--surface-page)" : "var(--ink-secondary)", border: "1px solid var(--border-hairline)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Events", data?.events?.length ?? 0],
          ["Selections", ranked.length],
          ["Official candidates", ranked.filter((x) => x.classification === "OFFICIAL CANDIDATE").length],
          ["Watch", ranked.filter((x) => x.classification === "WATCH").length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl p-4" style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
            <div className="text-[10px] uppercase tracking-wide font-bold" style={{ color: "var(--ink-muted)" }}>{label}</div>
            <div className="text-2xl font-extrabold mt-1 tabular">{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface-card)", color: "var(--ink-muted)", border: "1px solid var(--border-hairline)" }}>Loading live bookmaker prices…</div>
      ) : error ? (
        <div className="rounded-xl p-5" style={{ background: "var(--surface-card)", border: "1px solid var(--status-warning)", color: "var(--ink-secondary)" }}>
          <div className="font-bold" style={{ color: "var(--status-warning)" }}>Live odds feed needs configuration</div>
          <div className="text-sm mt-1">{error}</div>
          <div className="text-xs mt-3" style={{ color: "var(--ink-muted)" }}>Add THE_ODDS_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.</div>
        </div>
      ) : ranked.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface-card)", color: "var(--ink-muted)", border: "1px solid var(--border-hairline)" }}>No current {sport} markets returned by the live feed.</div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--surface-sunken)", color: "var(--ink-muted)" }}>
                <tr className="text-left text-[10px] uppercase tracking-wide">
                  <th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Matchup / selection</th><th className="px-4 py-3">Best price</th><th className="px-4 py-3">Consensus fair</th><th className="px-4 py-3">Market EV</th><th className="px-4 py-3">Books</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 40).map((row, i) => {
                  const good = row.classification === "OFFICIAL CANDIDATE";
                  const watch = row.classification === "WATCH";
                  const statusColor = good ? "var(--status-good)" : watch ? "var(--status-warning)" : "var(--ink-muted)";
                  return (
                    <tr key={`${row.eventId}-${row.selection}`} style={{ borderTop: i ? "1px solid var(--border-hairline)" : "none" }}>
                      <td className="px-4 py-3 font-extrabold tabular" style={{ color: statusColor }}>{row.score}</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-extrabold px-2 py-1 rounded-full" style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 12%, transparent)` }}>{row.classification}</span></td>
                      <td className="px-4 py-3"><div className="font-bold">{row.selection}</div><div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>{row.matchup}</div></td>
                      <td className="px-4 py-3"><div className="font-extrabold tabular">${row.bestPrice.toFixed(2)}</div><div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>{row.bestBook}</div></td>
                      <td className="px-4 py-3"><div className="tabular">{pct(row.fairProbability)}</div><div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>fair ${row.fairOdds.toFixed(2)}</div></td>
                      <td className="px-4 py-3 font-extrabold tabular" style={{ color: row.expectedValue > 0 ? "var(--status-good)" : "var(--ink-muted)" }}>{row.expectedValue > 0 ? "+" : ""}{pct(row.expectedValue)}</td>
                      <td className="px-4 py-3 tabular">{row.booksUsed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)", color: "var(--ink-muted)" }}>
        <strong style={{ color: "var(--ink-secondary)" }}>Operator note:</strong> “Official candidate” here means a potentially favourable price relative to the current no-vig bookmaker consensus. It is not automatically an official subscriber bet. Phase 2 adds sport-specific statistics, role/injury context and projection models before a play can be released.
      </div>
    </div>
  );
}
