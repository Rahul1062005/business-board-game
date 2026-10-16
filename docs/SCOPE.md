# Business: Project Scope Document

**A property-trading and business strategy game for friends**  
*Version 1.1 (revised) | October 2026 | Working title: Business*

---

## 1. Summary
**Business** is an Indian-themed digital board game for 2-6 friends. Players roll dice, buy properties, collect rent, upgrade businesses, trade with each other, and try to be the richest player or the last one standing.

Built around one primary goal: **a game that friends can play together, smoothly, without bugs.** It is a friends-only project first.

### What Changed from v1.0
| Area | v1.0 | v1.1 (This Baseline) |
|---|---|---|
| **Name** | Project Bharat Bazaar | Business |
| **Real MVP** | Local + online + LAN | Local play + online private rooms only |
| **LAN Mode** | Planned milestone (Phase 5) | Optional, after MVP |
| **3D** | 3D buildings, dice, property views on all devices | 2D first everywhere. 3D dice on desktop only, optional later |
| **AI Opponents** | Future | Optional, after MVP |
| **Bankruptcy** | Undecided | Defined (Section 5), Monopoly-style |
| **Audience** | Public portfolio & possible commercial release | Friends first. Public release is a later decision |
| **Database** | MongoDB Atlas for profiles and matches | Not needed for MVP (in-memory + local storage) |
| **Timeline** | 12-16 weeks | 16-20 weeks part-time |

---

## 2. Goals and Priorities
1. A complete match can be played start to finish by 2-6 friends with no crashes and no rule errors.
2. It works well on both phones and desktop browsers (responsive 2D SVG/CSS).
3. Friends can play together remotely by sharing a room code.
4. The same rules engine runs local and online games, so they behave identically.

### Priority Levels
* **MVP (Must Have)**: Local same-device play, save/resume, online private rooms, rules engine, trading, bankruptcy, quick-match scoring, 2D responsive UI, automated tests.
* **Nice to Have (After MVP)**: 3D dice on desktop, sound polish, rematch flow, simple reconnect improvements, animations.
* **Optional (Only if stable)**: LAN multi-device mode, basic AI opponents, 3D buildings, player profiles.

---

## 3. Scope & Rules Baseline
* **Board**: 36 spaces (Indian-inspired districts: markets, tourism areas, tech corridors, transit assets, utilities).
* **Turns**: Roll two dice, move, space resolution, upgrades, mortgage/unmortgage, trades, end turn.
* **Sets & Upgrades**: Owning complete category doubles base rent. Upgrades built/sold evenly. Top level is Flagship.
* **Mortgaging**: 50% payout from bank; 10% interest fee to unmortgage. Mortgaged properties earn zero rent.
* **Bankruptcy**:
  - Debt to player: all cash, properties, and upgrade salvage transfer to creditor.
  - Debt to bank: properties return unowned and unmortgaged to bank.
* **Match Modes**:
  1. *Quick Business*: Fixed round limit, ranked by net worth.
  2. *Classic*: Last player standing.
* **Trading**: Cash + properties with zero upgrades. Receiver can accept, reject, or counter. Atomic state application.

---

## 4. Architecture
```
business/
  apps/
    web/            # React + Vite client (Responsive 2D SVG/CSS board)
    server/         # Node.js + Socket.IO server (Authoritative rooms)
  packages/
    game-engine/    # Pure TypeScript rules & state transitions
    shared-types/   # Action, event, player, board & state types
    game-content/   # Indian districts, properties, rent tables, event cards
  docs/             # Scope, rules, tests
```
