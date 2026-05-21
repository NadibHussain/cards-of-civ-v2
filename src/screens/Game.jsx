// Game — live multiplayer board
function Game({ game, code, uid, loading, onLeave }) {
  const Avatar = window.Avatar;
  const CardView = window.CardView;
  const getCard = window.getCardById;

  const [attackModal, setAttackModal] = React.useState(null); // { card, handKey }
  const [target, setTarget] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [shopOpen, setShopOpen] = React.useState(false);
  const [shopTab, setShopTab] = React.useState("all");
  const [handOpen, setHandOpen] = React.useState(true);
  const [chronicleOpen, setChronicleOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [attackAnim, setAttackAnim] = React.useState(null);
  const mountTimeRef = React.useRef(Date.now());
  const animTimerRef = React.useRef(null);

  const meta = game?.meta || {};
  const playersObj = game?.players || {};
  const players = Object.values(playersObj).sort((a,b) => (a.order||0) - (b.order||0));
  const you = playersObj[uid];
  const activePlayer = players[meta.turnIdx || 0];
  const yourTurn = activePlayer?.uid === uid;
  const opps = players.filter(p => p.uid !== uid);

  const handObj = game?.hand?.[uid] || {};
  const handEntries = Object.entries(handObj); // [[key, cardId], ...]

  const remaining = window.useTurnTimer(meta.turnDeadline);

  function showToast(t) { setToast(t); setTimeout(() => setToast(""), 1800); }

  // Show attack animation to all players when a new attack lands
  React.useEffect(() => {
    const la = game?.lastAttack;
    if (!la || la.ts <= mountTimeRef.current) return;
    setAttackAnim(la);
    if (la.cardId) window.playAttackSound?.(la.cardId);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => setAttackAnim(null), 3500);
    return () => clearTimeout(animTimerRef.current);
  }, [game?.lastAttack?.ts]);

  // Auto-advance turn if expired (any client can trigger; transaction-safe)
  React.useEffect(() => {
    if (!game || meta.status !== "playing") return;
    if (remaining !== 0) return;
    const t = setTimeout(() => {
      window.api.endTurn(code).catch(() => {});
    }, 1500 + Math.random() * 1500);
    return () => clearTimeout(t);
  }, [remaining, code, meta.status, game]);

  async function safe(fn) {
    setBusy(true);
    try { await fn(); }
    catch (e) { showToast(e.message || String(e)); }
    finally { setBusy(false); }
  }

  function onHandCardClick([handKey, cardId]) {
    if (!yourTurn) return;
    const card = getCard(cardId);
    if (!card) return;
    if (card.cat === "military") {
      setAttackModal({ card, handKey });
      setTarget(null);
    } else {
      safe(() => window.api.playEconScience(code, handKey, cardId));
    }
  }

  function confirmAttack() {
    if (!target || !attackModal) return;
    safe(async () => {
      await window.api.attackPlayer(code, attackModal.handKey, attackModal.card.id, target);
      setAttackModal(null); setTarget(null);
    });
  }

  function buyFromStore(card) {
    if (!yourTurn) return;
    safe(() => window.api.buyCard(code, card.id));
  }

  function targetThis(p) {
    if (!yourTurn) return;
    const firstMil = handEntries.find(([_, id]) => getCard(id)?.cat === "military");
    if (!firstMil) return showToast("No military cards in hand.");
    setAttackModal({ card: getCard(firstMil[1]), handKey: firstMil[0] });
    setTarget(p.uid);
  }

  if (loading || !game) {
    return <div className="panel-wrap"><div className="panel" style={{textAlign:"center"}}><h2>Loading…</h2></div></div>;
  }

  const log = game.log ? Object.entries(game.log)
    .map(([k,v]) => ({ ...v, _k: k }))
    .sort((a,b) => b.ts - a.ts) : [];

  const storeCardList = (window.CARDS || []);
  const storeTotal = storeCardList.length;

  return (
    <div className={`board ${handOpen && handEntries.length > 0 ? "hand-open" : ""}`} data-screen-label="05 Game">
      {toast && <div className="toast">{toast}</div>}

      {attackAnim && (() => {
        const animCard = getCard(attackAnim.cardId);
        const weaponIcon = {
          infantry: "⚔",
          artillery: "💣",
          spy: "🕵",
          tank: "💥",
          drone: "🎯",
        }[attackAnim.cardId] || "⚔";
        return (
          <div
            className={`attack-anim-overlay card-type-${attackAnim.cardId || "infantry"}`}
            onClick={() => setAttackAnim(null)}
          >
            <div className="attack-anim-particles">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`anim-particle p${i}`} />
              ))}
            </div>
            <div className={`attack-anim-card ${attackAnim.hit ? "hit" : "miss"}`}>
              <div className="attack-anim-weapon-row">
                <span className="attack-anim-weapon-icon">{weaponIcon}</span>
              </div>
              {animCard && (
                <div className="attack-anim-glyph">{animCard.glyph}</div>
              )}
              <div className="attack-anim-label">
                {attackAnim.hit ? "⚔ STRIKE" : "✕ MISSED"}
              </div>
              <div className="attack-anim-names">
                <span className="attacker">{attackAnim.attackerName}</span>
                <span className="vs">→</span>
                <span className="defender">{attackAnim.targetName}</span>
              </div>
              <div className="attack-anim-card-name">{attackAnim.cardName}</div>
              {attackAnim.hit && (
                <div className="attack-anim-dmg">
                  {attackAnim.stolen > 0
                    ? `Stole ${attackAnim.stolen}M Gold`
                    : `−${attackAnim.dmg}M Gold`}
                </div>
              )}
              <div className="attack-anim-dismiss">tap to dismiss</div>
            </div>
          </div>
        );
      })()}

      <div className="topbar">
        <div className="game-id">
          <span className="title">Cards of Civilization</span>
          <span className="code">TKN · {code}</span>
        </div>
        <div className="year">
          <div className="y-label">Year</div>
          <div className="y-val">{meta.year} <small style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--ink-400)"}}>/ {meta.totalRounds}</small></div>
        </div>
        <div className="turn-info">
          <span style={{color: yourTurn ? "var(--gold-400)" : "var(--ink-300)"}}>
            {yourTurn ? "● Your turn" : `Waiting for ${activePlayer?.name || "…"}…`}
          </span>
          {remaining != null && <>
            <span className="sep">·</span>
            <span style={{color: remaining < 15 ? "var(--mil-400)" : "var(--ink-300)"}}>
              {remaining}s
            </span>
          </>}
          <span className="sep">·</span>
          <button className="btn ghost" style={{padding:"6px 10px",fontSize:11,minHeight:0}} onClick={onLeave}>Leave</button>
        </div>
      </div>

      <div className="center-stage">
        <div className="stage-header">
          <div className="stage-eyebrow">The World · {opps.length} Rival Civilizations</div>
          <h2 className="stage-title">Choose your move</h2>
        </div>

        <div className="opponents-grid">
          {opps.map((p) => {
            const realIdx = players.findIndex(x => x.uid === p.uid);
            const atWarWithYou = !!(p.atWar && p.atWar[uid]);
            const isLeader = p.gold === Math.max(...players.map(x => x.gold || 0));
            return (
              <div key={p.uid} className={`opp-card ${meta.turnIdx===realIdx?"active-turn":""} ${atWarWithYou?"at-war":""}`}>
                <div className="opp-head">
                  <Avatar name={p.name} color={p.color} country={p.country} size={32} />
                  <div>
                    <div className="name">{p.name}{!p.online && <span style={{color:"var(--mil-400)",marginLeft:6,fontSize:9}}>● offline</span>}</div>
                    <div className="nation">{p.country || "—"}</div>
                  </div>
                  {meta.turnIdx===realIdx && <span className="turn-pip">TURN</span>}
                </div>
                <div className="stats-grid">
                  <div className="stat gold">
                    <span className="lbl">Gold</span>
                    <span className="val">{p.gold || 0}<small style={{fontSize:9,color:"var(--ink-400)",marginLeft:1,fontFamily:"var(--font-mono)"}}>M</small></span>
                  </div>
                  <div className="stat sci">
                    <span className="lbl">Sci</span>
                    <span className="val">{p.sci || 0}<small style={{fontSize:9,color:"var(--ink-400)",marginLeft:1,fontFamily:"var(--font-mono)"}}>SP</small></span>
                  </div>
                  <div className="stat vp">
                    <span className="lbl">VP</span>
                    <span className="val">{p.mvp || 0}<small style={{fontSize:9,color:"var(--ink-400)",marginLeft:1,fontFamily:"var(--font-mono)"}}>/2</small></span>
                  </div>
                </div>
                <div className="opp-foot">
                  <div className="badges">
                    {atWarWithYou
                      ? <span className="badge war">At war</span>
                      : <span className="badge peace">Peace</span>}
                    {isLeader && <span className="badge lead">Leader</span>}
                  </div>
                </div>
                <button className="btn ghost"
                  style={{padding:"5px 8px",fontSize:10,letterSpacing:"0.1em",minHeight:0}}
                  disabled={!yourTurn || handEntries.length===0 || busy}
                  onClick={() => targetThis(p)}>
                  Target →
                </button>
              </div>
            );
          })}
        </div>

        <div className="chronicle-float">
          <h3>Chronicle</h3>
          <ul>
            {log.slice(0, 30).map((l,i) => (
              <li key={l._k || i} className={l.kind} data-year={`Y${l.year}`}>{l.text}</li>
            ))}
          </ul>
        </div>

        <button className="chronicle-fab" onClick={() => setChronicleOpen(true)}>
          <span className="g">📜</span>
          <span className="t">Chronicle</span>
          <span className="c">{log.length}</span>
        </button>
      </div>

      {chronicleOpen && (
        <div className="modal-backdrop" onClick={() => setChronicleOpen(false)}>
          <div className="modal chronicle-modal" onClick={(e) => e.stopPropagation()}>
            <a className="close" onClick={() => setChronicleOpen(false)}>✕</a>
            <h2>Chronicle</h2>
            <p className="lead">Every action this game, in reverse order.</p>
            <ul className="chronicle-list">
              {log.map((l,i) => (
                <li key={l._k || i} className={l.kind} data-year={`Y${l.year}`}>{l.text}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="dashboard">
        {handOpen && handEntries.length > 0 && (
          <div className="hand-float">
            {handEntries.map(([k, id]) => {
              const c = getCard(id);
              if (!c) return null;
              return (
                <CardView key={k} card={c}
                  onClick={() => onHandCardClick([k, id])}
                  you={you} disabled={!yourTurn || busy} />
              );
            })}
          </div>
        )}

        <div className="dash-identity">
          <div className="dash-avatar" style={{
            background: you?.country ? "var(--ink-700)" : (you?.color || "#dcc183"),
            fontSize: you?.country ? "32px" : "24px",
          }}>
            {you?.country ? window.getCountryFlag(you.country) : (you?.name || "?")[0].toUpperCase()}
          </div>
          <div className="dash-name-block">
            <span className="you-label">YOU · {you?.host ? "HOST" : "PLAYER"}</span>
            <span className="name">{you?.name}</span>
            <span className="nation">{you?.country || "—"} · {Object.keys(you?.atWar || {}).length === 0
              ? <span style={{color:"var(--eco-400)"}}>at peace</span>
              : <span style={{color:"var(--mil-400)"}}>at war ({Object.keys(you.atWar).length})</span>}</span>
          </div>
        </div>

        <div className="dash-resources">
          <div className="dash-res gold">
            <span className="ico">◆</span>
            <div><div className="lbl">Gold</div><div className="val">{you?.gold || 0}<small>M</small></div></div>
          </div>
          <div className="dash-res sci">
            <span className="ico">✦</span>
            <div><div className="lbl">Science</div><div className="val">{you?.sci || 0}<small>SP</small></div></div>
          </div>
          <div className="dash-res vic">
            <span className="ico">★</span>
            <div><div className="lbl">Victory</div><div className="val">{you?.mvp || 0}<small>/2</small></div></div>
          </div>
        </div>

        <div className="dash-actions">
          <button className="shop-btn" onClick={() => setShopOpen(true)} disabled={!yourTurn || busy}>
            <span className="glyph">⌂</span>
            Store
            <span className="badge">{storeTotal}</span>
          </button>
          <button className="btn ghost" onClick={() => setHandOpen(!handOpen)} style={{padding:"10px 14px",fontSize:12}}>
            {handOpen ? "Hide hand" : "Show hand"}
            <span style={{marginLeft:6,padding:"1px 6px",borderRadius:8,background:"var(--gold-500)",color:"var(--ink-900)",fontFamily:"var(--font-mono)",fontSize:10}}>{handEntries.length}</span>
          </button>
          <button className="btn primary" onClick={() => safe(() => window.api.endTurn(code))} disabled={!yourTurn || busy}>
            End turn →
          </button>
        </div>
      </div>

      {shopOpen && (
        <div className="modal-backdrop" onClick={() => setShopOpen(false)}>
          <div className="modal shop-modal" onClick={(e) => e.stopPropagation()}>
            <a className="close" onClick={() => setShopOpen(false)}>✕</a>
            <h2>Store</h2>
            <p className="lead">Cards are always available. Buy any card you can afford.</p>
            <div className="shop-tabs">
              {["all","military","economy","science"].map(t => (
                <button key={t}
                  className={`${shopTab===t?"active":""} ${t==="military"?"mil":t==="economy"?"eco":t==="science"?"sci":""}`}
                  onClick={() => setShopTab(t)}>
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
            <div className="shop-body">
              <div className="shop-grid">
                {storeCardList.filter(c => shopTab==="all" || c.cat===shopTab).map(c => (
                  <CardView key={c.id} card={c} onClick={() => buyFromStore(c)} you={you} disabled={!yourTurn || busy} />
                ))}
              </div>
            </div>
            <div className="shop-foot">
              <div className="purse">
                <span>Your purse: <b>{you?.gold || 0}M Gold</b></span>
                <span>·</span>
                <span><b>{you?.sci || 0}SP</b></span>
              </div>
              <button className="btn ghost" onClick={() => setShopOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {attackModal && (
        <div className="modal-backdrop" onClick={() => setAttackModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <a className="close" onClick={() => setAttackModal(null)}>✕</a>
            <h2>Choose a target</h2>
            <p className="lead">
              Playing <b style={{color:"var(--mil-400)"}}>{attackModal.card.name}</b> — {attackModal.card.chance}% chance to hit.
              You'll declare war on the target.
            </p>
            <div className="target-list">
              {opps.map(p => (
                <div key={p.uid}
                  className={`target ${target===p.uid?"selected":""}`}
                  onClick={() => setTarget(p.uid)}>
                  <Avatar name={p.name} color={p.color} country={p.country} size={28} />
                  <div>
                    <div style={{color:"var(--parch-50)",fontSize:13}}>{p.name}</div>
                    <div style={{color:"var(--ink-400)",fontSize:11,fontFamily:"var(--font-mono)"}}>{p.country || "—"} · {p.gold}M</div>
                  </div>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--ink-300)",letterSpacing:"0.1em"}}>
                    {you?.atWar && you.atWar[p.uid] ? "AT WAR" : "PEACE"}
                  </span>
                </div>
              ))}
            </div>
            <div className="footer-actions">
              <button className="btn ghost" onClick={() => setAttackModal(null)}>Cancel</button>
              <button className="btn danger" disabled={!target || busy} onClick={confirmAttack}>Strike →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.Game = Game;
