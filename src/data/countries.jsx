// Real-world countries available for player selection
window.COUNTRIES = [
  { name: "United States",  flag: "🇺🇸", color: "#4d7cc5" },
  { name: "United Kingdom", flag: "🇬🇧", color: "#b33044" },
  { name: "France",         flag: "🇫🇷", color: "#5577dd" },
  { name: "Germany",        flag: "🇩🇪", color: "#8a7a66" },
  { name: "Japan",          flag: "🇯🇵", color: "#cc4466" },
  { name: "China",          flag: "🇨🇳", color: "#cc3322" },
  { name: "Brazil",         flag: "🇧🇷", color: "#33aa55" },
  { name: "India",          flag: "🇮🇳", color: "#dd8833" },
  { name: "Russia",         flag: "🇷🇺", color: "#6678aa" },
  { name: "South Korea",    flag: "🇰🇷", color: "#dd3355" },
  { name: "Egypt",          flag: "🇪🇬", color: "#cc9922" },
  { name: "Mexico",         flag: "🇲🇽", color: "#229955" },
  { name: "Canada",         flag: "🇨🇦", color: "#bb3322" },
  { name: "Australia",      flag: "🇦🇺", color: "#336699" },
  { name: "Nigeria",        flag: "🇳🇬", color: "#228833" },
  { name: "South Africa",   flag: "🇿🇦", color: "#339944" },
  { name: "Saudi Arabia",   flag: "🇸🇦", color: "#225533" },
  { name: "Turkey",         flag: "🇹🇷", color: "#bb2233" },
  { name: "Argentina",      flag: "🇦🇷", color: "#6699dd" },
  { name: "Italy",          flag: "🇮🇹", color: "#3399aa" },
];

window.getCountry = function(name) {
  return window.COUNTRIES.find(c => c.name === name) || null;
};
