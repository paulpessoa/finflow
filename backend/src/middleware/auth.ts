import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, JWTPayload } from '../types'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}
