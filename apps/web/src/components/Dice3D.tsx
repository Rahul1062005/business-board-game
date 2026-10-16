import React, { useEffect, useState } from 'react';

interface Dice3DProps {
  dice: [number, number] | null;
  isRolling: boolean;
  onRollComplete?: () => void;
}

// Maps die value (1-6) to final rotation angles in degrees
const ROTATION_MAP: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 180 },
};

export const Dice3D: React.FC<Dice3DProps> = ({ dice, isRolling, onRollComplete }) => {
  const [animating, setAnimating] = useState(false);
  const [rotations, setRotations] = useState<[{ x: number; y: number; z: number }, { x: number; y: number; z: number }]>([
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
  ]);

  useEffect(() => {
    if (isRolling) {
      setAnimating(true);
      // Generate wild tumbling spin rotations during throw
      const spin1 = {
        x: 1080 + Math.floor(Math.random() * 360),
        y: 1440 + Math.floor(Math.random() * 360),
        z: 720 + Math.floor(Math.random() * 360),
      };
      const spin2 = {
        x: 1440 + Math.floor(Math.random() * 360),
        y: 1080 + Math.floor(Math.random() * 360),
        z: 720 + Math.floor(Math.random() * 360),
      };
      setRotations([spin1, spin2]);
    } else if (dice && animating) {
      // Settle on the exact target face
      const target1 = ROTATION_MAP[dice[0]];
      const target2 = ROTATION_MAP[dice[1]];

      // Add full multiples so the die doesn't spin backward
      setRotations([
        { x: 1440 + target1.x, y: 1440 + target1.y, z: 0 },
        { x: 1440 + target2.x, y: 1440 + target2.y, z: 0 },
      ]);

      const timer = setTimeout(() => {
        setAnimating(false);
        onRollComplete?.();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isRolling, dice]);

  const renderPips = (val: number) => {
    return (
      <div className={`dice-face face-${val}`}>
        {Array.from({ length: val }).map((_, i) => (
          <span key={i} className="pip" />
        ))}
      </div>
    );
  };

  return (
    <div className="dice-3d-arena">
      <div className={`dice-throw-tray ${isRolling ? 'is-thrown' : ''}`}>
        {/* Die 1 */}
        <div className="cube-wrapper">
          <div
            className="cube"
            style={{
              transform: `rotateX(${rotations[0].x}deg) rotateY(${rotations[0].y}deg) rotateZ(${rotations[0].z}deg)`,
              transition: isRolling ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.65s cubic-bezier(0.17, 0.89, 0.32, 1.28)',
            }}
          >
            <div className="face face-front">{renderPips(1)}</div>
            <div className="face face-back">{renderPips(6)}</div>
            <div className="face face-right">{renderPips(3)}</div>
            <div className="face face-left">{renderPips(4)}</div>
            <div className="face face-top">{renderPips(2)}</div>
            <div className="face face-bottom">{renderPips(5)}</div>
          </div>
        </div>

        {/* Die 2 */}
        <div className="cube-wrapper">
          <div
            className="cube"
            style={{
              transform: `rotateX(${rotations[1].x}deg) rotateY(${rotations[1].y}deg) rotateZ(${rotations[1].z}deg)`,
              transition: isRolling ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.65s cubic-bezier(0.17, 0.89, 0.32, 1.28)',
            }}
          >
            <div className="face face-front">{renderPips(1)}</div>
            <div className="face face-back">{renderPips(6)}</div>
            <div className="face face-right">{renderPips(3)}</div>
            <div className="face face-left">{renderPips(4)}</div>
            <div className="face face-top">{renderPips(2)}</div>
            <div className="face face-bottom">{renderPips(5)}</div>
          </div>
        </div>
      </div>

      {dice && !isRolling && !animating && (
        <div className="dice-total-pill">
          🎲 Rolled {dice[0]} + {dice[1]} = <strong>{dice[0] + dice[1]}</strong>
          {dice[0] === dice[1] && <span className="doubles-tag">DOUBLES!</span>}
        </div>
      )}
    </div>
  );
};
