// useGame — React hook that subscribes to a game node in Realtime DB.
// Returns the live snapshot (and an alphabetically-sorted players array).

function useGame(code) {
  const [game, setGame] = React.useState(null);
  const [loading, setLoading] = React.useState(!!code);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!code) { setGame(null); setLoading(false); return; }
    setLoading(true);
    const ref = window.fb.db.ref(`games/${code}`);
    const cb = (snap) => {
      const v = snap.val();
      setGame(v);
      setLoading(false);
      if (!v) setError("Game not found.");
      else setError(null);
    };
    ref.on("value", cb, (err) => {
      console.error("[useGame] subscription error", err);
      setError(err.message);
      setLoading(false);
    });
    return () => ref.off("value", cb);
  }, [code]);

  return { game, loading, error };
}

// Authenticated user UID
function useUid() {
  const [uid, setUid] = React.useState(window.fb.auth.currentUser?.uid || null);
  React.useEffect(() => {
    if (uid) return;
    const cb = (u) => { if (u) setUid(u.uid); };
    window.fb.auth.onAuthStateChanged(cb);
  }, [uid]);
  return uid;
}

// Ticking countdown to a deadline (ms). Returns seconds remaining.
function useTurnTimer(deadline) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  if (!deadline) return null;
  const remaining = Math.max(0, deadline - now);
  return Math.ceil(remaining / 1000);
}

window.useGame = useGame;
window.useUid = useUid;
window.useTurnTimer = useTurnTimer;
