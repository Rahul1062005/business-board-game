import React from 'react';
import { GameState, BoardSpace } from '@business/shared-types';
import { BOARD_SPACES } from '@business/game-content';
import { Dice3D } from './Dice3D.js';

interface BoardProps {
  state: GameState;
  displayPositions: Record<string, number>;
  hoppingPlayerId: string | null;
  boardTilt: number; // In degrees, e.g. 18deg
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
  if (index === 0) return { gridColumn: 11, gridRow: 11, orientation: 'corner' };

  if (index >= 1 && index <= 9) {
    return { gridColumn: 11 - index, gridRow: 11, orientation: 'bottom' };
  }

  if (index === 10) return { gridColumn: 1, gridRow: 11, orientation: 'corner' };

  if (index >= 11 && index <= 19) {
    return { gridColumn: 1, gridRow: 11 - (index - 10), orientation: 'left' };
  }

  if (index === 20) return { gridColumn: 1, gridRow: 1, orientation: 'corner' };

  if (index >= 21 && index <= 29) {
    return { gridColumn: 1 + (index - 20), gridRow: 1, orientation: 'top' };
  }

  if (index === 30) return { gridColumn: 11, gridRow: 1, orientation: 'corner' };

  if (index >= 31 && index <= 39) {
    return { gridColumn: 11, gridRow: 1 + (index - 30), orientation: 'right' };
  }

  return { gridColumn: 1, gridRow: 1, orientation: 'corner' };
}

export const Board: React.FC<BoardProps> = ({
  state,
  displayPositions,
  hoppingPlayerId,
  boardTilt,
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
    <div className="tabletop-perspective-stage">
      <div
        className="classic-board-wrapper"
        style={{
          transform: `rotateX(${boardTilt}deg) rotateZ(0deg)`,
        }}
      >
        {/* Render all 40 tiles */}
        {BOARD_SPACES.map((space) => {
          const { gridColumn, gridRow, orientation } = getTileGridPosition40(space.index);
          const isCorner = space.index % 10 === 0;
          const propState = state.properties[space.id];
          const owner = propState?.ownerId
            ? state.players.find((p) => p.id === propState.ownerId)
            : null;

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
                  <div className="go-salary">COLLECT ₹200 AS YOU PASS</div>
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
                  {space.categoryColor && (
                    <div
                      className={`tile-color-bar bar-${orientation}`}
                      style={{ backgroundColor: space.categoryColor }}
                    />
                  )}

                  <div className="tile-content">
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

                    {/* Owner Tag */}
                    {owner && (
                      <div
                        className="tile-owner-indicator"
                        style={{ backgroundColor: owner.color }}
                        title={`Owned by ${owner.name}`}
                      />
                    )}

                    {/* Upgrades */}
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

                    {propState?.isMortgaged && (
                      <div className="mortgaged-banner">MORTGAGED</div>
                    )}
                  </div>
                </>
              )}

              {/* Player Pawns */}
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

        {/* Center Board: Physical 3D Card Decks & 3D Dice */}
        <div className="classic-center-board">
          {/* Angled Red MONOPOLY Box Banner */}
          <div className="classic-red-banner">
            <div className="banner-inner">
              <span className="banner-title">BUSINESS</span>
              <span className="banner-subtitle">INDIAN PROPERTY TRADING BOARD GAME</span>
            </div>
          </div>

          {/* Physical 3D Raised Blue Community Chest Card Deck (Matches Image 3) */}
          <div className="physical-deck-3d deck-community-chest" title="Community Chest Deck">
            <div className="deck-card-top">
              <div className="deck-card-border">
                <span className="deck-card-icon">📦</span>
                <span className="deck-card-title">COMMUNITY CHEST</span>
              </div>
            </div>
            <div className="deck-side-stack"></div>
          </div>

          {/* Physical 3D Raised Gold Chance Card Deck (Matches Image 3) */}
          <div className="physical-deck-3d deck-chance" title="Chance Deck">
            <div className="deck-card-top">
              <div className="deck-card-border">
                <span className="deck-card-icon">❓</span>
                <span className="deck-card-title">CHANCE</span>
              </div>
            </div>
            <div className="deck-side-stack"></div>
          </div>

          {/* 3D Dice in Center Stage */}
          <div className="center-dice-stage">
            <Dice3D
              dice={state.lastDiceRoll}
              isRolling={isRolling}
            />

            {/* In-Game Action Bar if decision pending */}
            {state.phase === 'buying_decision' && !isWalking && (
              <div className="center-action-prompt">
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  Landed on {activeSpace.name} (₹{activeSpace.price})
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    className="btn-classic-primary"
                    onClick={onBuyProperty}
                    disabled={activePlayer.cash < (activeSpace.price || 0)}
                  >
                    Buy Property
                  </button>
                  <button className="btn-classic-secondary" onClick={onDeclineProperty}>
                    Pass
                  </button>
                </div>
              </div>
            )}

            {/* Event Card Drawn Notification */}
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
