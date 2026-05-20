# Cards of Civilization

A real-time multiplayer card game for 3–8 players, built with React, Firebase Realtime Database, and vanilla CSS.

## Overview

Players take turns buying and playing cards from a shared store to build their civilization through three competing paths:

- **Military** — attack opponents, steal gold, earn Victory Points
- **Economy** — build factories, banks, and farms for passive income
- **Science** — research technologies and race to 100 Science Points

## Victory conditions

| Path | Condition |
|------|-----------|
| Military | Earn **2 Victory Points** (by routing opponents) |
| Economy | Hold **≥ 50M Gold more** than every other player |
| Science | Accumulate **100 Science Points** |

If the round limit expires with no winner, the highest combined score takes it.

## Running locally

Open `index.html` directly in a browser — no build step required. The app uses the Firebase compat CDN and Babel standalone to compile JSX at runtime.

> **Firebase setup required.** The app connects to a Firebase Realtime Database. Update `src/firebase/init.jsx` with your own project credentials, enable Anonymous Auth, and apply `database.rules.json` to your RTDB instance.

## Project structure

```
index.html              # Entry point — loads all scripts and styles
print.html              # Print-friendly card reference sheet
database.rules.json     # Firebase Realtime Database security rules
src/
  App.jsx               # Root component — auth, routing, game subscription
  components/
    Avatar.jsx          # Circular avatar with initial
    CardView.jsx        # Card renderer (hand, store, rules)
    DevNav.jsx          # Left sidebar screen navigator
  data/
    cards.jsx           # Card definitions (11 cards across 3 categories)
    players.jsx         # Demo data for offline testing
  firebase/
    init.jsx            # Firebase app init + anonymous auth
    api.jsx             # All RTDB game operations (create, join, play, etc.)
    hooks.jsx           # useGame, useUid, useTurnTimer React hooks
  screens/
    Menu.jsx            # Main menu
    Create.jsx          # Host a new game
    Join.jsx            # Join via 6-character token
    Lobby.jsx           # Waiting room (live player list)
    Game.jsx            # Live game board
    End.jsx             # Victory screen with standings
    Rules.jsx           # How-to-play reference
  styles/
    tokens.css          # Design tokens (colors, fonts, radii)
    base.css            # Reset, layout, buttons, modals
    cards.css           # Card and avatar styles
    menu.css            # Menu screen
    forms.css           # Panels, fields, token input
    lobby.css           # Lobby waiting room
    game.css            # Game board, dashboard, shop
    rules.css           # Rules page and end screen
    mobile.css          # Responsive breakpoints (tablet + mobile)
  utils/
    token.jsx           # genToken() — 6-char invite code generator
```

## Game mechanics

- **Turn timer** — 75 seconds per turn; expired turns are skipped automatically
- **Shared store** — limited card supply; first to buy gets it
- **War system** — attacking declares war; war persists until conditions are met
- **Persistent effects** — Factory, Agriculture, Science Center, Bank, Defence Science, and Logistics Doctrine all stack across years
- **Annual tick** — at year-end, peaceful players earn +1M; all passive structures produce income
