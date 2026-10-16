import React, { useState, useEffect } from 'react';
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
import { SPACES_BY_ID } from '@business/game-content';
import { Board } from './components/Board.js';
import { PlayerPanel } from './components/PlayerPanel.js';
import { ActionLog } from './components/ActionLog.js';
import { PropertyModal } from './components/PropertyModal.js';
import { TradeModal } from './components/TradeModal.js';
import { DebtModal } from './components/DebtModal.js';
import { NewGameModal } from './components/NewGameModal.js';
import { GameOverModal } from './components/GameOverModal.js';
import { RulesModal } from './components/RulesModal.js';
import { saveGameState, loadSavedGameState, clearSavedGameState } from './storage.js';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadSavedGameState();
    if (saved) return saved;
    return createInitialGameState({
      mode: 'classic',
      players: [
        { name: 'Rahul', token: 'auto-rickshaw', color: '#3b82f6' },
        { name: 'Priya', token: 'chai-cup', color: '#ef4444' },
        { name: 'Amit', token: 'peacock', color: '#10b981' },
      ],
    });
  });

  const [selectedSpace, setSelectedSpace] = useState<BoardSpace | null>(null);
  const [tradingWithPlayerId, setTradingWithPlayerId] = useState<string | null>(null);
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Auto-save game state
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Handle dice rolling with short animation
  const handleRollDice = () => {
    if (gameState.phase !== 'waiting_for_roll' || isRolling) return;
    setIsRolling(true);

    setTimeout(() => {
      const res = applyGameAction(gameState, { type: 'ROLL_DICE' });
      if (res.state) {
        setGameState(res.state);
      }
      setIsRolling(false);
    }, 450);
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

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">💼</div>
          <div>
            <h1 className="header-title">BUSINESS</h1>
            <div className="header-subtitle">
              Bharat Property & Strategy • {gameState.mode === 'quick' ? '⚡ Quick Business' : '🏆 Classic Mode'}
            </div>
          </div>
        </div>

        <div className="header-stats">
          <button
            className="btn-secondary"
            onClick={() => setShowRulesModal(true)}
            style={{ fontSize: '0.85rem' }}
          >
            📖 Rules
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowNewGameModal(true)}
            style={{ fontSize: '0.85rem' }}
          >
            + New Game
          </button>
        </div>
      </header>

      {/* Main Board & Players Layout */}
      <div className="game-layout">
        {/* Left Arena: 36-space board */}
        <Board
          state={gameState}
          onSelectSpace={(space) => setSelectedSpace(space)}
          onRollDice={handleRollDice}
          onEndTurn={handleEndTurn}
          onBuyProperty={handleBuyProperty}
          onDeclineProperty={handleDeclineProperty}
          isRolling={isRolling}
        />

        {/* Right Sidebar: Players, Assets, & Transaction Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <PlayerPanel
              state={gameState}
              onOpenTrade={(targetId) => setTradingWithPlayerId(targetId)}
              onSelectProperty={(spaceId) => {
                const space = SPACES_BY_ID.get(spaceId);
                if (space) setSelectedSpace(space);
              }}
            />
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <ActionLog logs={gameState.actionLog} />
          </div>
        </div>
      </div>

      {/* Property Details Modal */}
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

      {/* Trade Modal */}
      {tradingWithPlayerId && (
        <TradeModal
          state={gameState}
          targetPlayerId={tradingWithPlayerId}
          onClose={() => setTradingWithPlayerId(null)}
          onProposeTrade={handleProposeTrade}
          onAcceptTrade={handleAcceptTrade}
          onRejectTrade={handleRejectTrade}
        />
      )}

      {/* Debt Resolution Modal */}
      {gameState.phase === 'debt_resolution' && (
        <DebtModal
          state={gameState}
          onResolveDebt={handleResolveDebt}
          onDeclareBankruptcy={handleDeclareBankruptcy}
          onSellUpgrade={handleSellUpgrade}
          onMortgage={handleMortgage}
        />
      )}

      {/* New Game Setup Modal */}
      {showNewGameModal && (
        <NewGameModal
          onStart={handleStartNewGame}
          onClose={() => setShowNewGameModal(false)}
          canCancel={true}
        />
      )}

      {/* Game Over Summary Modal */}
      {gameState.phase === 'game_over' && (
        <GameOverModal
          state={gameState}
          onRematch={handleRematch}
          onNewGame={() => setShowNewGameModal(true)}
        />
      )}

      {/* How to Play Rules Modal */}
      {showRulesModal && (
        <RulesModal onClose={() => setShowRulesModal(false)} />
      )}
    </div>
  );
};
export default App;
