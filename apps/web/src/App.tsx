import React, { useState, useEffect, useRef } from 'react';
import {
  GameState,
  BoardSpace,
  PlayerToken,
  GameMode,
} from '@business/shared-types';
import {
  createInitialGameState,
  applyGameAction,
} from '@business/game-engine';
import { SPACES_BY_ID, BOARD_SPACES } from '@business/game-content';
import { Board } from './components/Board.js';
import { PropertyModal } from './components/PropertyModal.js';
import { TradeModal } from './components/TradeModal.js';
import { DebtModal } from './components/DebtModal.js';
import { NewGameModal } from './components/NewGameModal.js';
import { GameOverModal } from './components/GameOverModal.js';
import { RulesModal } from './components/RulesModal.js';
import { DeedsModal } from './components/DeedsModal.js';
import { saveGameState, loadSavedGameState, clearSavedGameState } from './storage.js';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadSavedGameState();
    if (saved) return saved;
    return createInitialGameState({
      mode: 'classic',
      players: [
        { name: 'Bhoomsda', token: 'royal-elephant', color: '#2563eb' }, // Blue (From video)
        { name: 'CandyBlossom5443', token: 'auto-rickshaw', color: '#db2777' }, // Pink (From video)
      ],
    });
  });

  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const p of gameState.players) {
      initial[p.id] = p.position;
    }
    return initial;
  });

  const [selectedSpace, setSelectedSpace] = useState<BoardSpace | null>(null);
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showDeedsAlbum, setShowDeedsAlbum] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [hoppingPlayerId, setHoppingPlayerId] = useState<string | null>(null);

  // Default tilt is 18° for full, crisp visibility of the other side (Free Parking, Karnataka, Tamil Nadu, Go To Jail)
  const [boardTilt, setBoardTilt] = useState<number>(18);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<number>(75);

  const [tableTheme, setTableTheme] = useState<'wood' | 'emerald' | 'midnight'>(() => {
    return (localStorage.getItem('business_table_theme') as any) || 'wood';
  });

  useEffect(() => {
    document.body.className = `theme-${tableTheme}`;
    localStorage.setItem('business_table_theme', tableTheme);
  }, [tableTheme]);

  // Turn timer countdown
  useEffect(() => {
    setTurnTimerSeconds(75);
    const interval = setInterval(() => {
      setTurnTimerSeconds((prev) => (prev > 1 ? prev - 1 : 75));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.activePlayerIndex]);

  // Synchronize displayPositions when gameState changes outside of walking
  useEffect(() => {
    if (!isWalking) {
      setDisplayPositions((prev) => {
        const next = { ...prev };
        for (const p of gameState.players) {
          next[p.id] = p.position;
        }
        return next;
      });
    }
  }, [gameState, isWalking]);

  // Auto-save game state
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Roll dice with 3D throw animation followed by space-by-space avatar hopping
  const handleRollDice = () => {
    if (gameState.phase !== 'waiting_for_roll' || isRolling || isWalking) return;

    setIsRolling(true);

    const result = applyGameAction(gameState, { type: 'ROLL_DICE' });
    if (!result.state || !result.state.lastDiceRoll) {
      setIsRolling(false);
      return;
    }

    const [d1, d2] = result.state.lastDiceRoll;
    const totalSteps = d1 + d2;
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const startPos = activePlayer.position;

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        lastDiceRoll: [d1, d2],
      }));
      setIsRolling(false);

      if (activePlayer.inDetention && d1 !== d2 && activePlayer.detentionTurns < 2) {
        setGameState(result.state);
        return;
      }

      setIsWalking(true);
      setHoppingPlayerId(activePlayer.id);

      let stepCount = 0;
      let currentPos = startPos;

      const walkInterval = setInterval(() => {
        stepCount += 1;
        currentPos = (currentPos + 1) % 40;

        setDisplayPositions((prev) => ({
          ...prev,
          [activePlayer.id]: currentPos,
        }));

        if (stepCount >= totalSteps) {
          clearInterval(walkInterval);
          setTimeout(() => {
            setIsWalking(false);
            setHoppingPlayerId(null);
            setGameState(result.state);
          }, 200);
        }
      }, 190);
    }, 750);
  };

  const handleBuyProperty = () => {
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const spaceId = `space-${activePlayer.position}`;
    const res = applyGameAction(gameState, {
      type: 'BUY_PROPERTY',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleDeclineProperty = () => {
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const spaceId = `space-${activePlayer.position}`;
    const res = applyGameAction(gameState, {
      type: 'DECLINE_PROPERTY',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleEndTurn = () => {
    const res = applyGameAction(gameState, { type: 'END_TURN' });
    if (res.state) setGameState(res.state);
  };

  const handleBuildUpgrade = (spaceId: string) => {
    const res = applyGameAction(gameState, {
      type: 'BUILD_UPGRADE',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleSellUpgrade = (spaceId: string) => {
    const res = applyGameAction(gameState, {
      type: 'SELL_UPGRADE',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleMortgage = (spaceId: string) => {
    const res = applyGameAction(gameState, {
      type: 'MORTGAGE_PROPERTY',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleUnmortgage = (spaceId: string) => {
    const res = applyGameAction(gameState, {
      type: 'UNMORTGAGE_PROPERTY',
      payload: { spaceId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleProposeTrade = (payload: {
    toPlayerId: string;
    offeredCash: number;
    offeredPropertyIds: string[];
    requestedCash: number;
    requestedPropertyIds: string[];
  }) => {
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const res = applyGameAction(gameState, {
      type: 'PROPOSE_TRADE',
      payload: {
        fromPlayerId: activePlayer.id,
        ...payload,
      },
    });
    if (res.state) setGameState(res.state);
  };

  const handleAcceptTrade = (tradeId: string) => {
    const res = applyGameAction(gameState, {
      type: 'ACCEPT_TRADE',
      payload: { tradeId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleRejectTrade = (tradeId: string) => {
    const res = applyGameAction(gameState, {
      type: 'REJECT_TRADE',
      payload: { tradeId },
    });
    if (res.state) setGameState(res.state);
  };

  const handleResolveDebt = () => {
    const res = applyGameAction(gameState, { type: 'RESOLVE_DEBT' });
    if (res.state) setGameState(res.state);
  };

  const handleDeclareBankruptcy = () => {
    const res = applyGameAction(gameState, { type: 'DECLARE_BANKRUPTCY' });
    if (res.state) setGameState(res.state);
  };

  const handleStartNewGame = (params: {
    mode: GameMode;
    players: Array<{ name: string; token: PlayerToken; color: string }>;
    maxRounds?: number;
  }) => {
    clearSavedGameState();
    const newState = createInitialGameState({
      mode: params.mode,
      players: params.players,
      maxRounds: params.maxRounds,
    });
    setGameState(newState);
    setShowNewGameModal(false);
  };

  const handleRematch = () => {
    clearSavedGameState();
    const players = gameState.players.map((p) => ({
      name: p.name,
      token: p.token,
      color: p.color,
    }));
    const newState = createInitialGameState({
      mode: gameState.mode,
      players,
      maxRounds: gameState.settings.quickModeMaxRounds,
    });
    setGameState(newState);
  };

  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Open property manager for first owned property or space
  const handleOpenPropertyManager = () => {
    const firstOwned = Object.values(gameState.properties).find(
      (p) => p.ownerId === activePlayer.id
    );
    if (firstOwned) {
      const space = SPACES_BY_ID.get(firstOwned.spaceId);
      if (space) setSelectedSpace(space);
    } else {
      setShowDeedsAlbum(true);
    }
  };

  return (
    <div className="roblox-tabletop-container">
      {/* ========================================================= */}
      {/* TOP FLOATING HUD BAR (Matching User Video)                */}
      {/* ========================================================= */}
      <header className="top-hud-bar">
        {/* Left: Turn Timer & Angle Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="turn-timer-badge" title="Turn Countdown">
            <span>⏳</span>
            <span>{turnTimerSeconds}</span>
          </div>

          <button
            className="camera-tilt-toggle"
            onClick={() => setBoardTilt((prev) => (prev > 0 ? 0 : 18))}
            title="Toggle between 3D Tabletop and Top-Down view"
          >
            {boardTilt > 0 ? '📐 3D Tilt (18°)' : '📐 Flat View (0°)'}
          </button>
        </div>

        {/* Center: Floating Player Capsules (Matching Video Header) */}
        <div className="top-players-row">
          {gameState.players.map((player, idx) => {
            const isActive = player.id === activePlayer.id;
            return (
              <div
                key={player.id}
                className={`player-hud-capsule ${isActive ? 'is-active' : ''}`}
                style={{
                  borderLeftColor: player.color,
                  borderLeftWidth: '5px',
                }}
              >
                <div
                  className="player-hud-avatar"
                  style={{ backgroundColor: player.color }}
                >
                  {player.token === 'auto-rickshaw' && '🛺'}
                  {player.token === 'chai-cup' && '☕'}
                  {player.token === 'peacock' && '🦚'}
                  {player.token === 'cricket-bat' && '🏏'}
                  {player.token === 'royal-elephant' && '🐘'}
                  {player.token === 'tiger' && '🐅'}
                </div>

                <div className="player-hud-info">
                  <div className="player-hud-name-row">
                    <span>{player.name}</span>
                    <span className="player-hud-flame">🔥 {idx + 1}</span>
                  </div>
                  <div className="player-hud-cash">₹{player.cash}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Theme & Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="theme-selector-dropdown"
            value={tableTheme}
            onChange={(e) => setTableTheme(e.target.value as any)}
            title="Tabletop Background Theme"
          >
            <option value="wood">🪵 Living Room Table</option>
            <option value="emerald">♠️ Casino Emerald</option>
            <option value="midnight">🌌 Midnight Lounge</option>
          </select>

          <button
            className="btn-secondary"
            onClick={() => setShowRulesModal(true)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            📖 Rules
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowNewGameModal(true)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            + New
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 3D TABLETOP ARENA                                         */}
      {/* ========================================================= */}
      <main className="tabletop-center-arena">
        <Board
          state={gameState}
          displayPositions={displayPositions}
          hoppingPlayerId={hoppingPlayerId}
          boardTilt={boardTilt}
          onSelectSpace={(space) => setSelectedSpace(space)}
          onRollDice={handleRollDice}
          onEndTurn={handleEndTurn}
          onBuyProperty={handleBuyProperty}
          onDeclineProperty={handleDeclineProperty}
          isRolling={isRolling}
          isWalking={isWalking}
        />
      </main>

      {/* ========================================================= */}
      {/* BOTTOM ACTION DOCK (Matching Video 00:05 - 00:41)         */}
      {/* ========================================================= */}
      <footer className="roblox-bottom-bar">
        {/* Left: Round Pill */}
        <div className="bottom-left-space">
          <span className="round-pill">
            Round {gameState.round}
          </span>
        </div>

        {/* Center Dock of Action Cards (Manage, View Deeds, Trading, Roll/End Turn) */}
        <div className="roblox-action-dock">
          {/* Card 1: Manage Properties */}
          <button
            className="dock-card-btn"
            onClick={handleOpenPropertyManager}
            title="Manage Houses & Mortgages on Your Properties"
          >
            <span className="dock-card-icon">🏠</span>
            <span className="dock-card-title">MANAGE</span>
            <span className="dock-card-sub">PROPERTIES</span>
          </button>

          {/* Card 2: View Deeds (Illustrated Album Button from Video) */}
          <button
            className="dock-card-btn dock-card-deeds"
            onClick={() => setShowDeedsAlbum(true)}
            title="View Title Deeds Album"
          >
            <span className="dock-card-icon">📖🔍</span>
            <span className="dock-card-title">VIEW DEEDS</span>
            <span className="dock-card-sub">ALBUM</span>
          </button>

          {/* Card 3: Trading */}
          <button
            className="dock-card-btn"
            onClick={() => setShowTradeModal(true)}
            disabled={gameState.players.filter((p) => !p.isBankrupt).length <= 1}
            title="Propose Trade Deal"
          >
            <span className="dock-card-icon">🤝</span>
            <span className="dock-card-title">TRADING</span>
            <span className="dock-card-sub">PROPOSAL</span>
          </button>

          {/* Card 4: Roll Dice / End Turn */}
          {gameState.phase === 'waiting_for_roll' && (
            <button
              className="dock-card-btn dock-card-roll"
              onClick={handleRollDice}
              disabled={isRolling || isWalking}
            >
              <span className="dock-card-icon">🎲</span>
              <span className="dock-card-title">ROLL</span>
              <span className="dock-card-sub">DICE</span>
            </button>
          )}

          {gameState.phase === 'action_phase' && !isWalking && (
            <button
              className="dock-card-btn dock-card-endturn"
              onClick={handleEndTurn}
            >
              <span className="dock-card-icon">✓</span>
              <span className="dock-card-title">END TURN</span>
              <span className="dock-card-sub">NEXT</span>
            </button>
          )}
        </div>

        {/* Right: Turn Status Text from Video */}
        <div className="bottom-right-status">
          <div className="turn-status-text">
            Turn {gameState.round}
          </div>
          <div className="turn-player-text">
            {activePlayer.name}'s turn
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}
      {showDeedsAlbum && (
        <DeedsModal
          state={gameState}
          onClose={() => setShowDeedsAlbum(false)}
          onSelectProperty={(space) => setSelectedSpace(space)}
        />
      )}

      {showTradeModal && (
        <TradeModal
          state={gameState}
          onClose={() => setShowTradeModal(false)}
          onProposeTrade={handleProposeTrade}
          onAcceptTrade={handleAcceptTrade}
          onRejectTrade={handleRejectTrade}
        />
      )}

      {selectedSpace && (
        <PropertyModal
          space={selectedSpace}
          state={gameState}
          onClose={() => setSelectedSpace(null)}
          onBuildUpgrade={handleBuildUpgrade}
          onSellUpgrade={handleSellUpgrade}
          onMortgage={handleMortgage}
          onUnmortgage={handleUnmortgage}
        />
      )}

      {gameState.phase === 'debt_resolution' && (
        <DebtModal
          state={gameState}
          onResolveDebt={handleResolveDebt}
          onDeclareBankruptcy={handleDeclareBankruptcy}
          onSellUpgrade={handleSellUpgrade}
          onMortgage={handleMortgage}
        />
      )}

      {showNewGameModal && (
        <NewGameModal
          onStart={handleStartNewGame}
          onClose={() => setShowNewGameModal(false)}
          canCancel={true}
        />
      )}

      {gameState.phase === 'game_over' && (
        <GameOverModal
          state={gameState}
          onRematch={handleRematch}
          onNewGame={() => setShowNewGameModal(true)}
        />
      )}

      {showRulesModal && (
        <RulesModal onClose={() => setShowRulesModal(false)} />
      )}
    </div>
  );
};
export default App;
