# Business — Indian Property Strategy Board Game 💼

[![CI Test Suite](https://img.shields.io/badge/tests-9%20passed-10b981.svg)](packages/game-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)

**Business** is an authentic Indian-themed digital board game for 2–6 friends. Players roll dice, buy prestigious real estate districts across India (Chandni Chowk, Koramangala, Bandra Kurla Complex, Goa Waterfront, etc.), collect rent, build flagship enterprises, negotiate player trades, navigate government taxes and festive cards, and compete to become the wealthiest tycoon or the last one standing.

Built adhering to the **Business Project Scope Document (v1.1)** with a pure, headless TypeScript rules engine shared seamlessly between local same-device Pass & Play and authoritative Socket.IO online rooms.

---

## 🌟 Key Features

* **Authentic 36-Space Indian Board**:
  * Distinct color sets featuring India's commercial capitals: Delhi, Ahmedabad, Jaipur, Kolkata, Hyderabad, Bengaluru, Goa, and Mumbai.
  * Transit assets: Northern Railways, Air India International, Konkan Express, JNPT Maritime Port.
  * Utilities: Solar Clean Energy Grid & 5G Telecom Network.
  * Iconic Indian tokens: 🛺 Auto-Rickshaw, ☕ Chai Cup, 🦚 Peacock, 🏏 Cricket Bat, 🐘 Royal Elephant, 🐅 Royal Tiger.
* **Two Match Modes**:
  1. **Classic Mode**: Elimination gameplay until only 1 business tycoon remains standing.
  2. **Quick Business Mode**: Fast-paced session capped at a custom round limit (e.g. 25 rounds). Players are ranked by verified **Net Worth**.
* **Strict Rule Engine & Fair Play**:
  * **Color Set Bonus**: Owning an entire district set immediately doubles the base rent.
  * **Even-Building Rule**: Upgrades must be built and sold evenly across sets; top level is a single **Flagship Business** 👑.
  * **Mortgaging**: Mortgage properties for 50% cash value from the bank. Unmortgaging requires paying the 50% principal plus **10% interest**.
  * **Monopoly-Style Bankruptcy**: Debt panel opens whenever a player cannot pay dues. Liquidate upgrades (50% refund) and mortgage properties. Creditors receive remaining assets; bank debt returns properties to the open market.
  * **Atomic Trading**: Exchange cash and un-upgraded properties between players in real-time.
* **Same-Device Local Play & Auto-Save**:
  * Pass & Play mode stores full match progress directly into `localStorage`, so matches can be resumed anytime without losing state.
* **Online Multiplayer Server**:
  * Room codes, server authority, and instant WebSocket state synchronization using Node.js & Socket.IO.

---

## 🏛️ Monorepo Architecture

```text
business/
├── apps/
│   ├── web/               # Responsive React + Vite client (SVG / CSS 2D board)
│   └── server/            # Node.js + Socket.IO server for online private rooms
├── packages/
│   ├── shared-types/      # Common TypeScript types (actions, state, players, spaces)
│   ├── game-content/      # Indian cities, rent tables, and 16 Bharat event cards
│   └── game-engine/       # Pure deterministic rules reducer, seeded PRNG & unit tests
└── docs/
    └── SCOPE.md           # Scope specification baseline v1.1
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (v9 or higher)

### Installation
Clone the repository and install all monorepo dependencies:
```bash
git clone https://github.com/Rahul1062005/business-board-game.git
cd business-board-game
npm install
```

### Running the Web Client (Local Play)
Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Online Room Server
To run the Socket.IO multiplayer server:
```bash
npm run dev:server
```
Server runs by default on port `4000`.

### Running Automated Engine Tests
Run the deterministic rules engine test suite:
```bash
npm run test
```

---

## 📐 Scoring Formula (Section 5.5)

In Quick Business mode and game-over leaderboards, Net Worth is calculated precisely as:
$$\text{Net Worth} = \text{Cash} + \text{Printed Price (Unmortgaged)} + 50\% \text{ of Price (Mortgaged)} + 50\% \text{ of Upgrade Build Cost}$$

Bankrupt players are automatically ranked last.

---

## 📜 License
MIT License. Built for friendly gaming matches.
