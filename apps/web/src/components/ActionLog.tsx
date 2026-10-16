import React, { useRef, useEffect } from 'react';
import { GameActionLogItem } from '@business/shared-types';

interface ActionLogProps {
  logs: GameActionLogItem[];
}

export const ActionLog: React.FC<ActionLogProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9' }}>
          📜 Transaction Log
        </h3>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {logs.length} events
        </span>
      </div>

      <div ref={containerRef} className="action-log-feed">
        {logs.slice(-25).map((log) => {
          let icon = '📢';
          if (log.type === 'roll') icon = '🎲';
          if (log.type === 'move') icon = '🚶';
          if (log.type === 'buy') icon = '💼';
          if (log.type === 'rent') icon = '💸';
          if (log.type === 'tax') icon = '🏛️';
          if (log.type === 'upgrade') icon = '⭐';
          if (log.type === 'mortgage') icon = '🏦';
          if (log.type === 'trade') icon = '🤝';
          if (log.type === 'bankruptcy') icon = '💥';
          if (log.type === 'card') icon = '✨';

          return (
            <div key={log.id} className="log-item">
              <span style={{ fontSize: '0.95rem' }}>{icon}</span>
              <span style={{ flex: 1, color: '#e2e8f0', lineHeight: 1.3 }}>{log.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
