// Game API — all Firebase Realtime Database operations
// Each fn assumes window.fb is initialized and user is signed in.

(function () {
  const NATION_POOL = ["Aurelia","Khemet","Veridia","Storvik","Hanjeon","Tlaloc","Sahel","Pyrrhus"];
  const COLOR_POOL  = ["#dcc183","#cc6a55","#8aae78","#7ea0c9","#b89f72","#c98ad6","#5ec0c0","#d6b35e"];

  const TURN_SECONDS = 75;
  const STARTING_GOLD = 7;
  const TOTAL_ROUNDS_DEFAULT = 20;

  function pickFrom(pool, used) {
    const available = pool.filter(x => !used.includes(x));
    if (available.length) return available[Math.floor(Math.random()*available.length)];
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function gref(code, sub) {
    return window.fb.db.ref(`games/${code}${sub ? "/" + sub : ""}`);
  }

  async function _uid() {
    await window.fb.ready;
    return window.fb.auth.currentUser.uid;
  }

  async function createGame({ hostName, maxPlayers = 8, rounds = TOTAL_ROUNDS_DEFAULT }) {
    const uid = await _uid();
    let code = "";
    let ok = false;
    for (let i = 0; i < 12 && !ok; i++) {
      code = window.genToken();
      const tx = await gref(code, "meta").transaction((curr) => {
        if (curr) return; // already taken
        return {
          hostUid: uid,
          status: "lobby",
          year: 0,
          totalRounds: rounds,
          maxPlayers,
          turnIdx: 0,
          turnDeadline: 0,
          createdAt: window.fb.sv.TIMESTAMP,
          code,
        };
      });
      ok = tx.committed;
    }
    if (!ok) throw new Error("Couldn't reserve a game code; please retry.");

    await gref(code, `players/${uid}`).set({
      uid,
      name: hostName,
      nation: pickFrom(NATION_POOL, []),
      color: pickFrom(COLOR_POOL, []),
      gold: STARTING_GOLD,
      sci: 0,
      mvp: 0,
      atWar: {},
      host: true,
      ready: true,
      online: true,
      lastSeen: window.fb.sv.TIMESTAMP,
      order: 0,
      joinedAt: window.fb.sv.TIMESTAMP,
    });

    _attachPresence(code, uid);
    return { code, uid };
  }

  async function joinGame({ code, name }) {
    const uid = await _uid();
    code = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const metaSnap = await gref(code, "meta").once("value");
    const meta = metaSnap.val();
    if (!meta) throw new Error("Game not found.");

    const playersSnap = await gref(code, "players").once("value");
    const players = playersSnap.val() || {};

    // Rejoin?
    if (players[uid]) {
      await gref(code, `players/${uid}/online`).set(true);
      await gref(code, `players/${uid}/lastSeen`).set(window.fb.sv.TIMESTAMP);
      _attachPresence(code, uid);
      return { code, uid, rejoin: true };
    }

    if (meta.status !== "lobby") throw new Error("Game already in progress.");
    if (Object.keys(players).length >= (meta.maxPlayers || 8)) throw new Error("Lobby is full.");

    const used = Object.values(players);
    const order = used.length;
    await gref(code, `players/${uid}`).set({
      uid,
      name,
      nation: pickFrom(NATION_POOL, used.map(p => p.nation)),
      color: pickFrom(COLOR_POOL, used.map(p => p.color)),
      gold: STARTING_GOLD,
      sci: 0,
      mvp: 0,
      atWar: {},
      host: false,
      ready: false,
      online: true,
      lastSeen: window.fb.sv.TIMESTAMP,
      order,
      joinedAt: window.fb.sv.TIMESTAMP,
    });
    _attachPresence(code, uid);
    return { code, uid };
  }

  function _attachPresence(code, uid) {
    const onlineRef = gref(code, `players/${uid}/online`);
    const lastSeenRef = gref(code, `players/${uid}/lastSeen`);
    onlineRef.onDisconnect().set(false);
    lastSeenRef.onDisconnect().set(window.fb.sv.TIMESTAMP);
    // Heartbeat
    window.fb.db.ref(".info/connected").on("value", (s) => {
      if (s.val() === true) {
        onlineRef.set(true);
        lastSeenRef.set(window.fb.sv.TIMESTAMP);
      }
    });
  }

  async function setReady(code, ready) {
    const uid = await _uid();
    await gref(code, `players/${uid}/ready`).set(!!ready);
  }

  async function leaveGame(code) {
    const uid = await _uid();
    await gref(code, `players/${uid}/online`).set(false);
    await gref(code, `players/${uid}/lastSeen`).set(window.fb.sv.TIMESTAMP);
    // Don't delete the player record — they may rejoin
  }

  async function startGame(code) {
    const uid = await _uid();
    const metaSnap = await gref(code, "meta").once("value");
    const meta = metaSnap.val();
    if (!meta) throw new Error("Game not found.");
    if (meta.hostUid !== uid) throw new Error("Only the host can start the game.");

    const playersSnap = await gref(code, "players").once("value");
    const players = Object.values(playersSnap.val() || {});
    if (players.length < 3) throw new Error("Need at least 3 players.");
    if (players.some(p => !p.ready)) throw new Error("All players must be ready.");

    await gref(code).update({
      "meta/status": "playing",
      "meta/year": 1,
      "meta/turnIdx": 0,
      "meta/turnDeadline": Date.now() + TURN_SECONDS * 1000,
    });

    await gref(code, "log").push({
      year: 1,
      text: `Year 1 begins. Every civilization starts with ${STARTING_GOLD}M Gold.`,
      kind: "",
      ts: Date.now(),
    });
  }

  function _orderedPlayers(playersObj) {
    return Object.values(playersObj || {}).sort((a,b) => (a.order||0) - (b.order||0));
  }

  function _isYourTurn(game, uid) {
    if (!game || !game.meta || !game.players) return false;
    const order = _orderedPlayers(game.players);
    return order[game.meta.turnIdx]?.uid === uid;
  }

  async function buyCard(code, cardId) {
    const uid = await _uid();
    const card = window.getCardById(cardId);
    if (!card) throw new Error("Unknown card");

    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!game || game.meta.status !== "playing") throw new Error("Game not in progress.");
    if (!_isYourTurn(game, uid)) throw new Error("Not your turn.");

    const p = game.players[uid];
    // Logistics Doctrine: −1 gold per stack on military cards (floor at 0)
    const logistics = game.structures?.[uid]?.["mil-reduce"] || 0;
    let gold = card.cost.gold || 0;
    if (card.cat === "military" && logistics > 0) {
      gold = Math.max(0, gold - logistics);
    }
    const sci = card.cost.sci || 0;
    if (p.gold < gold || p.sci < sci) {
      throw new Error("Not enough resources.");
    }

    const handKey = gref(code, `hand/${uid}`).push().key;
    await gref(code).update({
      [`players/${uid}/gold`]: p.gold - gold,
      [`players/${uid}/sci`]:  p.sci  - sci,
      [`hand/${uid}/${handKey}`]: cardId,
    });

    await gref(code, "log").push({
      year: game.meta.year,
      text: `${p.name} acquired ${card.name}${logistics && card.cat==="military" ? ` (−${logistics}M from Logistics)` : ""}.`,
      kind: "",
      ts: Date.now(),
    });
  }

  async function playEconScience(code, handKey, cardId) {
    const uid = await _uid();
    const card = window.getCardById(cardId);
    if (!card) throw new Error("Unknown card");

    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!_isYourTurn(game, uid)) throw new Error("Not your turn.");

    await gref(code, `hand/${uid}/${handKey}`).remove();

    // Persistent effect — register structures.
    const updates = {};
    if (card.id === "sci-center" || card.id === "factory" || card.id === "agriculture" || card.id === "bank" || card.id === "defence" || card.id === "mil-reduce") {
      updates[`structures/${uid}/${card.id}`] = (game.structures?.[uid]?.[card.id] || 0) + 1;
    }
    if (Object.keys(updates).length) await gref(code).update(updates);

    await gref(code, "log").push({
      year: game.meta.year,
      text: `${game.players[uid].name} played ${card.name}.`,
      kind: card.cat === "science" ? "sci" : "eco",
      ts: Date.now(),
    });
  }

  async function attackPlayer(code, handKey, cardId, targetUid) {
    const uid = await _uid();
    const card = window.getCardById(cardId);
    if (!card) throw new Error("Unknown card");

    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!_isYourTurn(game, uid)) throw new Error("Not your turn.");
    if (!game.players[targetUid]) throw new Error("Target not in game.");

    // Defence reduces chance
    let chance = card.chance ?? 100;
    const tgtDefenceLvl = game.structures?.[targetUid]?.defence || 0;
    if (tgtDefenceLvl > 0 && card.id !== "drone") {
      chance = Math.max(5, chance - 12 * tgtDefenceLvl);
    }
    const hit = Math.random() * 100 < chance;

    let dmg = 0;
    if (card.id === "infantry")  dmg = 2 + Math.floor(Math.random()*2);
    else if (card.id === "artillery") dmg = 4 + Math.floor(Math.random()*3);
    else if (card.id === "spy")  dmg = 1 + Math.floor(Math.random()*2);
    else if (card.id === "tank") dmg = 6; // first tick of 2
    else if (card.id === "drone") dmg = 5 + Math.floor(Math.random()*4);

    // Remove card from hand
    await gref(code, `hand/${uid}/${handKey}`).remove();

    // Tank: queue a second 6M hit for the following year.
    if (card.id === "tank") {
      const pendKey = gref(code, "pendingHits").push().key;
      await gref(code, `pendingHits/${pendKey}`).set({
        from: uid,
        target: targetUid,
        cardId: "tank",
        dmg: 6,
        appliesOnYear: (game.meta.year || 1) + 1,
      });
    }

    // Apply damage transactionally
    let stolen = 0;
    if (hit) {
      const tx = await gref(code, `players/${targetUid}/gold`).transaction(g => Math.max(0, (g||0) - dmg));
      if (card.id === "spy") {
        // Steal — credit attacker
        stolen = Math.min(dmg, game.players[targetUid].gold || 0);
        await gref(code, `players/${uid}/gold`).transaction(g => (g||0) + stolen);
      }
    }

    // Declare war (mutual)
    await gref(code).update({
      [`players/${uid}/atWar/${targetUid}`]: true,
      [`players/${targetUid}/atWar/${uid}`]: true,
    });

    // VP if target falls to 0 gold from this hit
    const targetAfterSnap = await gref(code, `players/${targetUid}/gold`).once("value");
    if (hit && targetAfterSnap.val() === 0 && (game.players[targetUid].gold || 0) > 0) {
      await gref(code, `players/${uid}/mvp`).transaction(v => (v||0) + 1);
      await gref(code, "log").push({
        year: game.meta.year,
        text: `${game.players[uid].name} routed ${game.players[targetUid].name} — +1 Victory Point.`,
        kind: "war",
        ts: Date.now(),
      });
    }

    const yourName = game.players[uid].name;
    const tgtName  = game.players[targetUid].name;
    let text;
    if (card.id === "spy") {
      text = hit ? `${yourName}'s Spy infiltrated ${tgtName} and stole ${stolen}M.`
                 : `${yourName}'s Spy was caught in ${tgtName} and the operation failed.`;
    } else {
      text = hit ? `${yourName} struck ${tgtName} with ${card.name} — ${dmg}M lost.`
                 : `${yourName}'s ${card.name} missed ${tgtName}.`;
    }
    await gref(code, "log").push({ year: game.meta.year, text, kind: "war", ts: Date.now() });
  }

  // Compute and apply persistent effects when a new year starts.
  function _yearTickUpdates(game, nextYear) {
    const updates = {};
    const players = _orderedPlayers(game.players);
    for (const p of players) {
      const at = p.atWar ? Object.keys(p.atWar).length : 0;
      const structs = game.structures?.[p.uid] || {};
      let goldGain = 0;
      let sciGain = 0;
      if (at === 0) goldGain += 1; // peace dividend
      const factories = structs.factory || 0;
      goldGain += factories * (at === 0 ? 2 : 1);
      const ag = structs.agriculture || 0;
      goldGain += Math.floor(ag * 0.5 + 0.5 * (nextYear % 2));
      const sciC = structs["sci-center"] || 0;
      sciGain += sciC * 3;
      const banks = structs.bank || 0;
      if (at === 0) goldGain += banks; // simplified 10% return
      if (goldGain) updates[`players/${p.uid}/gold`] = (p.gold || 0) + goldGain;
      if (sciGain)  updates[`players/${p.uid}/sci`]  = (p.sci  || 0) + sciGain;
    }
    // Apply pending Tank hits scheduled for nextYear
    const pending = game.pendingHits || {};
    const pendingLogs = [];
    for (const [k, h] of Object.entries(pending)) {
      if (h.appliesOnYear === nextYear) {
        const before = updates[`players/${h.target}/gold`] != null
          ? updates[`players/${h.target}/gold`]
          : (game.players?.[h.target]?.gold || 0);
        updates[`players/${h.target}/gold`] = Math.max(0, before - (h.dmg || 0));
        updates[`pendingHits/${k}`] = null; // consume
        pendingLogs.push({
          from: h.from, target: h.target, dmg: h.dmg
        });
      }
    }
    return { updates, pendingLogs };
  }

  function _detectVictory(game) {
    const players = _orderedPlayers(game.players);
    for (const p of players) if ((p.sci || 0) >= 100) return { winner: p, type: "Science" };
    for (const p of players) if ((p.mvp || 0) >= 2)   return { winner: p, type: "Military" };
    const sorted = [...players].sort((a,b) => (b.gold||0) - (a.gold||0));
    if (sorted.length >= 2 && (sorted[0].gold||0) - (sorted[1].gold||0) >= 50) {
      return { winner: sorted[0], type: "Economy" };
    }
    return null;
  }

  async function endTurn(code) {
    const uid = await _uid();
    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!game || game.meta.status !== "playing") return;
    const players = _orderedPlayers(game.players);
    if (!players.length) return;

    const currentIdx = game.meta.turnIdx;
    const onlyMe = players[currentIdx]?.uid;
    // Allow current player OR (anyone) when turn has expired
    const expired = game.meta.turnDeadline && Date.now() > game.meta.turnDeadline + 1000;
    if (!expired && onlyMe !== uid) throw new Error("Not your turn.");

    // Find next online player
    let nextIdx = (currentIdx + 1) % players.length;
    let safety = players.length;
    while (players[nextIdx].online === false && safety-- > 0) {
      nextIdx = (nextIdx + 1) % players.length;
    }
    const wrapped = nextIdx <= currentIdx;

    const updates = {};
    let nextYear = game.meta.year;
    if (wrapped) {
      nextYear += 1;
      const { updates: tickUpdates, pendingLogs } = _yearTickUpdates(game, nextYear);
      Object.assign(updates, tickUpdates);
      const newLogKey = gref(code, "log").push().key;
      updates[`log/${newLogKey}`] = {
        year: nextYear,
        text: `Year ${nextYear} begins. Annual income applied.`,
        kind: "", ts: Date.now(),
      };
      for (const pl of pendingLogs) {
        const k = gref(code, "log").push().key;
        const fromName = game.players[pl.from]?.name || "Tank";
        const tgtName  = game.players[pl.target]?.name || "target";
        updates[`log/${k}`] = {
          year: nextYear,
          text: `${fromName}'s Tank shells ${tgtName} again — ${pl.dmg}M lost.`,
          kind: "war", ts: Date.now() + 1,
        };
      }
    }

    updates["meta/turnIdx"] = nextIdx;
    updates["meta/year"] = nextYear;
    updates["meta/turnDeadline"] = Date.now() + TURN_SECONDS * 1000;

    // Apply year tick to local copy for victory detection
    const projected = JSON.parse(JSON.stringify(game));
    for (const [k, v] of Object.entries(updates)) {
      const parts = k.split("/");
      let cur = projected;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] || {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = v;
    }
    const victory = _detectVictory(projected);
    if (victory) {
      updates["meta/status"] = "finished";
      updates["meta/winnerId"] = victory.winner.uid;
      updates["meta/victoryType"] = victory.type;
      updates["meta/finishedAt"] = Date.now();
      const winLogKey = gref(code, "log").push().key;
      updates[`log/${winLogKey}`] = {
        year: nextYear,
        text: `${victory.winner.name} achieves a ${victory.type} victory!`,
        kind: "win", ts: Date.now(),
      };
    } else if (nextYear > game.meta.totalRounds) {
      // Time-out victory: highest combined score
      const scored = [...players].sort((a,b) =>
        ((b.sci||0)*2 + (b.gold||0) + (b.mvp||0)*30) -
        ((a.sci||0)*2 + (a.gold||0) + (a.mvp||0)*30)
      );
      updates["meta/status"] = "finished";
      updates["meta/winnerId"] = scored[0].uid;
      updates["meta/victoryType"] = "Time — high score";
      updates["meta/finishedAt"] = Date.now();
    }

    await gref(code).update(updates);

    if (expired && onlyMe !== uid) {
      await gref(code, "log").push({
        year: nextYear,
        text: `${players[currentIdx]?.name || "A player"}'s turn timed out — skipped.`,
        kind: "", ts: Date.now(),
      });
    }
  }

  // Expose
  window.api = {
    createGame, joinGame, leaveGame, setReady, startGame,
    buyCard, playEconScience, attackPlayer, endTurn,
    TURN_SECONDS,
  };
})();
