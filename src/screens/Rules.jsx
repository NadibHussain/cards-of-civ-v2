// Rules — how-to-play reference page
function Rules({ goto }) {
  const CardView = window.CardView;
  const byCat = (c) => window.CARDS.filter(x => x.cat === c);

  return (
    <div className="rules-page" data-screen-label="07 Rules">
      <a className="back" onClick={() => goto("menu")}>← Back to menu</a>
      <h1>How to play</h1>
      <p className="lead">
        Cards of Civilization is a turn-based card game for 3–8 players. Each round is a year.
        You start with 7 Gold and play cards from a shared store to build wealth, research science, or wage war.
        First to fulfil any of three victory conditions wins.
      </p>

      <section>
        <h2>Resources</h2>
        <div className="res-row">
          <div className="res-tile">
            <div className="icon">◆</div>
            <h4>Gold (M)</h4>
            <p>Spent on every card. Earned from Factories, Banks, Agriculture, and the +1M annual peace dividend.</p>
          </div>
          <div className="res-tile">
            <div className="icon">✦</div>
            <h4>Science (SP)</h4>
            <p>Required for advanced military and unlocks the Science victory path. Earned from Science Centers.</p>
          </div>
          <div className="res-tile">
            <div className="icon">★</div>
            <h4>Victory Points</h4>
            <p>Awarded for decisive military outcomes against opponents. Two VP grants a Military victory.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Turn flow</h2>
        <ul>
          <li>Turn order is fixed per round (year). Each player takes one full turn before the year advances.</li>
          <li>On your turn: <b>draw from the shared store</b>, <b>play cards</b> from your hand, or <b>pass</b>.</li>
          <li>The store is shared — first to a card gets it.</li>
          <li>At the end of every year, players <b>not at war</b> receive <span style={{color:"var(--gold-300)"}}>+1M Gold</span>. Persistent effects (Factory, Agriculture, Science Center) tick.</li>
          <li>Attacking any player <b>declares war</b>. War lasts until one side falls or a peace card is played.</li>
        </ul>
      </section>

      <section>
        <h2>Victory conditions</h2>
        <div className="victory-grid">
          <div className="vc mil">
            <h4>Military</h4>
            <p>Earn <b>2 Victory Points</b> by defeating opponents in war.</p>
          </div>
          <div className="vc eco">
            <h4>Economy</h4>
            <p>Hold a Gold treasury <b>≥ 50M ahead</b> of every other player.</p>
          </div>
          <div className="vc sci">
            <h4>Science</h4>
            <p>Reach <b>100 Science Points</b>.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Cards · Military</h2>
        <div className="cards-grid">
          {byCat("military").map(c => <CardView key={c.id} card={c} disabled={true} />)}
        </div>
      </section>

      <section>
        <h2>Cards · Economy</h2>
        <div className="cards-grid">
          {byCat("economy").map(c => <CardView key={c.id} card={c} disabled={true} />)}
        </div>
      </section>

      <section>
        <h2>Cards · Science</h2>
        <div className="cards-grid">
          {byCat("science").map(c => <CardView key={c.id} card={c} disabled={true} />)}
        </div>
      </section>

      <section>
        <h2>Setup</h2>
        <ul>
          <li><b>Host</b> creates a game; the system generates a unique 6-character token (e.g. <span style={{fontFamily:"var(--font-mono)",color:"var(--gold-400)"}}>A7K2QM</span>).</li>
          <li>Players join by entering the token. Lobby opens with 3–8 player slots.</li>
          <li>Once everyone is ready, the host starts Year 1.</li>
          <li>Game length is set at lobby creation (10–30 years). Earliest fulfilled victory condition wins. If no one wins by the final year, the player with the highest combined score takes it.</li>
        </ul>
      </section>
    </div>
  );
}
window.Rules = Rules;
