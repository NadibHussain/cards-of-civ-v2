// Country list for player selection — flag emoji + display name
(function () {
  const COUNTRIES = [
    { name: "United States",  flag: "🇺🇸" },
    { name: "United Kingdom", flag: "🇬🇧" },
    { name: "France",         flag: "🇫🇷" },
    { name: "Germany",        flag: "🇩🇪" },
    { name: "Japan",          flag: "🇯🇵" },
    { name: "China",          flag: "🇨🇳" },
    { name: "India",          flag: "🇮🇳" },
    { name: "Brazil",         flag: "🇧🇷" },
    { name: "Russia",         flag: "🇷🇺" },
    { name: "Canada",         flag: "🇨🇦" },
    { name: "Australia",      flag: "🇦🇺" },
    { name: "South Korea",    flag: "🇰🇷" },
    { name: "Egypt",          flag: "🇪🇬" },
    { name: "Nigeria",        flag: "🇳🇬" },
    { name: "Saudi Arabia",   flag: "🇸🇦" },
    { name: "Mexico",         flag: "🇲🇽" },
    { name: "Italy",          flag: "🇮🇹" },
    { name: "Spain",          flag: "🇪🇸" },
    { name: "Argentina",      flag: "🇦🇷" },
    { name: "Turkey",         flag: "🇹🇷" },
  ];

  window.COUNTRIES = COUNTRIES;
  window.getCountryFlag = (name) => COUNTRIES.find(c => c.name === name)?.flag || null;
})();
