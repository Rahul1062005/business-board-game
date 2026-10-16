import React, { useState } from 'react';
import { GameState, Player, BoardSpace } from '@business/shared-types';
import { SPACES_BY_ID, BOARD_SPACES } from '@business/game-content';

interface TradeModalProps {
  state: GameState;
  onClose: () => void;
  onProposeTrade: (payload: {
    toPlayerId: string;
    offeredCash: number;
    offeredPropertyIds: string[];
    requestedCash: number;
    requestedPropertyIds: string[];
  }) => void;
  onAcceptTrade?: (tradeId: string) => void;
  onRejectTrade?: (tradeId: string) => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  state,
  onClose,
  onProposeTrade,
  onAcceptTrade,
  onRejectTrade,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const eligiblePartners = state.players.filter((p) => p.id !== activePlayer.id && !p.isBankrupt);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    eligiblePartners[0]?.id || ''
  );

  const targetPlayer =
    state.players.find((p) => p.id === selectedPartnerId) || eligiblePartners[0];

  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [offeredPropertyIds, setOfferedPropertyIds] = useState<string[]>([]);
  const [requestedPropertyIds, setRequestedPropertyIds] = useState<string[]>([]);
  const [hoveredSpace, setHoveredSpace] = useState<BoardSpace | null>(null);

  // Properties owned with 0 upgrades (MVP rule: cannot trade upgraded properties)
  const myTradeable = Object.values(state.properties)
    .filter((p) => p.ownerId === activePlayer.id && p.upgradeLevel === 0)
    .map((p) => SPACES_BY_ID.get(p.spaceId)!)
    .filter(Boolean);

  const targetTradeable = targetPlayer
    ? Object.values(state.properties)
        .filter((p) => p.ownerId === targetPlayer.id && p.upgradeLevel === 0)
        .map((p) => SPACES_BY_ID.get(p.spaceId)!)
        .filter(Boolean)
    : [];

  const toggleOffered = (id: string) => {
    setOfferedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleRequested = (id: string) => {
    setRequestedPropertyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!targetPlayer) return;
    onProposeTrade({
      toPlayerId: targetPlayer.id,
      offeredCash,
      offeredPropertyIds,
      requestedCash,
      requestedPropertyIds,
    });
    onClose();
  };

  const displaySpace = hoveredSpace || myTradeable[0] || targetTradeable[0] || BOARD_SPACES[1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content roblox-trade-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="roblox-modal-header">
          <span className="roblox-modal-title">Trading Proposal</span>
          <button className="roblox-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Pending Trade Offer if receiver needs to respond */}
        {state.activeTrade && state.activeTrade.status === 'pending' && onAcceptTrade && onRejectTrade && (
          <div className="pending-trade-banner">
            <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.9rem' }}>
              Pending Trade Offer on the Table:
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn-classic-primary" style={{ background: '#16a34a', borderColor: '#15803d' }} onClick={() => onAcceptTrade(state.activeTrade!.id)}>
                ✓ Accept Trade
              </button>
              <button className="btn-classic-secondary" onClick={() => onRejectTrade(state.activeTrade!.id)}>
                ✕ Decline
              </button>
            </div>
          </div>
        )}

        {/* Partner Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>
            Select Player to Trade With:
          </span>
          <select
            value={selectedPartnerId}
            onChange={(e) => {
              setSelectedPartnerId(e.target.value);
              setRequestedPropertyIds([]);
              setRequestedCash(0);
            }}
            className="roblox-select"
          >
            {eligiblePartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.cash})
              </option>
            ))}
          </select>
        </div>

        {/* 3-Column Trading Layout matching Video (00:15) */}
        <div className="roblox-trading-grid">
          {/* Column 1: Card Preview on Hover */}
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
                      <div className="rent-row"><span>RENT</span><span>₹{displaySpace.rent.base}</span></div>
                      <div className="rent-row"><span>With 1 House</span><span>₹{displaySpace.rent.upgrade1}</span></div>
                      <div className="rent-row"><span>With 2 Houses</span><span>₹{displaySpace.rent.upgrade2}</span></div>
                      <div className="rent-row"><span>With 3 Houses</span><span>₹{displaySpace.rent.upgrade3}</span></div>
                      <div className="rent-row"><span>With 4 Houses</span><span>₹{displaySpace.rent.upgrade4}</span></div>
                      <div className="rent-row highlight-flagship"><span>With HOTEL 👑</span><span>₹{displaySpace.rent.flagship}</span></div>
                    </>
                  )}
                  <div className="deed-footer-stats">
                    {displaySpace.price && <div>List Price: ₹{displaySpace.price}</div>}
                    {displaySpace.mortgageValue && <div>Mortgage: ₹{displaySpace.mortgageValue}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Your Offer */}
          <div className="roblox-trade-box">
            <div className="trade-box-title">Your Offer ({activePlayer.name})</div>
            <div className="trade-sub-label">Properties to Trade:</div>
            <div className="trade-props-list">
              {myTradeable.map((space) => {
                const isSelected = offeredPropertyIds.includes(space.id);
                return (
                  <div
                    key={space.id}
                    className={`trade-prop-item ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => setHoveredSpace(space)}
                    onClick={() => toggleOffered(space.id)}
                  >
                    <div
                      className="prop-mini-color"
                      style={{ backgroundColor: space.categoryColor || '#334155' }}
                    />
                    <span>{space.name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 800 }}>₹{space.price}</span>
                  </div>
                );
              })}
              {myTradeable.length === 0 && (
                <div className="trade-empty-msg">No eligible properties without houses.</div>
              )}
            </div>

            <div className="trade-money-row">
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Money to Offer:</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#34d399' }}>₹</span>
                <input
                  type="number"
                  min="0"
                  max={activePlayer.cash}
                  value={offeredCash}
                  onChange={(e) =>
                    setOfferedCash(Math.max(0, Math.min(activePlayer.cash, Number(e.target.value))))
                  }
                  className="trade-money-input"
                />
                <button
                  type="button"
                  className="btn-max"
                  onClick={() => setOfferedCash(activePlayer.cash)}
                >
                  Max
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Partner's Offer */}
          {targetPlayer && (
            <div className="roblox-trade-box">
              <div className="trade-box-title">{targetPlayer.name}'s Offer</div>
              <div className="trade-sub-label">Properties to Trade:</div>
              <div className="trade-props-list">
                {targetTradeable.map((space) => {
                  const isSelected = requestedPropertyIds.includes(space.id);
                  return (
                    <div
                      key={space.id}
                      className={`trade-prop-item ${isSelected ? 'selected' : ''}`}
                      onMouseEnter={() => setHoveredSpace(space)}
                      onClick={() => toggleRequested(space.id)}
                    >
                      <div
                        className="prop-mini-color"
                        style={{ backgroundColor: space.categoryColor || '#334155' }}
                      />
                      <span>{space.name}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 800 }}>₹{space.price}</span>
                    </div>
                  );
                })}
                {targetTradeable.length === 0 && (
                  <div className="trade-empty-msg">No eligible properties without houses.</div>
                )}
              </div>

              <div className="trade-money-row">
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Money to Offer:</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={targetPlayer.cash}
                    value={requestedCash}
                    onChange={(e) =>
                      setRequestedCash(Math.max(0, Math.min(targetPlayer.cash, Number(e.target.value))))
                    }
                    className="trade-money-input"
                  />
                  <button
                    type="button"
                    className="btn-max"
                    onClick={() => setRequestedCash(targetPlayer.cash)}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Big Green Send Proposal Button (Video 00:23) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button
            className="btn-roblox-send-proposal"
            onClick={handleSubmit}
            disabled={
              offeredCash === 0 &&
              requestedCash === 0 &&
              offeredPropertyIds.length === 0 &&
              requestedPropertyIds.length === 0
            }
          >
            Send Proposal
          </button>
        </div>
      </div>
    </div>
  );
};
