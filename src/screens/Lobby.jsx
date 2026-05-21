// Lobby — live waiting room with country selection
function Lobby({ game, code, uid, loading, onLeave }) {
  const Avatar = window.Avatar;
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  if (loading || !game) {
    return (
      <div className="panel-wrap lobby">
        <div className="panel" style={{textAlign:"center"}}>
          <h2>Loading…</h2>
          <p className="lead">Connecting to {code || "game"}…</p>
        </div>
      </div>
    );
  }

  const meta = game.meta || {};
  const playersObj = game.players || {};
  const players = Object.values(playersObj).sort((a,b) => (a.order||0) - (b.order||0));
  const you = playersObj[uid];
  const isHost = meta.hostUid === uid;
  const slots = meta.maxPlayers || 8;

  const takenCountries = players.filter(p => p.uid !== uid).map(p => p.country).filter(Boolean);

  function copyToken() {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  async function pickCountry(countryName) {
    setErr("");
    try { await window.api.setCountry(code, countryName); }
    catch (e) { setErr(e.message); }
  }

  async function toggleReady() {
    if (!you) return;
    if (!you.ready && !you.country) {
      setErr("Pick a country before readying up!");
      return;
    }
    setErr("");
    try { await window.api.setReady(code, !you.ready); }
    catch (e) { setErr(e.message); }
  }

  async function start() {
    setErr(""); setBusy(true);
    try { await window.api.startGame(code); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function leave() {
    try { await window.api.leaveGame(code); } catch {}
    onLeave();
  }

  const canStart = isHost && players.length >= 3 && players.every(p => p.ready);

  return (
    <div className="panel-wrap lobby" data-screen-label="04 Lobby">
      {copied && <div className="toast">Token copied — {code}</div>}
      <div className="panel">
        <a className="back" onClick={leave}>← Leave</a>
        <h2>Waiting room</h2>
        <p className="lead">Share the invite token with other players. {isHost ? "Start the game when everyone is ready." : "Waiting for the host."}</p>

        <div className="token-display">
          <div className="label">Invite Token</div>
          <div className="code">{code}</div>
          <a className="copy" onClick={copyToken}>tap to copy</a>
        </div>

        <div className="players-list">
          {players.map((p) => (
            <div className="player-row" key={p.uid}>
              <Avatar name={p.name} color={p.color} country={p.country} />
              <div className="meta">
                <span className="name">
                  {p.name}
                  {p.uid === uid && <span style={{color:"var(--ink-400)",marginLeft:6,fontFamily:"var(--font-mono)",fontSize:11}}>· you</span>}
                  {p.host && <span style={{color:"var(--gold-400)",marginLeft:8,fontSize:11,fontFamily:"var(--font-mono)"}}>HOST</span>}
                  {!p.online && <span style={{color:"var(--mil-400)",marginLeft:8,fontSize:11,fontFamily:"var(--font-mono)"}}>offline</span>}
                </span>
                <span className="sub">
                  {p.country
                    ? <>{window.getCountryFlag(p.country)} {p.country}</>
                    : <span style={{color:"var(--ink-500)"}}>no country yet</span>}
                </span>
              </div>
              <span className={`status ${p.ready ? "ready" : ""}`}>
                {p.ready ? "● Ready" : p.country ? "○ Waiting…" : "○ Picking…"}
              </span>
            </div>
          ))}
          {Array.from({length: Math.max(0, 3 - players.length)}).map((_,i) => (
            <div className="player-row empty" key={`min-${i}`}>
              <div></div>
              <span>Waiting for player… <span className="muted tiny">(minimum 3)</span></span>
              <span className="status">○</span>
            </div>
          ))}
          {players.length >= 3 && players.length < slots && (
            <div className="player-row empty">
              <div></div>
              <span>Open slot · {slots - players.length} remaining</span>
              <span className="status">○</span>
            </div>
          )}
        </div>

        <div className="country-picker">
          <div className="picker-label">Choose your country</div>
          <div className="country-grid">
            {window.COUNTRIES.map(c => {
              const isTaken = takenCountries.includes(c.name);
              const isSelected = you?.country === c.name;
              return (
                <button
                  key={c.name}
                  className={`country-btn${isSelected ? " selected" : ""}${isTaken ? " taken" : ""}`}
                  disabled={isTaken}
                  onClick={() => !isTaken && pickCountry(c.name)}
                  title={c.name}>
                  <span className="flag">{c.flag}</span>
                  <span className="cname">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {err && <div style={{marginBottom:12,padding:"10px 12px",background:"var(--mil-bg)",border:"1px solid var(--mil-500)",color:"var(--mil-400)",borderRadius:"var(--radius)",fontSize:13}}>{err}</div>}

        <div className="row-actions">
          <button className="btn ghost" onClick={toggleReady}>
            {you?.ready ? "Unready" : "Ready up"}
          </button>
          {isHost ? (
            <button className="btn primary" disabled={!canStart || busy} onClick={start}>
              {busy ? "Starting…" : canStart ? "Begin Year 1 →" : `Waiting for ready (${players.filter(p=>p.ready).length}/${players.length})`}
            </button>
          ) : (
            <button className="btn primary" disabled>Waiting for host</button>
          )}
        </div>
      </div>
    </div>
  );
}
window.Lobby = Lobby;
