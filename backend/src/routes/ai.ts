import { Router, Response, NextFunction } from "express"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"
import { AuthRequest } from "../types"
import { prisma } from "../lib/prisma"

const router = Router()

// Schema de Validação de Saída da IA (O Contrato)
const AIResponseSchema = z.object({
  rating: z.enum(["Saudável", "Alerta", "Crítico"]),
  insights: z.array(z.string()),
  actionPlan: z.array(z.string()).max(3),
  chartData: z.array(
    z.object({
      label: z.string(),
      value: z.number()
    })
  )
})

// Tipagem rigorosa para a resposta da API do Groq/OpenAI
interface GroqChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Rate limit simples em memória (Para MVP)
// Em produção, usar Redis ou tabela no banco
const rateLimitCache = new Map<string, { count: number; date: string }>()

router.post(
  "/insights",
  requireAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!

      // 1. Rate Limiting (10 requests per day)
      const today = new Date().toISOString().split("T")[0]
      const userLimit = rateLimitCache.get(userId) || { count: 0, date: today }

      if (userLimit.date !== today) {
        userLimit.count = 0
        userLimit.date = today
      }

      if (userLimit.count >= 10) {
        return res
          .status(429)
          .json({ error: "Limite de análises diárias atingido (Máximo: 10)" })
      }

      // Atualiza cache de rate limit
      userLimit.count += 1
      rateLimitCache.set(userId, userLimit)

      // 2. Fetching & Anonimização
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo }
        },
        include: { category: true }
      })

      if (transactions.length === 0) {
        return res
          .status(400)
          .json({ error: "Transações insuficientes para análise." })
      }

      // Anonimizando os dados
      let totalIncome = 0
      let totalExpense = 0
      const expensesByCategory: Record<string, number> = {}

      transactions.forEach((t) => {
        const amount = Number(t.amount)
        if (t.type === "INCOME") {
          totalIncome += amount
        } else {
          totalExpense += amount
          const catName = t.category.name
          expensesByCategory[catName] =
            (expensesByCategory[catName] || 0) + amount
        }
      })

      const userDataPayload = {
        period: "Últimos 30 dias",
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        expensesByCategory
      }

      // 3. Prompt Engineering
      const systemPrompt = `Você é um Consultor Financeiro Sênior da plataforma FinFlow. 
Sua função é analisar exclusivamente os dados financeiros do usuário e retornar um objeto JSON.
Rejeite qualquer pergunta ou assunto fora de finanças pessoais.

Regras Inegociáveis de Análise:
1. Regra dos 30%: Se (totalIncome - totalExpense) > (totalIncome * 0.3), você DEVE incluir uma sugestão de investimento conservador (ex: Tesouro Direto, CDB) no actionPlan ou insights.
2. Categoria Dominante: Identifique a categoria com maior gasto. Se passar de 20% do totalIncome, crie um passo de redução no actionPlan.
3. Renda Variável: Se achar apropriado com base no risco, sugira focar em reserva de emergência.
4. actionPlan: Deve ter NO MÁXIMO 3 passos pragmáticos para executar esta semana.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON STRICT):
{
  "rating": "Saudável" | "Alerta" | "Crítico",
  "insights": ["insight 1", "insight 2", ...],
  "actionPlan": ["ação 1", "ação 2", "ação 3"],
  "chartData": [{"label": "Nome Categoria", "value": 150}]
}

O chartData deve resumir as principais despesas proporcionalmente para facilitar a visualização.`

      const userPrompt = `### USER DATA START ###\n${JSON.stringify(userDataPayload, null, 2)}\n### USER DATA END ###\nAnalise os dados e retorne o JSON estruturado.`

      // 4. Invocação da LLM via fetch nativo (Groq LPU)
      const groqApiKey = process.env.GROQ_API_KEY
      if (!groqApiKey) {
        return res
          .status(500)
          .json({ error: "Serviço de IA não configurado no servidor." })
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Modelo veloz e atualizado
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2 // Baixa temperatura para respostas analíticas e JSON estável
          })
        }
      )

      if (!response.ok) {
        const errBody = await response.text()
        console.error("Erro Groq API:", response.status, errBody)
        return res
          .status(503)
          .json({
            error:
              "O serviço de análise de IA está temporariamente indisponível."
          })
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const content = data.choices[0]?.message?.content

      if (!content) {
        return res
          .status(500)
          .json({ error: "A IA retornou uma resposta vazia." })
      }

      // 5. Parse e Validação (Zod)
      let parsedContent: unknown
      try {
        parsedContent = JSON.parse(content)
      } catch (e) {
        console.error("Erro de parse JSON da IA:", content)
        return res
          .status(500)
          .json({ error: "A IA retornou um formato inválido." })
      }

      const validationResult = AIResponseSchema.safeParse(parsedContent)

      if (!validationResult.success) {
        console.error("Falha de schema Zod:", validationResult.error.format())
        return res
          .status(500)
          .json({ error: "A análise não pôde ser estruturada corretamente." })
      }

      // Retorna payload tipado de forma segura e imediata
      return res.json(validationResult.data)
    } catch (error) {
      next(error)
    }
  }
)

export default router
