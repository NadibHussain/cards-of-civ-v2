// Avatar — country flag circle, or initial+colour fallback
function Avatar({ name, country, color, size = 36 }) {
  const flag = country ? window.getCountryFlag(country) : null;
  if (flag) {
    return (
      <div className="avatar" style={{ background: "var(--ink-700)", width: size, height: size, fontSize: Math.round(size * 0.72) }}>
        {flag}
      </div>
    );
  }
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div className="avatar" style={{ background: color || "#888", width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </div>
  );
}
window.Avatar = Avatar;
