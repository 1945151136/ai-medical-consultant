// JWT 认证工具
// JSON Web Token utilities

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medical-platform-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  sub: string;   // userId
  name: string;
  role: string;
}

/** 生成 JWT Token */
export function generateToken(userId: string, name: string, role: string = 'patient'): string {
  return jwt.sign(
    { sub: userId, name, role } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/** 验证 JWT Token */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** 从 Authorization header 提取 token */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}
