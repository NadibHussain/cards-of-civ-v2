// Create — host a new game on Firebase
function Create({ onCreated, goBack }) {
  const [name, setName] = React.useState(() => localStorage.getItem("coc:name") || "");
  const [maxPlayers, setMaxPlayers] = React.useState(6);
  const [rounds, setRounds] = React.useState(20);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function onCreate() {
    setErr(""); setBusy(true);
    try {
      const { code } = await window.api.createGame({ hostName: name.trim(), maxPlayers, rounds });
      localStorage.setItem("coc:name", name.trim());
      localStorage.setItem("coc:lastCode", code);
      onCreated(code);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-wrap" data-screen-label="02 Create">
      <div className="panel">
        <a className="back" onClick={goBack}>← Back</a>
        <h2>Create a game</h2>
        <p className="lead">Host a new session. A 6-character invite token will be generated to share with up to 7 others.</p>

        <div className="field">
          <label>Your display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aurelia" maxLength={20} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Max players</label>
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(+e.target.value)}>
              {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} players</option>)}
            </select>
          </div>
          <div className="field">
            <label>Rounds (years)</label>
            <select value={rounds} onChange={(e) => setRounds(+e.target.value)}>
              {[10,15,20,25,30].map(n => <option key={n} value={n}>{n} years</option>)}
            </select>
          </div>
        </div>

        <hr className="hr" />
        <div className="spread">
          <span className="muted tiny">Starting treasury: <b style={{color:"var(--gold-300)"}}>7M Gold</b> · Win at 100SP, +50M lead, or 2 victory points</span>
        </div>
        {err && <div style={{marginTop:12,padding:"10px 12px",background:"var(--mil-bg)",border:"1px solid var(--mil-500)",color:"var(--mil-400)",borderRadius:"var(--radius)",fontSize:13}}>{err}</div>}
        <hr className="hr" />

        <div className="lobby row-actions" style={{marginTop: 14}}>
          <button className="btn ghost" onClick={goBack}>Cancel</button>
          <button className="btn primary" disabled={!name.trim() || busy} onClick={onCreate}>
            {busy ? "Creating…" : "Generate Token →"}
          </button>
        </div>
      </div>
    </div>
  );
}
window.Create = Create;
