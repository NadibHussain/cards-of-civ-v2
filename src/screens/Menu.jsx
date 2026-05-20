// Menu — main screen with Create / Join
function Menu({ goto }) {
  return (
    <div className="menu" data-screen-label="01 Menu">
      <div className="crest-row">
        <span>EST · MMXXVI</span>
        <span>·</span>
        <span>3–8 PLAYERS</span>
        <span>·</span>
        <span>TURN BASED</span>
      </div>
      <div className="mark"></div>
      <h1>Cards of<br /><em>Civilization</em></h1>
      <div className="sub">Build · Research · Conquer</div>
      <div className="actions">
        <button className="btn primary lg" onClick={() => goto("create")}>Create Game</button>
        <button className="btn ghost lg" onClick={() => goto("join")}>Join Game</button>
      </div>
      <div className="footer">
        <span><a style={{color: "inherit", cursor: "pointer"}} onClick={() => goto("rules")}>How to Play</a></span>
        <span>v0.1 · Prototype</span>
      </div>
    </div>
  );
}
window.Menu = Menu;
