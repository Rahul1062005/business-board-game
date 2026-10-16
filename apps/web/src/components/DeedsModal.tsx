import React, { useState } from 'react';
import { GameState, BoardSpace, Player } from '@business/shared-types';
import { BOARD_SPACES, SPACES_BY_ID } from '@business/game-content';

interface DeedsModalProps {
  state: GameState;
  onClose: () => void;
  onSelectProperty?: (space: BoardSpace) => void;
}

export const DeedsModal: React.FC<DeedsModalProps> = ({
  state,
  onClose,
  onSelectProperty,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(activePlayer.id);
  const [hoveredSpace, setHoveredSpace] = useState<BoardSpace | null>(null);

  const targetPlayer = state.players.find((p) => p.id === selectedPlayerId) || activePlayer;

  // Owned properties of currently selected player
  const ownedSpaces = Object.values(state.properties)
    .filter((p) => p.ownerId === targetPlayer.id)
    .map((p) => SPACES_BY_ID.get(p.spaceId)!)
    .filter(Boolean);

  const displaySpace = hoveredSpace || ownedSpaces[0] || BOARD_SPACES[1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content roblox-deeds-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="roblox-modal-header">
          <span className="roblox-modal-title">My Deeds — {targetPlayer.name}</span>
          <button className="roblox-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 3-Column Layout Matching User Video (00:47) */}
        <div className="roblox-deeds-layout">
          {/* Left Column: Card Preview on Hover */}
          <div className="roblox-card-preview-col">
            <div className="roblox-col-label">Card Preview</div>
            <div className="preview-instruction">Hover over a card to preview it!</div>

            {displaySpace && (
              <div className="classic-title-deed-card">
                <div
                  className="deed-header-bar"
                  style={{ backgroundColor: displaySpace.categoryColor || '#334155' }}
                >
                  <div className="deed-header-sub">TITLE DEED</div>
                  <div className="deed-header-name">{displaySpace.name}</div>
                  {displaySpace.category && (
                    <div className="deed-header-cat">
                      {displaySpace.category.replace('_', ' ').toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="deed-rent-table">
                  {displaySpace.rent && (
                    <>
                      <div className="rent-row">
                        <span>RENT</span>
                        <span>₹{displaySpace.rent.base}</span>
                      </div>
                      <div className="rent-row">
                        <span>With 1 House</span>
                        <span>₹{displaySpace.rent.upgrade1}</span>
                      </div>
                      <div className="rent-row">
                        <span>With 2 Houses</span>
                        <span>₹{displaySpace.rent.upgrade2}</span>
                      </div>
                      <div className="rent-row">
                        <span>With 3 Houses</span>
                        <span>₹{displaySpace.rent.upgrade3}</span>
                      </div>
                      <div className="rent-row">
                        <span>With 4 Houses</span>
                        <span>₹{displaySpace.rent.upgrade4}</span>
                      </div>
                      <div className="rent-row highlight-flagship">
                        <span>With HOTEL 👑</span>
                        <span>₹{displaySpace.rent.flagship}</span>
                      </div>
                    </>
                  )}

                  {displaySpace.transitRents && (
                    <div style={{ fontSize: '0.72rem', color: '#1e293b' }}>
                      Rent: ₹25 / ₹50 / ₹100 / ₹200 based on stations owned.
                    </div>
                  )}

                  {displaySpace.type === 'utility' && (
                    <div style={{ fontSize: '0.72rem', color: '#1e293b' }}>
                      Rent: 4x or 10x dice roll.
                    </div>
                  )}

                  <div className="deed-footer-stats">
                    {displaySpace.upgradeCost && (
                      <div>Houses cost: ₹{displaySpace.upgradeCost} each</div>
                    )}
                    {displaySpace.mortgageValue && (
                      <div>Mortgage value: ₹{displaySpace.mortgageValue}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column: Owned Properties List */}
          <div className="roblox-owned-props-col">
            <div className="roblox-col-label">Owned Properties ({ownedSpaces.length})</div>
            <div className="owned-props-grid">
              {ownedSpaces.map((space) => {
                const propState = state.properties[space.id];
                return (
                  <div
                    key={space.id}
                    className="owned-prop-thumb"
                    onMouseEnter={() => setHoveredSpace(space)}
                    onClick={() => onSelectProperty?.(space)}
                  >
                    <div
                      className="thumb-color-bar"
                      style={{ backgroundColor: space.categoryColor || '#334155' }}
                    >
                      <span className="thumb-name">{space.name}</span>
                    </div>
                    <div className="thumb-details">
                      <span>₹{space.price}</span>
                      {propState?.upgradeLevel ? (
                        <span style={{ color: '#d97706' }}>
                          {propState.upgradeLevel === 5 ? '👑 Hotel' : `⭐ Tier ${propState.upgradeLevel}`}
                        </span>
                      ) : null}
                      {propState?.isMortgaged && (
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>MORTGAGED</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {ownedSpaces.length === 0 && (
                <div className="no-props-message">
                  {targetPlayer.name} does not own any properties yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Select Player */}
          <div className="roblox-select-player-col">
            <div className="roblox-col-label">Select Player</div>
            <div className="select-player-list">
              {state.players.map((p) => {
                const isSelected = p.id === selectedPlayerId;
                const propCount = Object.values(state.properties).filter(
                  (prop) => prop.ownerId === p.id
                ).length;

                return (
                  <div
                    key={p.id}
                    className={`player-select-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPlayerId(p.id);
                      setHoveredSpace(null);
                    }}
                  >
                    <div
                      className="player-select-dot"
                      style={{ backgroundColor: p.color }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="player-select-name">{p.name}</div>
                      <div className="player-select-count">{propCount} deeds • ₹{p.cash}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
