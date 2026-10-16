import React, { useState } from 'react';
import { GameState, Player, BoardSpace } from '@business/shared-types';
import { SPACES_BY_ID } from '@business/game-content';

interface TradeModalProps {
  state: GameState;
  targetPlayerId: string;
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
  targetPlayerId,
  onClose,
  onProposeTrade,
  onAcceptTrade,
  onRejectTrade,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const targetPlayer = state.players.find((p) => p.id === targetPlayerId)!;

  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [offeredPropertyIds, setOfferedPropertyIds] = useState<string[]>([]);
  const [requestedPropertyIds, setRequestedPropertyIds] = useState<string[]>([]);

  // Filter properties owned with 0 upgrades
  const myTradeableProperties = Object.values(state.properties)
    .filter((p) => p.ownerId === activePlayer.id && p.upgradeLevel === 0)
    .map((p) => SPACES_BY_ID.get(p.spaceId)!)
    .filter(Boolean);

  const targetTradeableProperties = Object.values(state.properties)
    .filter((p) => p.ownerId === targetPlayer.id && p.upgradeLevel === 0)
    .map((p) => SPACES_BY_ID.get(p.spaceId)!)
    .filter(Boolean);

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
    onProposeTrade({
      toPlayerId: targetPlayer.id,
      offeredCash,
      offeredPropertyIds,
      requestedCash,
      requestedPropertyIds,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🤝 Propose Trade Deal
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
          Negotiating business trade between <strong style={{ color: activePlayer.color }}>{activePlayer.name}</strong> and <strong style={{ color: targetPlayer.color }}>{targetPlayer.name}</strong>. Only properties with zero active upgrades can be traded.
        </p>

        {/* Existing Active Trade Review if pending */}
        {state.activeTrade && state.activeTrade.status === 'pending' && onAcceptTrade && onRejectTrade && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '14px' }}>
            <h4 style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '8px' }}>Pending Trade Offer on the Table:</h4>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="btn-primary" onClick={() => onAcceptTrade(state.activeTrade!.id)}>
                ✓ Accept Trade
              </button>
              <button className="btn-danger" onClick={() => onRejectTrade(state.activeTrade!.id)}>
                ✕ Decline Trade
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* You Offer */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: activePlayer.color, marginBottom: '8px' }}>
              You Offer ({activePlayer.name})
            </h4>

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash Offer (₹):</label>
            <input
              type="number"
              min="0"
              max={activePlayer.cash}
              value={offeredCash}
              onChange={(e) => setOfferedCash(Math.max(0, Math.min(activePlayer.cash, Number(e.target.value))))}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#f8fafc', marginBottom: '10px' }}
            />

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>Properties:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
              {myTradeableProperties.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={offeredPropertyIds.includes(s.id)}
                    onChange={() => toggleOffered(s.id)}
                  />
                  <span>{s.name} (₹{s.price})</span>
                </label>
              ))}
              {myTradeableProperties.length === 0 && (
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>No tradeable properties.</span>
              )}
            </div>
          </div>

          {/* You Request */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: targetPlayer.color, marginBottom: '8px' }}>
              You Request ({targetPlayer.name})
            </h4>

            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash Request (₹):</label>
            <input
              type="number"
              min="0"
              max={targetPlayer.cash}
              value={requestedCash}
              onChange={(e) => setRequestedCash(Math.max(0, Math.min(targetPlayer.cash, Number(e.target.value))))}
              style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#f8fafc', marginBottom: '10px' }}
            />

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>Properties:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
              {targetTradeableProperties.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requestedPropertyIds.includes(s.id)}
                    onChange={() => toggleRequested(s.id)}
                  />
                  <span>{s.name} (₹{s.price})</span>
                </label>
              ))}
              {targetTradeableProperties.length === 0 && (
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>No tradeable properties.</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={offeredCash === 0 && requestedCash === 0 && offeredPropertyIds.length === 0 && requestedPropertyIds.length === 0}
          >
            Send Trade Offer
          </button>
        </div>
      </div>
    </div>
  );
};
