import { Router } from 'itty-router';
import type { KVNamespace, R2Bucket } 
from '@cloudflare/workers-types';
const router = Router();
interface GameScore {
  userId: string;
  level: number;
  score: number;
  timestamp: number;
}

interface ClerkUser {
  sub: string;
  email: string;
  name: string;
}

interface Env {
  GAME_KV: KVNamespace;
  GAME_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
}

async function verifyClerkToken(request: Request): Promise<ClerkUser | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header');
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const clerkResponse = await fetch('https://api.clerk.com/v1/tokens/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!clerkResponse.ok) {
      console.error('Clerk verification failed:', clerkResponse.status);
      return null;
    }

    const data = await clerkResponse.json() as ClerkUser;
    return data;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

router.post<Request, [Env]>('/api/scores', async (request, env: Env) => {
  try {
    const user = await verifyClerkToken(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as { level: number; score: number };
    
    if (!body.level || body.score === undefined) {
      return new Response(
        JSON.stringify({ error: 'Bad request', message: 'Missing level or score' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const gameScore: GameScore = {
      userId: user.sub,
      level: body.level,
      score: body.score,
      timestamp: Date.now(),
    };

    const key = `score:${user.sub}:${body.level}:${Date.now()}`;
    await env.GAME_KV.put(key, JSON.stringify(gameScore));

    const bestKey = `best:${user.sub}:${body.level}`;
    const bestScore = await env.GAME_KV.get(bestKey);
    
    if (!bestScore || JSON.parse(bestScore).score < body.score) {
      await env.GAME_KV.put(bestKey, JSON.stringify(gameScore));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Score saved successfully',
        score: gameScore 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error saving score:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

router.get<Request, [Env]>('/api/scores/:userId/:level', async (request, env: Env, params?: { userId: string; level: string }) => {
  try {
    const user = await verifyClerkToken(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = params?.userId || '';
    const level = params?.level || '';

    if (userId !== user.sub) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const key = `best:${userId}:${level}`;
    const score = await env.GAME_KV.get(key);

    if (!score) {
      return new Response(
        JSON.stringify({ error: 'Score not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(score, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching score:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

router.get<Request, [Env]>('/api/user-scores', async (request, env: Env) => {
  try {
    const user = await verifyClerkToken(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const scores = [];
    const keys = await env.GAME_KV.list({ prefix: `best:${user.sub}:` });

    for (const key of keys.keys) {
      const score = await env.GAME_KV.get(key.name);
      if (score) {
        scores.push(JSON.parse(score));
      }
    }

    return new Response(
      JSON.stringify({ scores, total: scores.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching user scores:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

router.get<Request, [Env]>('/api/leaderboard/:level', async (request, env: Env, params?: { level: string }) => {
  try {
    const level = params?.level || '';

    const allScores: GameScore[] = [];
    const keys = await env.GAME_KV.list({ prefix: `best:` });

    for (const key of keys.keys) {
      const score = await env.GAME_KV.get(key.name);
      if (score) {
        const parsed = JSON.parse(score) as GameScore;
        if (parsed.level === parseInt(level)) {
          allScores.push(parsed);
        }
      }
    }

    const leaderboard = allScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((score, index) => ({
        rank: index + 1,
        userId: score.userId,
        score: score.score,
        timestamp: score.timestamp,
      }));

    return new Response(
      JSON.stringify(leaderboard),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

router.get('/api/health', () => {
  return new Response(
    JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

router.all('*', () => {
  return new Response(
    JSON.stringify({ error: 'Not found', message: 'The requested resource does not exist' }),
    { status: 404, headers: { 'Content-Type': 'application/
