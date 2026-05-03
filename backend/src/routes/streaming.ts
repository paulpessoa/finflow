import { Router, Response, NextFunction } from "express"
import { requireAuth } from "../middleware/auth"
import { AuthRequest } from "../types"
import { prisma } from "../lib/prisma"
import { AiServiceFactory } from "../services/ai/AiServiceFactory"

const router = Router()

// Rota de Perguntas Rápidas com Streaming Manual (SSE)
// Fica separada da rota /api/ai/insights para manter o desacoplamento
router.post(
  "/ask",
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!
      const { question } = req.body

      if (!question) {
        return res.status(400).json({ error: "A pergunta é obrigatória." })
      }

      // 1. Context Injection (Dados financeiros dos últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const transactions = await prisma.transaction.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        include: { category: true }
      })

      let totalIncome = 0
      let totalExpense = 0
      const summary: Record<string, number> = {}

      transactions.forEach(t => {
        const val = Number(t.amount)
        if (t.type === 'INCOME') totalIncome += val
        else {
          totalExpense += val
          summary[t.category.name] = (summary[t.category.name] || 0) + val
        }
      })

      const financialContext = {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        expensesByCategory: summary
      }

      // 2. Configuração do Header para Server-Sent Events (SSE)
      // Mantém a conexão aberta para enviar pedaços de texto
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // 3. Invocação via Strategy Pattern (Factory)
      const aiProvider = AiServiceFactory.getProvider()
      
      const systemPrompt = `Você é um Consultor Financeiro Sênior do FinFlow.
Analise a pergunta do usuário baseando-se estritamente nos dados financeiros fornecidos abaixo.
Seja conciso, direto e profissional. Rejeite qualquer assunto extra-financeiro.

DADOS DO USUÁRIO (ÚLTIMOS 30 DIAS):
${JSON.stringify(financialContext, null, 2)}`

      await aiProvider.streamChat({
        systemPrompt,
        userPrompt: question,
        onChunk: (text) => {
          // Envia o texto cru para o frontend
          res.write(text)
        },
        onComplete: () => {
          res.end()
        },
        onError: (err) => {
          console.error("Erro no stream:", err)
          res.write(" [ERRO: Ocorreu uma falha no processamento da resposta.]")
          res.end()
        }
      })

    } catch (error) {
      next(error)
    }
  }
)

export default router
