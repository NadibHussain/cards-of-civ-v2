// DevNav — left sidebar to jump between screens; collapses on mobile
const NAV = [
  { id: "menu",   label: "Main Menu",      group: "ENTRY" },
  { id: "create", label: "Create Game",    group: "ENTRY" },
  { id: "join",   label: "Join Game",      group: "ENTRY" },
  { id: "lobby",  label: "Lobby",          group: "ENTRY" },
  { id: "game",   label: "Game Board",     group: "PLAY" },
  { id: "end",    label: "Victory Screen", group: "PLAY" },
  { id: "rules",  label: "Rules Sheet",    group: "REFERENCE" },
];

function DevNav({ screen, goto }) {
  const [open, setOpen] = React.useState(false);
  const groups = NAV.reduce((acc, n) => {
    (acc[n.group] = acc[n.group] || []).push(n);
    return acc;
  }, {});
  function pick(id) {
    goto(id);
    setOpen(false);
  }
  return (
    <>
      <button
        className={`mobile-nav-toggle ${open ? "hidden" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Open nav">☰</button>
      <nav className={`devnav ${open ? "open" : ""}`} aria-label="Screen navigation">
        <button className="devnav-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        <div className="brand">
          Cards of<br />Civilization
          <small>PROTOTYPE · v0.1</small>
        </div>
        {Object.entries(groups).map(([group, items]) => (
          <React.Fragment key={group}>
            <h4>{group}</h4>
            {items.map((n) => (
              <a key={n.id} className={screen === n.id ? "active" : ""} onClick={() => pick(n.id)}>
                <span className="num">{String(NAV.indexOf(n)+1).padStart(2,"0")}</span>
                {n.label}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
window.DevNav = DevNav;
