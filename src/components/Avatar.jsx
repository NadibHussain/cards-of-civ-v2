// Avatar — flag emoji circle or initial fallback
function Avatar({ name, color, flag, size = 36 }) {
  const content = flag || (name || "?").trim()[0]?.toUpperCase() || "?";
  const fontSize = flag ? size * 0.65 : size * 0.42;
  return (
    <div className="avatar" style={{ background: color, width: size, height: size, fontSize }}>
      {content}
    </div>
  );
}
window.Avatar = Avatar;
