import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState } from '@business/shared-types';
import { rankPlayers } from '@business/game-engine';

interface GameOverModalProps {
  state: GameState;
  onRematch: () => void;
  onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onRematch,
  onNewGame,
}) => {
  const ranked = rankPlayers(state);
  const winner = ranked[0];

  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignore if confetti fails
    }
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24' }}>
          Game Over!
        </h1>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
          👑 <span style={{ color: winner?.player.color }}>{winner?.player.name}</span> is the Champion Tycoon!
        </p>

        <div style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '8px 0 16px' }}>
          Final Leaderboard & Net Worth Breakdown (Cash + Unmortgaged + 50% Mortgaged + 50% Upgrades)
        </div>

        {/* Leaderboard Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ranked.map(({ player, netWorth, rank }) => (
            <div
              key={player.id}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderLeft: `4px solid ${player.color}`,
                background: rank === 1 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: rank === 1 ? '#fbbf24' : '#94a3b8' }}>
                  #{rank}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#f8fafc' }}>
                    {player.name} {player.isBankrupt && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>(Bankrupt)</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Cash: ₹{netWorth.cash} | Property: ₹{netWorth.unmortgagedPropertiesValue + netWorth.mortgagedPropertiesValue} | Upgrades: ₹{netWorth.upgradesValue}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24' }}>
                  ₹{netWorth.totalNetWorth}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Net Worth</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
          <button className="btn-primary" onClick={onRematch} style={{ padding: '12px 24px' }}>
            🔄 Rematch Same Players
          </button>
          <button className="btn-secondary" onClick={onNewGame}>
            ⚙️ Setup New Game
          </button>
        </div>
      </div>
    </div>
  );
};
