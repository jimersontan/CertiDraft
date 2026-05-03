import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string; // user ID
  email: string;
  plan: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string, email: string, plan: string): string {
  return jwt.sign(
    { sub: userId, email, plan },
    (process.env.JWT_SECRET || 'fallback_secret_change_me') as string,
    { expiresIn: (process.env.JWT_EXPIRE || '1d') as any }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    (process.env.JWT_SECRET || 'fallback_secret_change_me') as string,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me') as TokenPayload;
  } catch {
    return null;
  }
}
