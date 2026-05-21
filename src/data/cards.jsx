// Card definitions
window.CARDS = [
  // Military
  {
    id: "infantry", cat: "military", name: "Infantry",
    cost: { gold: 1 }, chance: 65,
    art: "REGIMENT", glyph: "▲", artLabel: "Infantry illustration",
    effect: <>65% chance to <span className="hi">reduce 2–3 Gold</span> from target. Failed strikes lose the cost.</>,
    summary: "Reduce 2–3M of target"
  },
  {
    id: "artillery", cat: "military", name: "Artillery",
    cost: { gold: 2 }, chance: 45,
    art: "BARRAGE", glyph: "◉", artLabel: "Artillery battery",
    effect: <>45% chance to <span className="hi">reduce 4–6 Gold</span> from target's treasury. Heavier strike, lower odds.</>,
    summary: "Reduce 4–6M of target"
  },
  {
    id: "spy", cat: "military", name: "Spy",
    cost: { gold: 1 }, chance: 55,
    art: "COVERT OP", glyph: "◐", artLabel: "Covert operative",
    effect: <>55% to <span className="hi">steal 1–2 Gold</span>. If caught the card returns to the store and you are <span className="hi">at war</span>.</>,
    summary: "Steal 1–2M • risk war if caught"
  },
  {
    id: "tank", cat: "military", name: "Tank",
    cost: { gold: 4, sci: 10 }, chance: 100,
    art: "ARMORED COLUMN", glyph: "■", artLabel: "Armored column",
    effect: <><span className="hi">12 Gold damage over 2 years</span> (6 per year). Persistent strike — target stays at war.</>,
    summary: "12M dmg over 2 years"
  },
  {
    id: "drone", cat: "military", name: "Drone Strike",
    cost: { gold: 3, sci: 7 }, chance: 80,
    art: "AERIAL", glyph: "▼", artLabel: "Aerial drone",
    effect: <>80% chance to <span className="hi">reduce 5–8 Gold</span> from any opponent, ignoring Defence Science.</>,
    summary: "Bypass defence, 5–8M"
  },

  // Economy
  {
    id: "factory", cat: "economy", name: "Factory",
    cost: { gold: 3 }, chance: null,
    art: "INDUSTRY", glyph: "▥", artLabel: "Factory facade",
    effect: <>Requires <span className="hi">3 Farm cards</span> already played. Produces <span className="hi">+4 Food</span> every year.</>,
    summary: "Req. 3 Farms · +4 Food / year"
  },
  {
    id: "bank", cat: "economy", name: "Bank",
    cost: { gold: 5 }, chance: null,
    art: "VAULT", glyph: "◧", artLabel: "Bank vault",
    effect: <>Requires <span className="hi">10 Gold</span> balance to buy (costs 5). Play to give 5 Gold to another player — they must not attack for <span className="hi">5 years</span>. If they keep the pact you earn <span className="hi">+5 Gold</span>; if they attack, you lose <span className="hi">3 Gold</span>.</>,
    summary: "Req. 10G bal · Pact: give 5G → earn 5G or lose 3G"
  },
  {
    id: "agriculture", cat: "economy", name: "Farm",
    cost: { gold: 2 }, chance: null,
    art: "FIELDS", glyph: "◇", artLabel: "Farm fields",
    effect: <><span className="hi">+1 Food</span> every year, forever. Three Farms unlock the Factory.</>,
    summary: "+1 Food / year"
  },
  {
    id: "market", cat: "economy", name: "Market",
    cost: { gold: 2 }, chance: null,
    art: "BAZAAR", glyph: "⊕", artLabel: "Market bazaar",
    effect: <><span className="hi">+2 Gold</span> every year, forever.</>,
    summary: "+2G / year"
  },

  // Science
  {
    id: "defence", cat: "science", name: "Defence Science",
    cost: { gold: 3 }, chance: null,
    art: "FORTIFICATION", glyph: "⬡", artLabel: "Fortified shield",
    effect: <>Reduces incoming attack chance by <span className="hi">10–15%</span>. Does not block Drone Strikes.</>,
    summary: "Defence −10–15%"
  },
  {
    id: "mil-reduce", cat: "science", name: "Logistics Doctrine",
    cost: { gold: 6 }, chance: null,
    art: "DOCTRINE", glyph: "⊞", artLabel: "Logistics diagram",
    effect: <><span className="hi">−1 Gold cost</span> on all your Military cards for the rest of the game.</>,
    summary: "Cheaper military"
  },
  {
    id: "sci-center", cat: "science", name: "Science Center",
    cost: { gold: 3 }, chance: null,
    art: "RESEARCH", glyph: "✦", artLabel: "Research center",
    effect: <><span className="hi">+3 Science</span> per year. Stacks. Path to a Science victory.</>,
    summary: "+3 SP / year"
  },
];

window.getCardById = (id) => window.CARDS.find(c => c.id === id);
