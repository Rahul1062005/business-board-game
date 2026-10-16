import React from 'react';
import { GameState, BoardSpace } from '@business/shared-types';
import { BOARD_SPACES } from '@business/game-content';
import { Dice3D } from './Dice3D.js';

interface BoardProps {
  state: GameState;
  displayPositions: Record<string, number>; // Animated display position of each player
  hoppingPlayerId: string | null;
  onSelectSpace: (space: BoardSpace) => void;
  onRollDice: () => void;
  onEndTurn: () => void;
  onBuyProperty: () => void;
  onDeclineProperty: () => void;
  isRolling: boolean;
  isWalking: boolean;
}

export function getTileGridPosition40(index: number): {
  gridColumn: number;
  gridRow: number;
  orientation: 'bottom' | 'left' | 'top' | 'right' | 'corner';
} {
  // 40 spaces in an 11x11 grid:
  // 0: Bottom-Right Corner (GO)
  if (index === 0) return { gridColumn: 11, gridRow: 11, orientation: 'corner' };

  // 1 to 9: Bottom Row (Right to Left)
  if (index >= 1 && index <= 9) {
    return { gridColumn: 11 - index, gridRow: 11, orientation: 'bottom' };
  }

  // 10: Bottom-Left Corner (JAIL)
  if (index === 10) return { gridColumn: 1, gridRow: 11, orientation: 'corner' };

  // 11 to 19: Left Column (Bottom to Top)
  if (index >= 11 && index <= 19) {
    return { gridColumn: 1, gridRow: 11 - (index - 10), orientation: 'left' };
  }

  // 20: Top-Left Corner (FREE PARKING)
  if (index === 20) return { gridColumn: 1, gridRow: 1, orientation: 'corner' };

  // 21 to 29: Top Row (Left to Right)
  if (index >= 21 && index <= 29) {
    return { gridColumn: 1 + (index - 20), gridRow: 1, orientation: 'top' };
  }

  // 30: Top-Right Corner (GO TO JAIL)
  if (index === 30) return { gridColumn: 11, gridRow: 1, orientation: 'corner' };

  // 31 to 39: Right Column (Top to Bottom)
  if (index >= 31 && index <= 39) {
    return { gridColumn: 11, gridRow: 1 + (index - 30), orientation: 'right' };
  }

  return { gridColumn: 1, gridRow: 1, orientation: 'corner' };
}

export const Board: React.FC<BoardProps> = ({
  state,
  displayPositions,
  hoppingPlayerId,
  onSelectSpace,
  onRollDice,
  onEndTurn,
  onBuyProperty,
  onDeclineProperty,
  isRolling,
  isWalking,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const activeSpace = BOARD_SPACES[activePlayer.position];

  return (
    <div className="classic-board-container">
      <div className="classic-board-wrapper">
        {/* Render all 40 tiles */}
        {BOARD_SPACES.map((space) => {
          const { gridColumn, gridRow, orientation } = getTileGridPosition40(space.index);
          const isCorner = space.index % 10 === 0;
          const propState = state.properties[space.id];
          const owner = propState?.ownerId
            ? state.players.find((p) => p.id === propState.ownerId)
            : null;

          // Find players currently on this space (using animated displayPositions)
          const playersHere = state.players.filter(
            (p) => !p.isBankrupt && (displayPositions[p.id] ?? p.position) === space.index
          );

          return (
            <div
              key={space.id}
              className={`classic-tile tile-${orientation} ${isCorner ? `tile-corner corner-${space.index}` : ''}`}
              style={{
                gridColumn,
                gridRow,
              }}
              onClick={() => onSelectSpace(space)}
              title={`${space.name} ${space.price ? `— ₹${space.price}` : ''}`}
            >
              {/* Corner Custom Graphics */}
              {space.index === 0 && (
                <div className="corner-content corner-go">
                  <div className="go-salary">COLLECT ₹200 SALARY AS YOU PASS</div>
                  <div className="go-title">GO</div>
                  <div className="go-arrow">⮜</div>
                </div>
              )}

              {space.index === 10 && (
                <div className="corner-content corner-jail">
                  <div className="jail-strip-top">JUST</div>
                  <div className="jail-cell">
                    <span className="jail-bars">⛓️</span>
                    <span className="jail-text">IN JAIL</span>
                  </div>
                  <div className="jail-strip-right">VISITING</div>
                </div>
              )}

              {space.index === 20 && (
                <div className="corner-content corner-parking">
                  <div className="parking-top">FREE</div>
                  <div className="parking-car">🚗</div>
                  <div className="parking-bottom">PARKING</div>
                </div>
              )}

              {space.index === 30 && (
                <div className="corner-content corner-gotojail">
                  <div className="gotojail-title">GO TO</div>
                  <div className="gotojail-cop">👮‍♂️👉</div>
                  <div className="gotojail-title">JAIL</div>
                </div>
              )}

              {/* Regular Edge Spaces */}
              {!isCorner && (
                <>
                  {/* Colored Property Bar (Matches standard placement based on orientation) */}
                  {space.categoryColor && (
                    <div
                      className={`tile-color-bar bar-${orientation}`}
                      style={{ backgroundColor: space.categoryColor }}
                    />
                  )}

                  <div className="tile-content">
                    {/* Icon for non-property spaces (Railroads, Utilities, Cards, Taxes) */}
                    {space.icon && !space.categoryColor && (
                      <div className="tile-icon">{space.icon}</div>
                    )}

                    <div className="tile-name">{space.name}</div>

                    {space.category && (
                      <div className="tile-category-tag">
                        {space.category.replace('_', ' ').toUpperCase()}
                      </div>
                    )}

                    {space.price != null && (
                      <div className="tile-price">₹{space.price}</div>
                    )}

                    {space.taxAmount != null && (
                      <div className="tile-price">PAY ₹{space.taxAmount}</div>
                    )}

                    {/* Ownership Flag */}
                    {owner && (
                      <div
                        className="tile-owner-indicator"
                        style={{ backgroundColor: owner.color }}
                        title={`Owned by ${owner.name}`}
                      />
                    )}

                    {/* Upgrades Stars or Flagship Crown */}
                    {propState && propState.upgradeLevel > 0 && (
                      <div className="tile-upgrade-icons">
                        {propState.upgradeLevel === 5 ? (
                          <span className="flagship-crown" title="Flagship Business">👑</span>
                        ) : (
                          Array.from({ length: propState.upgradeLevel }).map((_, i) => (
                            <span key={i} className="upgrade-house">🏠</span>
                          ))
                        )}
                      </div>
                    )}

                    {/* Mortgaged Overlay */}
                    {propState?.isMortgaged && (
                      <div className="mortgaged-banner">MORTGAGED</div>
                    )}
                  </div>
                </>
              )}

              {/* Player Pawns / Avatars on this tile */}
              {playersHere.length > 0 && (
                <div className="tile-pawns-container">
                  {playersHere.map((p) => {
                    const isHopping = hoppingPlayerId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`board-pawn ${isHopping ? 'is-hopping' : ''} ${p.id === activePlayer.id ? 'is-active-player' : ''}`}
                        style={{
                          backgroundColor: p.color,
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Board Area: Classic Red Angled Banner & 3D Dice Tray */}
        <div className="classic-center-board">
          {/* Classic Angled Red Logo Box (Like the MONOPOLY box in reference image) */}
          <div className="classic-red-banner">
            <div className="banner-inner">
              <span className="banner-title">BUSINESS</span>
              <span className="banner-subtitle">INDIAN PROPERTY TRADING BOARD GAME</span>
            </div>
          </div>

          {/* Diagonal Card Slots */}
          <div className="card-slot community-chest-slot">
            <div className="slot-title">COMMUNITY CHEST</div>
            <div className="slot-subtitle">FOLLOW INSTRUCTIONS ON TOP CARD</div>
            <div className="slot-icon">📦</div>
          </div>

          <div className="card-slot chance-slot">
            <div className="slot-title">CHANCE</div>
            <div className="slot-subtitle">FOLLOW INSTRUCTIONS ON TOP CARD</div>
            <div className="slot-icon">❓</div>
          </div>

          {/* 3D Dice Area in Center */}
          <div className="center-dice-stage">
            <Dice3D
              dice={state.lastDiceRoll}
              isRolling={isRolling}
            />

            {/* Turn Status & Controls */}
            <div className="turn-action-bar">
              <div
                className="active-player-pill"
                style={{ borderColor: activePlayer.color }}
              >
                <div
                  className="player-avatar-circle"
                  style={{ backgroundColor: activePlayer.color }}
                >
                  {activePlayer.token === 'auto-rickshaw' && '🛺'}
                  {activePlayer.token === 'chai-cup' && '☕'}
                  {activePlayer.token === 'peacock' && '🦚'}
                  {activePlayer.token === 'cricket-bat' && '🏏'}
                  {activePlayer.token === 'royal-elephant' && '🐘'}
                  {activePlayer.token === 'tiger' && '🐅'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                    {activePlayer.name}'s Turn
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 800 }}>
                    ₹{activePlayer.cash}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {state.phase === 'waiting_for_roll' && (
                <button
                  className="btn-classic-primary"
                  onClick={onRollDice}
                  disabled={isRolling || isWalking}
                >
                  🎲 Roll Dice
                </button>
              )}

              {isWalking && (
                <div className="walking-indicator">
                  🚶 Moving {activePlayer.name}...
                </div>
              )}

              {state.phase === 'buying_decision' && !isWalking && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn-classic-primary"
                    onClick={onBuyProperty}
                    disabled={activePlayer.cash < (activeSpace.price || 0)}
                  >
                    Buy {activeSpace.name} (₹{activeSpace.price})
                  </button>
                  <button className="btn-classic-secondary" onClick={onDeclineProperty}>
                    Pass
                  </button>
                </div>
              )}

              {state.phase === 'action_phase' && !isWalking && (
                <button
                  className="btn-classic-primary"
                  onClick={onEndTurn}
                  style={{ background: '#059669', borderColor: '#047857' }}
                >
                  ✓ End Turn
                </button>
              )}
            </div>

            {/* Event Card Banner if drawn */}
            {state.currentEventCard && !isWalking && (
              <div className="center-event-card-alert">
                <div className="card-alert-header">
                  ✨ {state.currentEventCard.title}
                </div>
                <div className="card-alert-desc">
                  {state.currentEventCard.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
