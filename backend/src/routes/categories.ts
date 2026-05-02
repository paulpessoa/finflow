import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (_, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    return res.json(categories)
  } catch (err) { next(err) }
})

export default router
