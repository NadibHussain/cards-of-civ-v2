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
        You start with 7 Gold and play cards from a shared store to build wealth, grow your food supply, research science, or wage war.
        First to fulfil a victory condition wins — or the wealthiest civilization at the end of the age takes the Economy victory.
      </p>

      <section>
        <h2>Resources</h2>
        <div className="res-row">
          <div className="res-tile">
            <div className="icon">◆</div>
            <h4>Gold (M)</h4>
            <p>Spent on every card. Earned from Markets, Banks, and the +1M annual peace dividend.</p>
          </div>
          <div className="res-tile">
            <div className="icon">◇</div>
            <h4>Food</h4>
            <p>Produced by Farm (+1/year) and Factory (+4/year). Represents your civilization's agricultural output. Three Farms are required to build a Factory.</p>
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
          <li>You can hold a <b>maximum of 7 cards</b> in your hand at once.</li>
          <li>The store is shared — first to a card gets it.</li>
          <li>At the end of every year, players <b>not at war</b> receive <span style={{color:"var(--gold-300)"}}>+1M Gold</span>. Persistent effects (Farm, Factory, Market, Science Center) tick.</li>
          <li>Attacking any player <b>declares war</b>. War lasts until one side falls or a peace card is played.</li>
        </ul>
      </section>

      <section>
        <h2>Discarding cards</h2>
        <p style={{marginBottom:"0.75rem",color:"var(--ink-300)",fontSize:14}}>
          On your turn you may discard any card from your hand. You recoup <b>50% of its gold cost</b>, rounded down. Discarding frees up hand space and recovers partial value from cards you no longer need.
        </p>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--ink-700)",color:"var(--ink-300)",textAlign:"left"}}>
                <th style={{padding:"6px 8px",fontWeight:600}}>Card</th>
                <th style={{padding:"6px 8px",fontWeight:600}}>Gold cost</th>
                <th style={{padding:"6px 8px",fontWeight:600}}>Discard refund</th>
              </tr>
            </thead>
            <tbody>
              {window.CARDS.filter(c => c.cost.gold > 0).map(c => (
                <tr key={c.id} style={{borderBottom:"1px solid var(--ink-800)"}}>
                  <td style={{padding:"5px 8px",color:"var(--parch-100)"}}>{c.name}</td>
                  <td style={{padding:"5px 8px",color:"var(--gold-300)",fontFamily:"var(--font-mono)"}}>{c.cost.gold} gold</td>
                  <td style={{padding:"5px 8px",color: Math.floor(c.cost.gold/2) > 0 ? "var(--eco-400)" : "var(--ink-500)",fontFamily:"var(--font-mono)"}}>
                    {Math.floor(c.cost.gold / 2)} gold
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <p>Awarded at the <b>end of the game</b> to the civilization with the <b>most Gold</b>. Build Markets and manage your treasury wisely.</p>
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
        <div style={{marginTop:"1rem",padding:"0.75rem 1rem",background:"var(--ink-800)",borderRadius:8,fontSize:13,color:"var(--ink-300)"}}>
          <b style={{color:"var(--parch-100)"}}>Economy card notes:</b>
          <ul style={{marginTop:"0.5rem",paddingLeft:"1.2rem"}}>
            <li><b>Farm</b> costs 2 gold and gives +1 Food every year. Three Farms are required to build a Factory.</li>
            <li><b>Factory</b> costs 3 gold and <b>converts</b> your 3 Farm cards into a Factory — the 3 Farms are removed from your structures when Factory is played. The Factory then produces +4 Food per year (replacing the 3 farms' +3 Food).</li>
            <li><b>Market</b> costs 2 gold and provides a reliable +2 Gold every year — excellent for fuelling your treasury.</li>
            <li><b>Bank</b> requires 10 gold in your balance to purchase (costs 5 gold). When played, you give 5 gold to another player and establish a 5-year peace pact. If they honour the pact you earn back 5 gold at expiry. If they attack anyone during that period, you immediately lose 3 gold.</li>
          </ul>
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
          <li>Game length is set at lobby creation (10–30 years). Military (2 VP) and Science (100 SP) victories can trigger at any time. If no one reaches these by the final year, the player with the <b>most Gold</b> wins the Economy victory.</li>
        </ul>
      </section>
    </div>
  );
}
window.Rules = Rules;
