// App — root: auth, routing, game subscription
function App() {
  const [screen, setScreen] = React.useState("menu");
  const [pendingProps, setPendingProps] = React.useState({}); // e.g. prefillCode
  const [gameCode, setGameCode] = React.useState(() => null);
  const uid = window.useUid();
  const { game, loading, error } = window.useGame(gameCode);

  // Auto-route based on live game status
  React.useEffect(() => {
    if (!game?.meta) return;
    const s = game.meta.status;
    if (s === "lobby"   && screen !== "lobby") setScreen("lobby");
    if (s === "playing" && screen !== "game")  setScreen("game");
    if (s === "finished"&& screen !== "end")   setScreen("end");
  }, [game?.meta?.status]);

  function goto(s, props = {}) {
    setPendingProps(props);
    setScreen(s);
    window.scrollTo({ top: 0 });
  }

  function onCreated(code) { setGameCode(code); setScreen("lobby"); }
  function onJoined(code)  { setGameCode(code); setScreen("lobby"); }
  function leaveToMenu() {
    if (gameCode) window.api.leaveGame(gameCode).catch(() => {});
    setGameCode(null);
    setScreen("menu");
  }

  const { DevNav, Menu, Create, Join, Lobby, Game, End, Rules } = window;

  const isBoard = screen === "game";

  return (
    <div className={`app${isBoard ? " no-nav" : ""}`}>
      {!isBoard && <DevNav screen={screen} goto={goto} />}
      <main className="stage">
        {!uid && (
          <div style={{position:"absolute",top:10,right:10,fontFamily:"var(--font-mono)",fontSize:10,color:"var(--ink-400)",letterSpacing:"0.1em"}}>
            Signing in…
          </div>
        )}
        {error && screen !== "menu" && (
          <div style={{position:"absolute",top:10,right:10,fontFamily:"var(--font-mono)",fontSize:11,color:"var(--mil-400)",letterSpacing:"0.05em",padding:"4px 10px",background:"var(--mil-bg)",border:"1px solid var(--mil-500)",borderRadius:999}}>
            {error}
          </div>
        )}

        {screen === "menu"   && <Menu   goto={goto} />}
        {screen === "create" && <Create onCreated={onCreated} goBack={leaveToMenu} />}
        {screen === "join"   && <Join   onJoined={onJoined}   goBack={leaveToMenu} prefillCode={pendingProps.prefillCode} />}
        {screen === "lobby"  && <Lobby  game={game} code={gameCode} uid={uid} loading={loading} onLeave={leaveToMenu} />}
        {screen === "game"   && <Game   game={game} code={gameCode} uid={uid} loading={loading} onLeave={leaveToMenu} />}
        {screen === "end"    && <End    game={game} code={gameCode} uid={uid} onLeave={leaveToMenu} />}
        {screen === "rules"  && <Rules  goto={goto} />}
      </main>
    </div>
  );
}

// Wait for Firebase to be ready before mounting
window.fb.ready
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  })
  .catch((err) => {
    document.getElementById("root").innerHTML = `
      <div style="padding:40px;max-width:680px;margin:60px auto;font-family:system-ui;background:#11161f;color:#e3e6ee;border:1px solid #b5503c;border-radius:14px">
        <h1 style="font-family:'DM Serif Display',serif;color:#dcc183;font-weight:400">Firebase failed to connect</h1>
        <p>The game can't reach your database. Check:</p>
        <ol>
          <li>Realtime Database is enabled in the Firebase console (<a style="color:#dcc183" href="https://console.firebase.google.com/project/cards-of-civ/database" target="_blank">open</a>).</li>
          <li>Anonymous Auth is enabled (Authentication → Sign-in method → Anonymous → Enable).</li>
          <li>The <code>databaseURL</code> in <code>src/firebase/init.jsx</code> matches what's shown in the RTDB tab.</li>
          <li>Database rules allow reads/writes — paste <code>database.rules.json</code> from this project.</li>
        </ol>
        <pre style="background:#0b0f15;padding:14px;border-radius:8px;color:#cc6a55;overflow:auto">${(err && err.message) || err}</pre>
      </div>`;
  });
