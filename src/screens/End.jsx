// End — live victory screen
function End({ game, code, uid, onLeave }) {
  const Avatar = window.Avatar;
  if (!game) {
    return <div className="endscreen"><h1>Loading…</h1></div>;
  }
  const meta = game.meta || {};
  const players = Object.values(game.players || {}).sort((a,b) =>
    ((b.sci||0)*2 + (b.gold||0) + (b.mvp||0)*30) -
    ((a.sci||0)*2 + (a.gold||0) + (a.mvp||0)*30)
  );
  const winner = players.find(p => p.uid === meta.winnerId) || players[0];

  return (
    <div className="endscreen" data-screen-label="06 End">
      <div className="victory-type">{meta.victoryType || "Victory"}</div>
      <div className="crown"></div>
      <h1>{winner?.name} wins</h1>
      <div className="who">{winner?.nation} · Game {code}</div>

      <div className="standings">
        {players.map((p, i) => (
          <div key={p.uid} className={`row ${p.uid === meta.winnerId?"winner":""}`}>
            <span className="rank">#{i+1}</span>
            <Avatar name={p.name} color={p.color} size={24} />
            <span className="name">{p.name} <span style={{color:"var(--ink-400)"}}>· {p.nation}</span></span>
            <span>{p.gold || 0}M</span>
            <span style={{color:"var(--sci-400)"}}>{p.sci || 0}SP</span>
            <span style={{color:"var(--mil-400)"}}>{p.mvp || 0}VP</span>
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onLeave}>Main menu</button>
      </div>
    </div>
  );
}
window.End = End;
