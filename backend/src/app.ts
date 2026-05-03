import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import transactionRoutes from './routes/transactions'
import categoryRoutes from './routes/categories'
import aiRoutes from './routes/ai'
import streamingRoutes from './routes/streaming'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Middlewares globais
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }))
app.use(express.json())

// Rota de health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }))

// Rotas da aplicação
app.use('/api/auth',         authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/categories',   categoryRoutes)
app.use('/api/ai',           aiRoutes)
app.use('/api/streaming',    streamingRoutes)

// Handler global de erros (sempre por último)
app.use(errorHandler)

export default app
