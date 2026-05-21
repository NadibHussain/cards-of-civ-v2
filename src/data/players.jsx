// Demo / starter data: players, hand, store, log
window.DEMO_PLAYERS = [
  { id: "p1", name: "You",  nation: "Japan",         flag: "🇯🇵", color: "#cc4466", gold: 14, sci: 7,  mvp: 0, evp: 0, svp: 0, host: true,  atWar: ["p3"], you: true },
  { id: "p2", name: "Mira", nation: "France",        flag: "🇫🇷", color: "#5577dd", gold: 9,  sci: 12, mvp: 0, evp: 0, svp: 0, host: false, atWar: [] },
  { id: "p3", name: "Theo", nation: "Brazil",        flag: "🇧🇷", color: "#33aa55", gold: 22, sci: 4,  mvp: 1, evp: 0, svp: 0, host: false, atWar: ["p1"] },
  { id: "p4", name: "Nori", nation: "India",         flag: "🇮🇳", color: "#dd8833", gold: 6,  sci: 18, mvp: 0, evp: 0, svp: 0, host: false, atWar: [] },
  { id: "p5", name: "Ayla", nation: "South Korea",   flag: "🇰🇷", color: "#dd3355", gold: 11, sci: 9,  mvp: 0, evp: 0, svp: 0, host: false, atWar: [] },
];

window.DEMO_HAND = ["infantry", "factory", "sci-center", "spy", "agriculture"];

window.DEMO_STORE = window.CARDS || [];

window.DEMO_LOG = [
  { year: 4, text: "Mira researched Science Center (+3 SP/year).", kind: "sci" },
  { year: 4, text: "Theo built a Factory.", kind: "eco" },
  { year: 5, text: "Theo attacked you with Infantry — hit for 3M.", kind: "war" },
  { year: 5, text: "You are now at war with Brazil.", kind: "war" },
  { year: 6, text: "Nori reached 18 SP.", kind: "sci" },
  { year: 6, text: "You acquired Spy.", kind: "" },
  { year: 7, text: "Year 7 begins. Peaceful players gain +1M.", kind: "" },
];
