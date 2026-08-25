'use client';

import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import LevelSelector from './components/LevelSelector';

interface GameState {
  currentLevel: number;
  completedLevels: number[];
  totalScore: number;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 0,
    completedLevels: [],
    totalScore: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      setGameState(JSON.parse(saved));
    }
  }, []);

  const handleLevelSelect = (level: number) => {
    setGameState((prev) => ({
      ...prev,
      currentLevel: level,
    }));
  };

  const handleLevelComplete = (level: number, score: number) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        totalScore: prev.totalScore + score,
        completedLevels: [...new Set([...prev.completedLevels, level])],
      };
      localStorage.setItem('gameState', JSON.stringify(newState));
      return newState;
    });
  };

  if (!isSignedIn) {
    return (
      <div className="game-container">
        <div className="game-area">
          <div className="header">
            <h1>🎮 لعبتي</h1>
            <p>تسجيل الدخول للبدء باللعب</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <UserButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="header">
        <h1>🎮 لعبتي</h1>
        <p>مرحبا {user?.firstName}</p>
      </div>

      <div className="user-info">
        <div>
          <span>المستوى الحالي: </span>
          <strong>{gameState.currentLevel || 'الرئيسية'}</strong>
        </div>
        <div>
          <span>النقاط الكلية: </span>
          <strong>{gameState.totalScore}</strong>
        </div>
        <div className="auth-container">
          <UserButton />
        </div>
      </div>

      {gameState.currentLevel === 0 ? (
        <LevelSelector
          completedLevels={gameState.completedLevels}
          onSelectLevel={handleLevelSelect}
        />
      ) : (
        <GameBoard
          level={gameState.currentLevel}
          onComplete={handleLevelComplete}
          onBack={() => handleLevelSelect(0)}
        />
      )}
    </div>
  );
}
