import React from 'react';
import { GameState, BoardSpace } from '@business/shared-types';
import {
  canBuildUpgrade,
  canSellUpgrade,
  canMortgage,
  canUnmortgage,
} from '@business/game-engine';

interface PropertyModalProps {
  space: BoardSpace;
  state: GameState;
  onClose: () => void;
  onBuildUpgrade: (spaceId: string) => void;
  onSellUpgrade: (spaceId: string) => void;
  onMortgage: (spaceId: string) => void;
  onUnmortgage: (spaceId: string) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  space,
  state,
  onClose,
  onBuildUpgrade,
  onSellUpgrade,
  onMortgage,
  onUnmortgage,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];
  const propState = state.properties[space.id];
  const owner = propState?.ownerId
    ? state.players.find((p) => p.id === propState.ownerId)
    : null;

  const isOwner = owner?.id === activePlayer.id;

  const upgradeCheck = isOwner ? canBuildUpgrade(state, activePlayer.id, space.id) : { ok: false };
  const sellCheck = isOwner ? canSellUpgrade(state, activePlayer.id, space.id) : { ok: false };
  const mortgageCheck = isOwner ? canMortgage(state, activePlayer.id, space.id) : { ok: false };
  const unmortgageCheck = isOwner ? canUnmortgage(state, activePlayer.id, space.id) : { ok: false };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        {/* Deed Title Banner */}
        <div
          style={{
            background: space.categoryColor || '#334155',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9 }}>
            TITLE DEED • {space.type.toUpperCase()}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '4px 0' }}>{space.name}</h2>
          {space.hindiName && (
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{space.hindiName}</div>
          )}
        </div>

        {/* Ownership Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Owner:</span>
          {owner ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: owner.color }} />
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>{owner.name}</span>
            </div>
          ) : (
            <span style={{ fontWeight: 700, color: '#10b981' }}>Available to Buy (₹{space.price})</span>
          )}
        </div>

        {/* Rent Schedule */}
        {space.rent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>Base Rent</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.base}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>With Full Color Set (Doubled)</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.base * 2}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>With 1 Upgrade ⭐</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.upgrade1}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>With 2 Upgrades ⭐⭐</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.upgrade2}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>With 3 Upgrades ⭐⭐⭐</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.upgrade3}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>With 4 Upgrades ⭐⭐⭐⭐</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.rent.upgrade4}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
              <span style={{ fontWeight: 800 }}>Flagship Business 👑</span>
              <span style={{ fontWeight: 800, color: '#fbbf24' }}>₹{space.rent.flagship}</span>
            </div>
          </div>
        )}

        {/* Transit / Utility Rents */}
        {space.type === 'transit' && space.transitRents && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1 Transit Line Owned</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.transitRents[0]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>2 Transit Lines Owned</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.transitRents[1]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>3 Transit Lines Owned</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.transitRents[2]}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>4 Transit Lines Owned</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>₹{space.transitRents[3]}</span>
            </div>
          </div>
        )}

        {space.type === 'utility' && (
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            Rent is <strong>4x dice roll</strong> if 1 utility is owned, or <strong>10x dice roll</strong> if both utilities are owned.
          </div>
        )}

        {/* Mortgage & Upgrade Cost Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
          {space.upgradeCost && (
            <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              Build Upgrade: <strong style={{ color: '#f8fafc' }}>₹{space.upgradeCost}</strong>
            </div>
          )}
          {space.mortgageValue && (
            <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              Mortgage Value: <strong style={{ color: '#f8fafc' }}>₹{space.mortgageValue}</strong>
            </div>
          )}
        </div>

        {/* Owner Action Buttons */}
        {isOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {space.type === 'property' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={() => onBuildUpgrade(space.id)}
                  disabled={!upgradeCheck.ok}
                  title={upgradeCheck.reason}
                  style={{ fontSize: '0.82rem' }}
                >
                  ⭐ Build (₹{space.upgradeCost})
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => onSellUpgrade(space.id)}
                  disabled={!sellCheck.ok}
                  title={sellCheck.reason}
                  style={{ fontSize: '0.82rem' }}
                >
                  Sell (+₹{Math.floor((space.upgradeCost || 0) * 0.5)})
                </button>
              </div>
            )}

            {!propState?.isMortgaged ? (
              <button
                className="btn-secondary"
                onClick={() => onMortgage(space.id)}
                disabled={!mortgageCheck.ok}
                title={mortgageCheck.reason}
                style={{ fontSize: '0.82rem' }}
              >
                🏦 Mortgage (+₹{space.mortgageValue})
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => onUnmortgage(space.id)}
                disabled={!unmortgageCheck.ok}
                title={unmortgageCheck.reason}
                style={{ fontSize: '0.82rem', background: '#3b82f6' }}
              >
                Unmortgage (-₹{unmortgageCheck.cost || 0})
              </button>
            )}
          </div>
        )}

        <button className="btn-secondary" onClick={onClose} style={{ alignSelf: 'center', marginTop: '4px' }}>
          Close
        </button>
      </div>
    </div>
  );
};
