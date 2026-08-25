'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';

interface GameBoardProps {
  level: number;
  onComplete: (level: number, score: number) => void;
  onBack: () => void;
}

interface GameConfig {
  difficulty: number;
  moves: number;
  target: number;
}

const LEVEL_CONFIGS: Record<number, GameConfig> = {
  1: { difficulty: 4, moves: 20, target: 20 },
  2: { difficulty: 6, moves: 25, target: 50 },
  3: { difficulty: 8, moves: 30, target: 100 },
  4: { difficulty: 10, moves: 35, target: 200 },
  5: { difficulty: 12, moves: 40, target: 500 },
};

export default function GameBoard({
  level,
  onComplete,
  onBack,
}: GameBoardProps) {
  const { getToken } = useAuth();
  const [cells, setCells] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const config = LEVEL_CONFIGS[level];

  useEffect(() => {
    initializeGame();
    fetchLeaderboard();
  }, [level]);

  const initializeGame = () => {
    const numCells = config.difficulty * config.difficulty;
    const newCells = Array.from({ length: numCells }, () =>
      Math.floor(Math.random() * 9) + 1
    );
    setCells(newCells);
    setMoves(config.moves);
    setScore(0);
    setMessage('');
    setGameOver(false);
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/${level}`
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.log('Could not fetch leaderboard');
    }
  };

  const handleCellClick = (index: number) => {
    if (gameOver || moves <= 0) return;

    const newScore = score + cells[index];
    const newMoves = moves - 1;

    setScore(newScore);
    setMoves(newMoves);

    const newCells = [...cells];
    newCells[index] = 0;
    setCells(newCells);

    if (newScore >= config.target) {
      handleGameComplete(newScore);
    } else if (newMoves <= 0) {
      setMessage(`انتهت الحركات! النقاط: ${newScore}/${config.target}`);
      setGameOver(true);
    }
  };

  const handleGameComplete = async (finalScore: number) => {
    setMessage(`🎉 تهانينا! لقد أكملت المستوى برقم ${finalScore}!`);
    setGameOver(true);

    try {
      const token = await getToken();
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scores`,
        {
          level,
          score: finalScore,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.log('Could not save score to backend');
    }

    setTimeout(() => {
      onComplete(level, finalScore);
      onBack();
    }, 2000);
  };

  const getLevelDescription = () => {
    const descriptions = {
      1: 'اجمع 20 نقطة في 20 حركة',
      2: 'اجمع 50 نقطة في 25 حركة',
      3: 'اجمع 100 نقطة في 30 حركة',
      4: 'اجمع 200 نقطة في 35 حركة',
      5: 'اجمع 500 نقطة في 40 حركة',
    };
    return descriptions[level as keyof typeof descriptions] || '';
  };

  return (
    <div className="game-area">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 className="game-title">المستوى {level}</h2>
        <button
          className="btn btn-danger"
          onClick={onBack}
          style={{ padding: '8px 16px' }}
        >
          ← الرجوع
        </button>
      </div>

      <p className="game-description">{getLevelDescription()}</p>

      <div className="game-stats">
        <div className="stat">
          <div className="stat-label">الحركات المتبقية</div>
          <div className="stat-value" style={{ color: moves > 10 ? '#4caf50' : '#f44336' }}>
            {moves}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">النقاط الحالية</div>
          <div className="stat-value">{score}</div>
        </div>
        <div className="stat">
          <div className="stat-label">النقاط المطلوبة</div>
          <div className="stat-value">{config.target}</div>
        </div>
      </div>

      <div className="game-content">
        <div
          className="game-board"
          style={{
            gridTemplateColumns: `repeat(${config.difficulty}, 1fr)`,
          }}
        >
          {cells.map((cell, index) => (
            <button
              key={index}
              className={`game-cell ${cell === 0 ? 'active' : ''}`}
              onClick={() => handleCellClick(index)}
              disabled={cell === 0 || gameOver}
              style={{
                opacity: cell === 0 ? 0.3 : 1,
              }}
            >
              {cell !== 0 ? cell : '✓'}
            </button>
          ))}
        </div>

        {message && (
          <div className={`message ${gameOver ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {gameOver && (
          <button
            className="btn btn-primary"
            onClick={initializeGame}
            style={{ width: '100%', marginTop: '10px' }}
          >
            إعادة محاولة
          </button>
        )}

        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <h3>🏆 أفضل النقاط - المستوى {level}</h3>
            {leaderboard.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="leaderboard-item">
                <span className="leaderboard-rank">#{idx + 1}</span>
                <span>{entry.userId}</span>
                <span className="leaderboard-score">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
