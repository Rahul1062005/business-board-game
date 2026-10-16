import React from 'react';
import { GameState, PropertyState } from '@business/shared-types';
import { SPACES_BY_ID } from '@business/game-content';
import { canSellUpgrade, canMortgage } from '@business/game-engine';

interface DebtModalProps {
  state: GameState;
  onResolveDebt: () => void;
  onDeclareBankruptcy: () => void;
  onSellUpgrade: (spaceId: string) => void;
  onMortgage: (spaceId: string) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  state,
  onResolveDebt,
  onDeclareBankruptcy,
  onSellUpgrade,
  onMortgage,
}) => {
  const debt = state.pendingDebt;
  if (!debt) return null;

  const debtor = state.players.find((p) => p.id === debt.debtorId)!;
  const creditor =
    debt.creditorId === 'bank'
      ? { name: 'The Bank', color: '#f59e0b' }
      : state.players.find((p) => p.id === debt.creditorId)!;

  const deficit = Math.max(0, debt.amount - debtor.cash);
  const canSettle = debtor.cash >= debt.amount;

  // Find upgradable properties that debtor can sell upgrades from
  const upgradableProperties = Object.values(state.properties)
    .filter((p) => p.ownerId === debtor.id && p.upgradeLevel > 0)
    .map((p) => ({
      space: SPACES_BY_ID.get(p.spaceId)!,
      prop: p,
      check: canSellUpgrade(state, debtor.id, p.spaceId),
    }));

  // Find unmortgaged properties debtor can mortgage
  const mortgageableProperties = Object.values(state.properties)
    .filter((p) => p.ownerId === debtor.id && !p.isMortgaged)
    .map((p) => ({
      space: SPACES_BY_ID.get(p.spaceId)!,
      prop: p,
      check: canMortgage(state, debtor.id, p.spaceId),
    }));

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ef4444' }}>
              Debt Settlement Required
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {debt.reason}
            </p>
          </div>
        </div>

        {/* Debt Amount Box */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Amount Owed to <strong style={{ color: creditor.color }}>{creditor.name}</strong>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f87171', margin: '4px 0' }}>
            ₹{debt.amount}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Available Cash: <strong style={{ color: '#fbbf24' }}>₹{debtor.cash}</strong> | Deficit: <strong style={{ color: '#ef4444' }}>₹{deficit}</strong>
          </div>
        </div>

        {/* Liquidation Options: Upgrades to sell */}
        {upgradableProperties.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
              1. Sell Upgrades (50% Refund):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {upgradableProperties.map(({ space, prop, check }) => {
                const refund = Math.floor((space.upgradeCost || 0) * 0.5);
                return (
                  <div key={space.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem' }}>{space.name} (Tier {prop.upgradeLevel})</span>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      disabled={!check.ok}
                      onClick={() => onSellUpgrade(space.id)}
                    >
                      Sell (+₹{refund})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Liquidation Options: Properties to mortgage */}
        {mortgageableProperties.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
              2. Mortgage Properties (50% Value):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {mortgageableProperties.map(({ space, check }) => (
                <div key={space.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem' }}>{space.name}</span>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    disabled={!check.ok}
                    onClick={() => onMortgage(space.id)}
                    title={check.reason}
                  >
                    Mortgage (+₹{space.mortgageValue})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            className="btn-danger"
            onClick={onDeclareBankruptcy}
            style={{ fontSize: '0.85rem' }}
          >
            Declare Bankruptcy
          </button>
          <button
            className="btn-primary"
            onClick={onResolveDebt}
            disabled={!canSettle}
            style={{ background: canSettle ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined }}
          >
            ✓ Settle & Pay Debt (₹{debt.amount})
          </button>
        </div>
      </div>
    </div>
  );
};
