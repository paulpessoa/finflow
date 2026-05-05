import { Router } from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { requireAuth } from "../middleware/auth"
import { AuthRequest } from "../types"
import { Prisma, TransactionType } from "@prisma/client"

const router = Router()
router.use(requireAuth)

const transactionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().datetime(),
  categoryId: z.string(),
  notes: z.string().optional()
})

// GET /api/transactions?page=1&limit=10&type=EXPENSE&from=2024-01-01&to=2024-12-31
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { page = "1", limit = "10", type, from, to, categoryId } = req.query

    const where: Prisma.TransactionWhereInput = { userId: req.userId! }
    if (type) where.type = type as TransactionType
    if (categoryId) where.categoryId = categoryId as string
    if (from || to)
      where.date = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {})
      }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.transaction.count({ where })
    ])

    return res.json({
      data: transactions,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    next(err)
  }
})


// GET /api/transactions/summary — totais por categoria
router.get("/summary", async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!
    const { from, to } = req.query

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const fromDate = from ? new Date(from as string).toISOString() : '1970-01-01T00:00:00Z'
    const toDate = to ? new Date(to as string).toISOString() : '9999-12-31T23:59:59Z'

    const summaryRaw = await prisma.$queryRaw<any[]>`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction"
          WHERE "userId" = ${userId} AND "type"::text = 'INCOME'
            AND "date" >= ${fromDate}::timestamptz AND "date" <= ${toDate}::timestamptz) as income,
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction"
          WHERE "userId" = ${userId} AND "type"::text = 'EXPENSE'
            AND "date" >= ${fromDate}::timestamptz AND "date" <= ${toDate}::timestamptz) as expense
    `
    const income = Number(summaryRaw[0].income)
    const expense = Number(summaryRaw[0].expense)

    const byCategoryRaw = await prisma.$queryRaw<any[]>`
      SELECT "categoryId", COALESCE(SUM(amount), 0) as total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND "type"::text = 'EXPENSE'
        AND "date" >= ${fromDate}::timestamptz AND "date" <= ${toDate}::timestamptz
      GROUP BY "categoryId"
      ORDER BY total DESC
    `
    const categoryIds = byCategoryRaw.map((b: any) => b.categoryId)
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    const byCategory = byCategoryRaw.map((b: any) => {
      const cat = categories.find((c) => c.id === b.categoryId)
      return {
        id: b.categoryId,
        name: cat?.name ?? 'Outros',
        color: cat?.color ?? '#cbd5e1',
        icon: cat?.icon ?? '📁',
        total: Number(b.total),
      }
    })

    return res.json({ income, expense, balance: income - expense, byCategory })

  } catch (err) {
    next(err)
  }
})

// POST /api/transactions
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const data = transactionSchema.parse(req.body)
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        amount: data.amount,
        date: new Date(data.date),
        userId: req.userId!
      },
      include: { category: true }
    })
    return res.status(201).json(transaction)
  } catch (err) {
    next(err)
  }
})

// GET /api/transactions/:id — buscar transação única (DEVE vir após rotas estáticas como /summary)
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { category: true }
    })
    if (!transaction)
      return res.status(404).json({ error: "Transação não encontrada" })
    return res.json(transaction)
  } catch (err) {
    next(err)
  }
})

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const exists = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!exists)
      return res.status(404).json({ error: "Transação não encontrada" })

    const data = transactionSchema.partial().parse(req.body)
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
      include: { category: true }
    })
    return res.json(transaction)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/transactions/:id
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const exists = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId }
    })
    if (!exists)
      return res.status(404).json({ error: "Transação não encontrada" })
    await prisma.transaction.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
