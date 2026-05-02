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
    const { from, to } = req.query
    const dateFilter =
      from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from as string) } : {}),
              ...(to ? { lte: new Date(to as string) } : {})
            }
          }
        : {}

    const [income, expense, byCategory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: req.userId, type: "INCOME", ...dateFilter },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { userId: req.userId, type: "EXPENSE", ...dateFilter },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { userId: req.userId, type: "EXPENSE", ...dateFilter },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } }
      })
    ])

    const categories = await prisma.category.findMany({
      where: { id: { in: byCategory.map((b) => b.categoryId) } }
    })
    const categorySummary = byCategory.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId)
      return {
        id: cat?.id,
        name: cat?.name,
        color: cat?.color,
        icon: cat?.icon,
        total: b._sum.amount
      }
    })

    return res.json({
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
      balance:
        Number(income._sum.amount ?? 0) - Number(expense._sum.amount ?? 0),
      byCategory: categorySummary
    })
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

// PUT /api/transactions/:id
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
