// Join — enter 6-char token to join a game on Firebase
function useTokenRefs(n) {
  return React.useMemo(() => Array.from({length: n}, () => React.createRef()), [n]);
}

function Join({ onJoined, goBack, prefillCode }) {
  const initial = (prefillCode || "").padEnd(6," ").split("").slice(0,6).map(c => c.trim() ? c.trim().toUpperCase() : "");
  const [vals, setVals] = React.useState(initial);
  const [name, setName] = React.useState(() => localStorage.getItem("coc:name") || "");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const refs = useTokenRefs(6);

  function applyString(str, startIdx = 0) {
    const clean = str.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6 - startIdx);
    if (!clean) return;
    const next = [...vals];
    for (let i = 0; i < clean.length; i++) next[startIdx + i] = clean[i];
    setVals(next);
    const focusIdx = Math.min(5, startIdx + clean.length);
    setTimeout(() => refs[focusIdx]?.current?.focus(), 0);
  }

  function onChange(i, v) {
    if (v.length > 1) { applyString(v, i); return; }
    const clean = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0,1);
    const next = [...vals]; next[i] = clean; setVals(next);
    if (clean && i < 5) refs[i+1].current?.focus();
  }
  function onKey(i, e) {
    if (e.key === "Backspace" && !vals[i] && i > 0) refs[i-1].current?.focus();
    if (e.key === "ArrowLeft"  && i > 0) refs[i-1].current?.focus();
    if (e.key === "ArrowRight" && i < 5) refs[i+1].current?.focus();
  }
  function onPaste(i, e) {
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData).getData("text") || "";
    applyString(txt, i);
  }

  const complete = vals.every(v => v.length === 1) && name.trim();

  async function onJoin() {
    setErr(""); setBusy(true);
    try {
      const code = vals.join("");
      await window.api.joinGame({ code, name: name.trim() });
      localStorage.setItem("coc:name", name.trim());
      localStorage.setItem("coc:lastCode", code);
      onJoined(code);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-wrap" data-screen-label="03 Join">
      <div className="panel">
        <a className="back" onClick={goBack}>← Back</a>
        <h2>Join a game</h2>
        <p className="lead">Enter the 6-character token your host shared. Paste works.</p>

        <div className="field">
          <label>Your display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mira" maxLength={20} />
        </div>

        <label style={{display:"block",fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--ink-400)",marginBottom:6}}>Invite Token</label>
        <div className="token-input">
          {vals.map((v,i) => (
            <input
              key={i} ref={refs[i]} value={v}
              inputMode="text"
              autoComplete="one-time-code"
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => onPaste(i, e)}
            />
          ))}
        </div>

        {err && <div style={{marginBottom:12,padding:"10px 12px",background:"var(--mil-bg)",border:"1px solid var(--mil-500)",color:"var(--mil-400)",borderRadius:"var(--radius)",fontSize:13}}>{err}</div>}

        <div className="lobby row-actions">
          <button className="btn ghost" onClick={goBack}>Cancel</button>
          <button className="btn primary" disabled={!complete || busy} onClick={onJoin}>
            {busy ? "Joining…" : "Join →"}
          </button>
        </div>
      </div>
    </div>
  );
}
window.Join = Join;
