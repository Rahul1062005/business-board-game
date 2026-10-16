import React from 'react';
import { GameState, Player } from '@business/shared-types';
import { calculatePlayerNetWorth } from '@business/game-engine';
import { SPACES_BY_ID } from '@business/game-content';

interface PlayerPanelProps {
  state: GameState;
  onOpenTrade: (targetPlayerId: string) => void;
  onSelectProperty: (spaceId: string) => void;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  state,
  onOpenTrade,
  onSelectProperty,
}) => {
  const activePlayer = state.players[state.activePlayerIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Business Tycoons ({state.players.length})</span>
        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          {state.mode === 'quick' ? `Round ${state.round}/${state.settings.quickModeMaxRounds}` : `Round ${state.round}`}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {state.players.map((player) => {
          const isActive = player.id === activePlayer.id && !player.isBankrupt;
          const netWorth = calculatePlayerNetWorth(state, player.id);

          // Get owned properties
          const ownedSpaces = Object.values(state.properties)
            .filter((p) => p.ownerId === player.id)
            .map((p) => SPACES_BY_ID.get(p.spaceId)!)
            .filter(Boolean);

          return (
            <div
              key={player.id}
              className="glass-card"
              style={{
                padding: '12px 14px',
                borderLeft: `4px solid ${player.color}`,
                boxShadow: isActive ? `0 0 16px ${player.color}35` : undefined,
                opacity: player.isBankrupt ? 0.45 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {player.token === 'auto-rickshaw' && '🛺'}
                    {player.token === 'chai-cup' && '☕'}
                    {player.token === 'peacock' && '🦚'}
                    {player.token === 'cricket-bat' && '🏏'}
                    {player.token === 'royal-elephant' && '🐘'}
                    {player.token === 'tiger' && '🐅'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {player.name}
                      {isActive && (
                        <span style={{ fontSize: '0.65rem', background: '#3b82f6', color: 'white', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                          TURN
                        </span>
                      )}
                    </div>
                    {player.inDetention && (
                      <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>
                        In Detention ({player.detentionTurns}/3)
                      </span>
                    )}
                    {player.isBankrupt && (
                      <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700 }}>
                        BANKRUPT
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem' }}>
                    ₹{player.cash}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Net: ₹{netWorth.totalNetWorth}
                  </div>
                </div>
              </div>

              {/* Owned Properties Badges */}
              {ownedSpaces.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {ownedSpaces.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectProperty(s.id)}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: s.categoryColor || '#334155',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        border: 'none',
                      }}
                      title={`${s.name} (Click to manage)`}
                    >
                      {s.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Trade button if active player wants to trade with this player */}
              {!player.isBankrupt && player.id !== activePlayer.id && state.phase === 'action_phase' && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => onOpenTrade(player.id)}
                  >
                    🤝 Propose Trade
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
