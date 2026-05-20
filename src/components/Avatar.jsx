// Avatar — circle with initial
function Avatar({ name, color, size = 36 }) {
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </div>
  );
}
window.Avatar = Avatar;
