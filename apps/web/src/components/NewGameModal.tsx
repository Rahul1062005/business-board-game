import React, { useState } from 'react';
import { GameMode, PlayerToken } from '@business/shared-types';

interface NewGameModalProps {
  onStart: (params: {
    mode: GameMode;
    players: Array<{ name: string; token: PlayerToken; color: string }>;
    maxRounds?: number;
  }) => void;
  onClose?: () => void;
  canCancel?: boolean;
}

const AVAILABLE_TOKENS: Array<{ id: PlayerToken; label: string; icon: string }> = [
  { id: 'auto-rickshaw', label: 'Auto Rickshaw', icon: '🛺' },
  { id: 'chai-cup', label: 'Chai Cup', icon: '☕' },
  { id: 'peacock', label: 'Peacock', icon: '🦚' },
  { id: 'cricket-bat', label: 'Cricket Bat', icon: '🏏' },
  { id: 'royal-elephant', label: 'Royal Elephant', icon: '🐘' },
  { id: 'tiger', label: 'Bengal Tiger', icon: '🐅' },
];

const PRESET_COLORS = [
  '#3b82f6', // Sapphire Blue
  '#ef4444', // Crimson Red
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Gold
  '#8b5cf6', // Royal Purple
  '#ec4899', // Bright Pink
];

export const NewGameModal: React.FC<NewGameModalProps> = ({
  onStart,
  onClose,
  canCancel = false,
}) => {
  const [mode, setMode] = useState<GameMode>('classic');
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [maxRounds, setMaxRounds] = useState<number>(25);

  const [players, setPlayers] = useState<Array<{ name: string; token: PlayerToken; color: string }>>([
    { name: 'Rahul', token: 'auto-rickshaw', color: PRESET_COLORS[0] },
    { name: 'Priya', token: 'chai-cup', color: PRESET_COLORS[1] },
    { name: 'Amit', token: 'peacock', color: PRESET_COLORS[2] },
    { name: 'Neha', token: 'cricket-bat', color: PRESET_COLORS[3] },
    { name: 'Vikram', token: 'royal-elephant', color: PRESET_COLORS[4] },
    { name: 'Ananya', token: 'tiger', color: PRESET_COLORS[5] },
  ]);

  const updatePlayer = (index: number, field: string, value: any) => {
    setPlayers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleStart = () => {
    const activeList = players.slice(0, playerCount);
    onStart({
      mode,
      players: activeList,
      maxRounds: mode === 'quick' ? maxRounds : undefined,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            💼
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>New Match Setup</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Indian Property Trading Strategy Board Game</p>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
            Game Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div
              onClick={() => setMode('classic')}
              className="glass-card"
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderColor: mode === 'classic' ? '#f59e0b' : undefined,
                background: mode === 'classic' ? 'rgba(245, 158, 11, 0.1)' : undefined,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>🏆 Classic</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Play until one tycoon remains standing. Eliminates bankrupt players.
              </div>
            </div>

            <div
              onClick={() => setMode('quick')}
              className="glass-card"
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderColor: mode === 'quick' ? '#f59e0b' : undefined,
                background: mode === 'quick' ? 'rgba(245, 158, 11, 0.1)' : undefined,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>⚡ Quick Business</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Fixed round limit (e.g. 25 rounds). Highest Net Worth wins!
              </div>
            </div>
          </div>
        </div>

        {/* Player Count & Rounds */}
        <div style={{ display: 'grid', gridTemplateColumns: mode === 'quick' ? '1fr 1fr' : '1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
              Players (2 to 6)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPlayerCount(num)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: '8px',
                    fontWeight: 700,
                    background: playerCount === num ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255, 255, 255, 0.05)',
                    color: playerCount === num ? '#0b0f19' : '#e2e8f0',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {mode === 'quick' && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                Round Limit: {maxRounds}
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          )}
        </div>

        {/* Players Configuration List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
            Player Names & Tokens
          </label>
          {Array.from({ length: playerCount }).map((_, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={players[idx].token}
                onChange={(e) => updatePlayer(idx, 'token', e.target.value as PlayerToken)}
                style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '1rem' }}
              >
                {AVAILABLE_TOKENS.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#1e293b', color: '#f8fafc' }}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={players[idx].name}
                onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                placeholder={`Player ${idx + 1}`}
                style={{ flex: 1, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem' }}
              />

              <div style={{ display: 'flex', gap: '4px' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updatePlayer(idx, 'color', c)}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: players[idx].color === c ? '2px solid white' : '1px solid rgba(0,0,0,0.5)',
                      transform: players[idx].color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Start / Cancel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          {canCancel && onClose && (
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button className="btn-primary" onClick={handleStart} style={{ padding: '12px 28px', fontSize: '1rem' }}>
            🚀 Start Match
          </button>
        </div>
      </div>
    </div>
  );
};
