// Game API — all Firebase Realtime Database operations
// Each fn assumes window.fb is initialized and user is signed in.

(function () {
  const TURN_SECONDS = 75;
  const STARTING_GOLD = 7;
  const STARTING_FOOD = 3;
  const TOTAL_ROUNDS_DEFAULT = 20;
  const MAX_HAND_SIZE = 7;

  function gref(code, sub) {
    return window.fb.db.ref(`games/${code}${sub ? "/" + sub : ""}`);
  }

  async function _uid() {
    // Use the user resolved by the ready promise rather than re-reading currentUser,
    // which can be null in restricted WebViews (e.g. Facebook in-app browser) due to
    // auth persistence being blocked by storage/cookie restrictions.
    const u = await window.fb.ready;
    return u.uid;
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
      nation: "",
      flag: "",
      color: "#555566",
      gold: STARTING_GOLD,
      sci: 0,
      mvp: 0,
      food: STARTING_FOOD,
      atWar: {},
      host: true,
      ready: false,
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
      nation: "",
      flag: "",
      color: "#555566",
      gold: STARTING_GOLD,
      sci: 0,
      mvp: 0,
      food: STARTING_FOOD,
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
    if (players.some(p => !p.nation)) throw new Error("All players must pick a country.");
    if (players.some(p => !p.ready)) throw new Error("All players must be ready.");

    await gref(code).update({
      "meta/status": "playing",
      "meta/year": 1,
      "meta/turnIdx": 0,
      "meta/turnDeadline": Date.now() + TURN_SECONDS * 1000,
    });

    await gref(code, "log").push({
      year: 1,
      text: `Year 1 begins. Every civilization starts with ${STARTING_GOLD}M Gold and ${STARTING_FOOD} Food.`,
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

    // Max hand size
    const handSize = Object.keys(game.hand?.[uid] || {}).length;
    if (handSize >= MAX_HAND_SIZE) throw new Error(`Hand is full (max ${MAX_HAND_SIZE} cards).`);

    // Logistics Doctrine: −1 gold per stack on military cards (floor at 0)
    const logistics = game.structures?.[uid]?.["mil-reduce"] || 0;
    let gold = card.cost.gold || 0;
    if (card.cat === "military" && logistics > 0) {
      gold = Math.max(0, gold - logistics);
    }
    const sci = card.cost.sci || 0;

    // Bank requires a minimum balance of 10 gold (before cost is applied)
    if (card.id === "bank" && (p.gold || 0) < 10) {
      throw new Error("Bank requires at least 10 Gold in your treasury.");
    }

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

    // Factory requires 3 Farm cards already placed; converts (consumes) them
    if (card.id === "factory") {
      const farmCount = game.structures?.[uid]?.agriculture || 0;
      if (farmCount < 3) throw new Error("Factory requires at least 3 Farm cards already played.");
    }

    await gref(code, `hand/${uid}/${handKey}`).remove();

    // Persistent effect — register structures
    const updates = {};
    if (["sci-center","factory","agriculture","defence","mil-reduce","market"].includes(card.id)) {
      updates[`structures/${uid}/${card.id}`] = (game.structures?.[uid]?.[card.id] || 0) + 1;
    }
    // Factory consumes the 3 farms that were required
    if (card.id === "factory") {
      updates[`structures/${uid}/agriculture`] = (game.structures?.[uid]?.agriculture || 0) - 3;
    }
    if (Object.keys(updates).length) await gref(code).update(updates);

    await gref(code, "log").push({
      year: game.meta.year,
      text: `${game.players[uid].name} played ${card.name}.`,
      kind: card.cat === "science" ? "sci" : "eco",
      ts: Date.now(),
    });
  }

  // Play the Bank card: give 5 gold to target, establish a 5-year pact.
  async function playBank(code, handKey, targetUid) {
    const uid = await _uid();

    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!game || game.meta.status !== "playing") throw new Error("Game not in progress.");
    if (!_isYourTurn(game, uid)) throw new Error("Not your turn.");
    if (!game.players[targetUid]) throw new Error("Target not in game.");
    if (targetUid === uid) throw new Error("Cannot make a pact with yourself.");

    const p = game.players[uid];
    if ((p.gold || 0) < 5) throw new Error("You need at least 5 Gold to fund the pact.");

    const currentYear = game.meta.year || 1;
    const loanKey = gref(code, "bankLoans").push().key;

    await gref(code, `hand/${uid}/${handKey}`).remove();
    await gref(code).update({
      [`players/${uid}/gold`]: (p.gold || 0) - 5,
      [`players/${targetUid}/gold`]: (game.players[targetUid].gold || 0) + 5,
      [`bankLoans/${loanKey}`]: {
        lender: uid,
        borrower: targetUid,
        amount: 5,
        createdYear: currentYear,
        expiresYear: currentYear + 5,
        violated: false,
      },
    });

    await gref(code, "log").push({
      year: currentYear,
      text: `${p.name} (Bank) gave 5M Gold to ${game.players[targetUid].name} — peace pact for 5 years.`,
      kind: "eco",
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

    // Check if attacker (uid) is violating any active Bank pact as borrower
    const bankLoans = game.bankLoans || {};
    const currentYear = game.meta.year || 1;
    for (const [k, loan] of Object.entries(bankLoans)) {
      if (loan.borrower === uid && !loan.violated && loan.expiresYear > currentYear) {
        const lenderGold = game.players[loan.lender]?.gold || 0;
        await gref(code).update({
          [`bankLoans/${k}/violated`]: true,
          [`players/${loan.lender}/gold`]: Math.max(0, lenderGold - 3),
        });
        const lenderName = game.players[loan.lender]?.name || "lender";
        await gref(code, "log").push({
          year: currentYear,
          text: `${game.players[uid].name} broke the Bank pact — ${lenderName} loses 3M Gold.`,
          kind: "war",
          ts: Date.now(),
        });
      }
    }

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
    const ts = Date.now();
    await gref(code, "log").push({ year: game.meta.year, text, kind: "war", ts });
    await gref(code, "lastAttack").set({
      attackerName: yourName,
      targetName: tgtName,
      cardName: card.name,
      cardId: card.id,
      hit,
      dmg: hit ? dmg : 0,
      stolen: card.id === "spy" && hit ? stolen : 0,
      ts,
    });
  }

  // Compute and apply persistent effects when a new year starts.
  function _yearTickUpdates(game, nextYear) {
    const updates = {};
    const bankLogs = [];
    const players = _orderedPlayers(game.players);

    for (const p of players) {
      const at = p.atWar ? Object.keys(p.atWar).length : 0;
      const structs = game.structures?.[p.uid] || {};
      let goldGain = 0;
      let sciGain = 0;
      let foodGain = 0;

      if (at === 0) goldGain += 1; // peace dividend

      // Market: +2 gold/year
      const markets = structs.market || 0;
      goldGain += markets * 2;

      // Farm: +1 food/year each
      const farms = structs.agriculture || 0;
      foodGain += farms;

      // Factory: +4 food/year each (requires 3 farms, enforced at play time)
      const factories = structs.factory || 0;
      foodGain += factories * 4;

      // Science Center: +3 SP/year
      const sciC = structs["sci-center"] || 0;
      sciGain += sciC * 3;

      if (goldGain) updates[`players/${p.uid}/gold`] = (p.gold || 0) + goldGain;
      if (sciGain)  updates[`players/${p.uid}/sci`]  = (p.sci  || 0) + sciGain;
      if (foodGain) updates[`players/${p.uid}/food`] = (p.food || 0) + foodGain;

      // Reset war state at year boundary so the peace dividend resets each year
      if (p.atWar && Object.keys(p.atWar).length > 0) {
        updates[`players/${p.uid}/atWar`] = null;
      }
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

    // Process Bank loan expirations
    const bankLoans = game.bankLoans || {};
    for (const [k, loan] of Object.entries(bankLoans)) {
      if (loan.expiresYear === nextYear) {
        if (!loan.violated) {
          // Pact kept — return 5 gold to lender
          const before = updates[`players/${loan.lender}/gold`] != null
            ? updates[`players/${loan.lender}/gold`]
            : (game.players?.[loan.lender]?.gold || 0);
          updates[`players/${loan.lender}/gold`] = before + 5;
          const lenderName = game.players?.[loan.lender]?.name || "lender";
          const borrowerName = game.players?.[loan.borrower]?.name || "borrower";
          bankLogs.push({ text: `Bank pact expired: ${borrowerName} kept peace — ${lenderName} earns back 5M Gold.`, kind: "eco" });
        }
        updates[`bankLoans/${k}`] = null; // consume loan
      }
    }

    return { updates, pendingLogs, bankLogs };
  }

  function _detectVictory(game) {
    const players = _orderedPlayers(game.players);
    for (const p of players) if ((p.sci || 0) >= 100) return { winner: p, type: "Science" };
    for (const p of players) if ((p.mvp || 0) >= 2)   return { winner: p, type: "Military" };
    // Economy victory is determined at game end (timeout), not mid-game
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
      const { updates: tickUpdates, pendingLogs, bankLogs } = _yearTickUpdates(game, nextYear);
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
      for (const bl of bankLogs) {
        const k = gref(code, "log").push().key;
        updates[`log/${k}`] = {
          year: nextYear,
          text: bl.text,
          kind: bl.kind,
          ts: Date.now() + 2,
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
      // Time-out: Economy victory — wealthiest civilization wins
      const projPlayers = _orderedPlayers(projected.players);
      const byGold = [...projPlayers].sort((a,b) => (b.gold||0) - (a.gold||0));
      updates["meta/status"] = "finished";
      updates["meta/winnerId"] = byGold[0].uid;
      updates["meta/victoryType"] = "Economy";
      updates["meta/finishedAt"] = Date.now();
      const winLogKey = gref(code, "log").push().key;
      updates[`log/${winLogKey}`] = {
        year: nextYear,
        text: `The age ends. ${byGold[0].name} wins the Economy victory with the most Gold!`,
        kind: "win", ts: Date.now(),
      };
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

  async function selectCountry(code, countryName) {
    const uid = await _uid();
    const country = (window.COUNTRIES || []).find(c => c.name === countryName);
    if (!country) throw new Error("Unknown country.");

    const playersSnap = await gref(code, "players").once("value");
    const players = playersSnap.val() || {};
    const takenBy = Object.values(players).find(p => p.nation === countryName && p.uid !== uid);
    if (takenBy) throw new Error(`${countryName} is already taken.`);

    await gref(code, `players/${uid}`).update({
      nation: country.name,
      flag: country.flag,
      color: country.color,
    });
  }

  // Discard a card from hand — refund is floor(goldCost / 2)
  async function discardCard(code, handKey, cardId) {
    const uid = await _uid();
    const card = window.getCardById(cardId);
    if (!card) throw new Error("Unknown card");

    const gameSnap = await gref(code).once("value");
    const game = gameSnap.val();
    if (!game || game.meta.status !== "playing") throw new Error("Game not in progress.");
    if (!_isYourTurn(game, uid)) throw new Error("Not your turn.");

    const refund = Math.floor((card.cost.gold || 0) / 2);
    const p = game.players[uid];

    await gref(code, `hand/${uid}/${handKey}`).remove();
    if (refund > 0) {
      await gref(code, `players/${uid}/gold`).set((p.gold || 0) + refund);
    }

    await gref(code, "log").push({
      year: game.meta.year,
      text: `${p.name} discarded ${card.name}${refund > 0 ? ` and recouped ${refund} gold` : ""}.`,
      kind: "",
      ts: Date.now(),
    });
  }

  // Expose
  window.api = {
    createGame, joinGame, leaveGame, setReady, selectCountry, startGame,
    buyCard, playEconScience, playBank, attackPlayer, endTurn, discardCard,
    TURN_SECONDS,
    MAX_HAND_SIZE,
  };
})();
