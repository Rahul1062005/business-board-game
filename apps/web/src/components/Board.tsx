import React from 'react';
import { GameState, BoardSpace, Player } from '@business/shared-types';
import { BOARD_SPACES } from '@business/game-content';

interface BoardProps {
  state: GameState;
  onSelectSpace: (space: BoardSpace) => void;
  onRollDice: () => void;
  onEndTurn: () => void;
  onBuyProperty: () => void;
  onDeclineProperty: () => void;
  isRolling: boolean;
}

export function getTileGridPosition(index: number): { gridColumn: number; gridRow: number } {
  if (index === 0) return { gridColumn: 10, gridRow: 10 };
  if (index >= 1 && index <= 8) return { gridColumn: 10 - index, gridRow: 10 };
  if (index === 9) return { gridColumn: 1, gridRow: 10 };
  if (index >= 10 && index <= 17) return { gridColumn: 1, gridRow: 10 - (index - 9) };
  if (index === 18) return { gridColumn: 1, gridRow: 1 };
  if (index >= 19 && index <= 26) return { gridColumn: 1 + (index - 18), gridRow: 1 };
  if (index === 27) return { gridColumn: 10, gridRow: 1 };
  if (index >= 28 && index <= 35) return { gridColumn: 10, gridRow: 1 + (index - 27) };
  return { gridColumn: 1, gridRow: 1 };
}

export const Board: React.FC<BoardProps> = ({
  state,
  onSelectSpace,
  onRollDice,
  onEndTurn,
  onBuyProperty,
  onDeclineProperty,
  isRolling,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const activeSpace = BOARD_SPACES[activePlayer.position];
  const activePropState = state.properties[activeSpace.id];

  return (
    <div className="board-arena-container">
      <div className="board-wrapper">
        {/* Render the 36 Spaces */}
        {BOARD_SPACES.map((space) => {
          const { gridColumn, gridRow } = getTileGridPosition(space.index);
          const isCorner = space.index % 9 === 0;
          const propState = state.properties[space.id];
          const owner = propState?.ownerId
            ? state.players.find((p) => p.id === propState.ownerId)
            : null;

          // Find players currently on this space
          const playersHere = state.players.filter(
            (p) => !p.isBankrupt && p.position === space.index
          );

          return (
            <div
              key={space.id}
              className={`space-tile ${isCorner ? 'is-corner' : ''}`}
              style={{
                gridColumn,
                gridRow,
                borderTop: isCorner ? undefined : space.categoryColor ? `4px solid ${space.categoryColor}` : undefined,
              }}
              onClick={() => onSelectSpace(space)}
              title={`${space.name} ${space.price ? `— ₹${space.price}` : ''}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: isCorner ? '20px' : '14px', marginBottom: '2px' }}>
                  {space.icon || '📍'}
                </span>
                <span className="space-name">{space.name}</span>
                {space.hindiName && (
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8', textAlign: 'center' }}>
                    {space.hindiName.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Price / Type Info */}
              {space.price != null && (
                <div className="space-price">
                  ₹{space.price}
                </div>
              )}

              {/* Owner Indicator badge */}
              {owner && (
                <div
                  className="space-owner-tag"
                  style={{ backgroundColor: owner.color }}
                  title={`Owned by ${owner.name}`}
                />
              )}

              {/* Upgrades or Flagship Indicator */}
              {propState && propState.upgradeLevel > 0 && (
                <div className="space-upgrade-badges">
                  {propState.upgradeLevel === 5 ? (
                    <span style={{ fontSize: '10px' }} title="Flagship Business">👑</span>
                  ) : (
                    Array.from({ length: propState.upgradeLevel }).map((_, i) => (
                      <span key={i} className="upgrade-star">⭐</span>
                    ))
                  )}
                </div>
              )}

              {/* Mortgaged tag */}
              {propState?.isMortgaged && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'white' }}>
                  MORTGAGED
                </div>
              )}

              {/* Player Pawns / Tokens on this Space */}
              {playersHere.length > 0 && (
                <div className="player-tokens-container">
                  {playersHere.map((p) => (
                    <div
                      key={p.id}
                      className="player-token-pin"
                      style={{
                        backgroundColor: p.color,
                        border: p.id === activePlayer.id ? '2px solid #fbbf24' : '2px solid white',
                        transform: p.id === activePlayer.id ? 'scale(1.2)' : 'scale(1)',
                        zIndex: p.id === activePlayer.id ? 10 : 2,
                      }}
                      title={`${p.name} (${p.token})`}
                    >
                      {p.token === 'auto-rickshaw' && '🛺'}
                      {p.token === 'chai-cup' && '☕'}
                      {p.token === 'peacock' && '🦚'}
                      {p.token === 'cricket-bat' && '🏏'}
                      {p.token === 'royal-elephant' && '🐘'}
                      {p.token === 'tiger' && '🐅'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Center of the Board: Active Turn Hub & Controls */}
        <div className="board-center-hub">
          <div className="center-emblem">व्यापार</div>

          {/* Active Player Status Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 18px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: `2px solid ${activePlayer.color}`,
              boxShadow: `0 0 16px ${activePlayer.color}40`,
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: activePlayer.color,
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>
              {activePlayer.name}'s Turn
            </span>
            <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
              ₹{activePlayer.cash}
            </span>
          </div>

          {/* Dice Box */}
          <div className="dice-container">
            <div className={`dice-die ${isRolling ? 'rolling' : ''}`}>
              {state.lastDiceRoll ? state.lastDiceRoll[0] : '6'}
            </div>
            <div className={`dice-die ${isRolling ? 'rolling' : ''}`}>
              {state.lastDiceRoll ? state.lastDiceRoll[1] : '3'}
            </div>
          </div>

          {/* Event Card notification banner if just drawn */}
          {state.currentEventCard && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '10px 16px',
                maxWidth: '380px',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                ✨ {state.currentEventCard.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: '4px' }}>
                {state.currentEventCard.description}
              </div>
            </div>
          )}

          {/* Turn Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {state.phase === 'waiting_for_roll' && (
              <button
                className="btn-primary"
                onClick={onRollDice}
                disabled={isRolling}
                style={{ fontSize: '1rem', padding: '12px 28px' }}
              >
                🎲 Roll Dice
              </button>
            )}

            {state.phase === 'buying_decision' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={onBuyProperty}
                  disabled={activePlayer.cash < (activeSpace.price || 0)}
                >
                  Buy {activeSpace.name} (₹{activeSpace.price})
                </button>
                <button className="btn-secondary" onClick={onDeclineProperty}>
                  Pass / Skip
                </button>
              </div>
            )}

            {state.phase === 'action_phase' && (
              <button
                className="btn-primary"
                onClick={onEndTurn}
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)' }}
              >
                ✓ End Turn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
