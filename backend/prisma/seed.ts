import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Categorias padrão
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Salário' },    update: {}, create: { name: 'Salário',    color: '#22c55e', icon: '💼' } }),
    prisma.category.upsert({ where: { name: 'Freelance' },  update: {}, create: { name: 'Freelance',  color: '#3b82f6', icon: '💻' } }),
    prisma.category.upsert({ where: { name: 'Alimentação'},  update: {}, create: { name: 'Alimentação',color: '#f59e0b', icon: '🍔' } }),
    prisma.category.upsert({ where: { name: 'Transporte' }, update: {}, create: { name: 'Transporte', color: '#8b5cf6', icon: '🚗' } }),
    prisma.category.upsert({ where: { name: 'Moradia' },    update: {}, create: { name: 'Moradia',    color: '#ec4899', icon: '🏠' } }),
    prisma.category.upsert({ where: { name: 'Lazer' },      update: {}, create: { name: 'Lazer',      color: '#06b6d4', icon: '🎮' } }),
  ])

  // Usuário demo
  const user = await prisma.user.upsert({
    where: { email: 'paul@demo.com' },
    update: {},
    create: {
      email: 'paul@demo.com',
      name: 'Paul Demo',
      passwordHash: await bcrypt.hash('demo1234', 10),
    },
  })

  // Transações de exemplo
  const now = new Date()
  await prisma.transaction.createMany({
    skipDuplicates: true,
    data: [
      { description: 'Salário mensal',   amount: 8000, type: 'INCOME',  date: new Date(now.getFullYear(), now.getMonth(), 5),  userId: user.id, categoryId: categories[0].id },
      { description: 'Projeto Freelance',amount: 2500, type: 'INCOME',  date: new Date(now.getFullYear(), now.getMonth(), 12), userId: user.id, categoryId: categories[1].id },
      { description: 'Supermercado',     amount: 450,  type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 8),  userId: user.id, categoryId: categories[2].id },
      { description: 'Uber',             amount: 120,  type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 15), userId: user.id, categoryId: categories[3].id },
      { description: 'Aluguel',          amount: 1800, type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 1),  userId: user.id, categoryId: categories[4].id },
      { description: 'Netflix + Spotify',amount: 65,   type: 'EXPENSE', date: new Date(now.getFullYear(), now.getMonth(), 10), userId: user.id, categoryId: categories[5].id },
    ],
  })

  console.log('✅ Seed concluído — usuário demo: paul@demo.com / demo1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
