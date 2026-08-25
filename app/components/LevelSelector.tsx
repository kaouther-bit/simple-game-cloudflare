import React from 'react';

interface LevelSelectorProps {
  completedLevels: number[];
  onSelectLevel: (level: number) => void;
}

const LEVELS = [
  { id: 1, name: 'المستوى 1', description: 'سهل - تعرّف على اللعبة' },
  { id: 2, name: 'المستوى 2', description: 'متوسط - تحدي أكبر' },
  { id: 3, name: 'المستوى 3', description: 'صعب - احترف اللعبة' },
  { id: 4, name: 'المستوى 4', description: 'حرج جداً - تحدي للأبطال' },
  { id: 5, name: 'المستوى 5', description: 'مستحيل - هل ستقبل التحدي؟' },
];

export default function LevelSelector({
  completedLevels,
  onSelectLevel,
}: LevelSelectorProps) {
  return (
    <div className="game-area">
      <h2 className="game-title">اختر المستوى</h2>
      <div className="levels-grid">
        {LEVELS.map((level) => {
          const isCompleted = completedLevels.includes(level.id);
          const isLocked = level.id > 1 && !completedLevels.includes(level.id - 1);

          return (
            <button
              key={level.id}
              className={`level-btn ${isCompleted ? 'completed' : ''} ${
                isLocked ? 'locked' : ''
              }`}
              onClick={() => !isLocked && onSelectLevel(level.id)}
              disabled={isLocked}
              title={level.description}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>
                {isCompleted ? '✅' : isLocked ? '🔒' : '▶️'}
              </div>
              <div style={{ fontSize: '0.9rem' }}>{level.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
