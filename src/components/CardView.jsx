// CardView — renders a card from CARDS data, with optional qty badge
function CardView({ card, onClick, disabled, you, qty }) {
  if (!card) return null;
  const costParts = [];
  if (card.cost.gold) costParts.push(<span key="g"><span className="ico">◆</span> {card.cost.gold}M</span>);
  if (card.cost.sci)  costParts.push(<span key="s"> <span className="ico">✦</span> {card.cost.sci}SP</span>);

  const cantAfford = you && (
    (card.cost.gold && you.gold < card.cost.gold) ||
    (card.cost.sci && you.sci < card.cost.sci)
  );
  const outOfStock = qty != null && qty <= 0;
  const isDisabled = disabled || cantAfford || outOfStock;

  return (
    <div
      className={`card cat-${card.cat} ${isDisabled ? "disabled" : ""} ${outOfStock ? "out-of-stock" : ""}`}
      onClick={() => !isDisabled && onClick && onClick(card)}
    >
      {qty != null && (
        <span className={`qty-badge ${qty <= 0 ? "empty" : ""}`}>
          {qty > 0 ? `×${qty}` : "Sold out"}
        </span>
      )}
      <div className="card-cat">
        <span className="cat-badge">{card.cat.toUpperCase()}</span>
        {card.chance != null && <span>{card.chance}%</span>}
      </div>
      <div className="card-title">{card.name}</div>
      <div className="card-art" role="img" aria-label={card.artLabel || card.name}>
        <span className="art-glyph">{card.glyph}</span>
        <span className="art-tag">{card.art}</span>
      </div>
      <div className="card-effect">{card.effect}</div>
      <div className="card-foot">
        <span className="cost">{costParts}</span>
        <span className="chance">{card.cat === "military" ? "STRIKE" : card.cat === "economy" ? "BUILD" : "RESEARCH"}</span>
      </div>
    </div>
  );
}
window.CardView = CardView;
