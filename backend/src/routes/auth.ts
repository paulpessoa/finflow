import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const router = Router()

const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, passwordHash } })

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    return res.status(201).json({ token, user: { id: user.id, name, email } })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' })

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    return res.json({ token, user: { id: user.id, name: user.name, email } })
  } catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autenticado' })
    const token = authHeader.split(' ')[1]
    const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
    return res.json(user)
  } catch (err) { next(err) }
})

export default router
