import { useState, useRef } from "react";
import { Search, Loader2, RefreshCw, Radio, AlertCircle } from "lucide-react";

const POSITION_COLORS = {
  QB: { accent: "#FF5D5D", glow: "rgba(255,93,93,0.18)" },
  RB: { accent: "#7CFF6B", glow: "rgba(124,255,107,0.18)" },
  WR: { accent: "#4FC3FF", glow: "rgba(79,195,255,0.18)" },
  TE: { accent: "#FFC24B", glow: "rgba(255,194,75,0.18)" },
  K: { accent: "#C99BFF", glow: "rgba(201,155,255,0.18)" },
  DEF: { accent: "#9AA5B4", glow: "rgba(154,165,180,0.18)" },
};
const DEFAULT_COLOR = { accent: "#9AA5B4", glow: "rgba(154,165,180,0.18)" };

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE"];

export default function SleeperPortfolio() {
  const [username, setUsername] = useState("");
  const [season, setSeason] = useState("2026");
  const [status, setStatus] = useState("idle"); // idle | loading | error | ready
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [posFilter, setPosFilter] = useState("ALL");
  const [topN, setTopN] = useState(12);
  const playersCache = useRef(null);

  async function loadPortfolio() {
    if (!username.trim()) {
      setError("Enter a Sleeper username first.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    setData(null);

    try {
      setStep("Finding user…");
      const userRes = await fetch(
        `https://api.sleeper.app/v1/user/${encodeURIComponent(username.trim())}`
      );
      if (!userRes.ok) throw new Error("Username not found on Sleeper.");
      const user = await userRes.json();

      setStep("Pulling leagues…");
      const leaguesRes = await fetch(
        `https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${season}`
      );
      if (!leaguesRes.ok) throw new Error("Couldn't load leagues for that season.");
      const leagues = await leaguesRes.json();

      if (!leagues.length) {
        throw new Error(`No leagues found for ${season}. Try a different season.`);
      }

      setStep(`Syncing ${leagues.length} league${leagues.length === 1 ? "" : "s"}…`);
      const rosterSets = await Promise.all(
        leagues.map((lg) =>
          fetch(`https://api.sleeper.app/v1/league/${lg.league_id}/rosters`).then((r) =>
            r.ok ? r.json() : []
          )
        )
      );

      // Load full player dictionary once, cache across syncs this session
      if (!playersCache.current) {
        setStep("Loading player database…");
        const playersRes = await fetch("https://api.sleeper.app/v1/players/nfl");
        playersCache.current = playersRes.ok ? await playersRes.json() : {};
      }
      const players = playersCache.current;

      setStep("Building exposures…");
      let ownedRosterCount = 0;
      let wins = 0,
        losses = 0,
        ties = 0;
      const exposureMap = {};

      leagues.forEach((lg, i) => {
        const rosters = rosterSets[i] || [];
        const mine = rosters.find((r) => r.owner_id === user.user_id);
        if (!mine) return;
        ownedRosterCount += 1;
        wins += mine.settings?.wins || 0;
        losses += mine.settings?.losses || 0;
        ties += mine.settings?.ties || 0;

        (mine.players || []).forEach((pid) => {
          if (!exposureMap[pid]) exposureMap[pid] = { count: 0 };
          exposureMap[pid].count += 1;
        });
      });

      if (ownedRosterCount === 0) {
        throw new Error(`Found leagues, but no rosters owned by ${username} in ${season}.`);
      }

      const exposures = Object.entries(exposureMap)
        .map(([pid, v]) => {
          const p = players[pid] || {};
          return {
            id: pid,
            name: p.full_name || p.last_name || "Unknown Player",
            team: p.team || "FA",
            position: p.position || "?",
            count: v.count,
            pct: Math.round((v.count / ownedRosterCount) * 100),
          };
        })
        .filter((p) => p.position !== "?" && POSITION_COLORS[p.position])
        .sort((a, b) => b.pct - a.pct || b.count - a.count);

      const totalGames = wins + losses + ties;
      const winRate = totalGames ? ((wins / totalGames) * 100).toFixed(1) : "0.0";

      setData({
        username: user.display_name || username,
        avatar: user.avatar,
        season,
        leagueCount: ownedRosterCount,
        wins,
        losses,
        ties,
        winRate,
        exposures,
      });
      setStatus("ready");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  const filtered = data
    ? data.exposures.filter((p) => posFilter === "ALL" || p.position === posFilter).slice(0, topN)
    : [];

  return (
    <div
      className="pp-root"
      style={{
        "--bg": "#0A0C10",
        "--panel": "#12151C",
        "--panel2": "#151923",
        "--border": "#1F2430",
        "--text": "#F2F4F7",
        "--muted": "#7C8494",
        "--lime": "#D4FF3D",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .pp-root {
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          min-height: 100%;
          padding: 28px 20px 40px;
          border-radius: 12px;
        }
        .pp-root * { box-sizing: border-box; }

        .pp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .pp-mark {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--lime), #7CFF6B);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pp-title {
          font-family: 'Anton', sans-serif;
          letter-spacing: 0.5px;
          font-size: 22px;
          text-transform: uppercase;
        }
        .pp-sub {
          color: var(--muted);
          font-size: 13px;
          margin: 0 0 22px 44px;
        }

        .pp-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 26px;
          align-items: center;
        }
        .pp-input-wrap {
          position: relative;
          flex: 1 1 220px;
          min-width: 180px;
        }
        .pp-input-wrap svg {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: var(--muted);
        }
        .pp-input {
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px 10px 36px;
          color: var(--text);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
        }
        .pp-input:focus { border-color: var(--lime); }
        .pp-select {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
          outline: none;
        }
        .pp-select:focus { border-color: var(--lime); }
        .pp-btn {
          background: var(--lime);
          color: #0A0C10;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: filter 0.15s ease;
        }
        .pp-btn:hover { filter: brightness(1.08); }
        .pp-btn:disabled { opacity: 0.6; cursor: default; }

        .pp-status {
          display: flex; align-items: center; gap: 8px;
          color: var(--muted);
          font-size: 13px;
          margin-bottom: 20px;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-error {
          display: flex; align-items: center; gap: 8px;
          color: #FF8A8A;
          background: rgba(255,93,93,0.08);
          border: 1px solid rgba(255,93,93,0.3);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .pp-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 26px;
        }
        .pp-stat {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px 18px;
        }
        .pp-stat-label {
          color: var(--muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .pp-stat-value {
          font-family: 'Anton', sans-serif;
          font-size: 30px;
          letter-spacing: 0.3px;
          color: var(--lime);
        }
        .pp-stat-value.dim { color: var(--text); }

        .pp-board-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .pp-board-title {
          font-family: 'Anton', sans-serif;
          font-size: 16px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text);
        }
        .pp-pills {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .pp-pill {
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--muted);
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-pill.active {
          background: var(--lime);
          border-color: var(--lime);
          color: #0A0C10;
        }

        .pp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 14px;
        }
        .pp-card {
          position: relative;
          background: var(--panel2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          overflow: hidden;
        }
        .pp-card-rank {
          position: absolute;
          top: 10px; right: 12px;
          font-family: 'Anton', sans-serif;
          font-size: 22px;
          color: var(--border);
        }
        .pp-card-top {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 12px;
        }
        .pp-avatar {
          width: 46px; height: 46px;
          border-radius: 8px;
          object-fit: cover;
          background: #232938;
          flex-shrink: 0;
        }
        .pp-pos-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          margin-bottom: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-card-name {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
        }
        .pp-card-team {
          color: var(--muted);
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-card-pct-row {
          display: flex; align-items: baseline; gap: 8px;
          margin-bottom: 8px;
        }
        .pp-card-pct {
          font-family: 'Anton', sans-serif;
          font-size: 24px;
        }
        .pp-card-frac {
          color: var(--muted);
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-meter {
          height: 5px;
          border-radius: 4px;
          background: #1A1E28;
          overflow: hidden;
        }
        .pp-meter-fill {
          height: 100%;
          border-radius: 4px;
        }

        .pp-empty {
          color: var(--muted);
          font-size: 13px;
          padding: 30px 0;
          text-align: center;
        }
      `}</style>

      <div className="pp-header">
        <div className="pp-mark">
          <Radio size={18} color="#0A0C10" strokeWidth={2.5} />
        </div>
        <div className="pp-title">Roster Radar</div>
      </div>
      <p className="pp-sub">Cross-league exposure, synced live from Sleeper</p>

      <div className="pp-form">
        <div className="pp-input-wrap">
          <Search size={15} />
          <input
            className="pp-input"
            placeholder="Sleeper username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPortfolio()}
          />
        </div>
        <select className="pp-select" value={season} onChange={(e) => setSeason(e.target.value)}>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <button className="pp-btn" onClick={loadPortfolio} disabled={status === "loading"}>
          {status === "loading" ? (
            <Loader2 size={15} className="pp-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Sync
        </button>
      </div>

      {status === "loading" && (
        <div className="pp-status">
          <Loader2 size={14} className="pp-spin" />
          {step}
        </div>
      )}

      {status === "error" && (
        <div className="pp-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {status === "ready" && data && (
        <>
          <div className="pp-stats">
            <div className="pp-stat">
              <div className="pp-stat-label">Leagues Synced</div>
              <div className="pp-stat-value">{data.leagueCount}</div>
            </div>
            <div className="pp-stat">
              <div className="pp-stat-label">{data.season} Record</div>
              <div className="pp-stat-value dim">
                {data.wins}-{data.losses}
                {data.ties ? `-${data.ties}` : ""}
              </div>
            </div>
            <div className="pp-stat">
              <div className="pp-stat-label">Win Rate</div>
              <div className="pp-stat-value">{data.winRate}%</div>
            </div>
            <div className="pp-stat">
              <div className="pp-stat-label">Unique Players Rostered</div>
              <div className="pp-stat-value dim">{data.exposures.length}</div>
            </div>
          </div>

          <div className="pp-board-head">
            <div className="pp-board-title">Highest Exposures</div>
            <div className="pp-pills">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  className={`pp-pill ${posFilter === p ? "active" : ""}`}
                  onClick={() => setPosFilter(p)}
                >
                  {p}
                </button>
              ))}
              <select
                className="pp-select"
                style={{ padding: "6px 10px", fontSize: 12 }}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
              >
                <option value={12}>Top 12</option>
                <option value={24}>Top 24</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="pp-empty">No players at this position.</div>
          ) : (
            <div className="pp-grid">
              {filtered.map((p, i) => {
                const c = POSITION_COLORS[p.position] || DEFAULT_COLOR;
                return (
                  <div
                    className="pp-card"
                    key={p.id}
                    style={{ borderColor: c.accent + "55" }}
                  >
                    <div className="pp-card-rank">{i + 1}</div>
                    <div className="pp-card-top">
                      <img
                        className="pp-avatar"
                        src={`https://sleepercdn.com/content/nfl/players/thumb/${p.id}.jpg`}
                        onError={(e) => {
                          e.target.style.visibility = "hidden";
                        }}
                        alt=""
                      />
                      <div>
                        <span
                          className="pp-pos-badge"
                          style={{ background: c.glow, color: c.accent }}
                        >
                          {p.position}
                        </span>
                        <div className="pp-card-name">{p.name}</div>
                        <div className="pp-card-team">{p.team}</div>
                      </div>
                    </div>
                    <div className="pp-card-pct-row">
                      <div className="pp-card-pct" style={{ color: c.accent }}>
                        {p.pct}%
                      </div>
                      <div className="pp-card-frac">
                        {p.count}/{data.leagueCount}
                      </div>
                    </div>
                    <div className="pp-meter">
                      <div
                        className="pp-meter-fill"
                        style={{ width: `${p.pct}%`, background: c.accent }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {status === "idle" && (
        <div className="pp-empty">Enter a Sleeper username above and hit Sync to pull your leagues.</div>
      )}

      <style>{`
        .pp-spin { animation: pp-spin-anim 0.8s linear infinite; }
        @keyframes pp-spin-anim { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
