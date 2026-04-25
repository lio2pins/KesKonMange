const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// ==================== RECETTES ====================

app.get('/recipes', async (req, res) => {
  const { status } = req.query
  const where = status ? { status } : {}
  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { addedAt: 'desc' }
  })
  res.json(recipes)
})

app.get('/recipes/:id', async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: req.params.id }
  })
  if (!recipe) return res.status(404).json({ error: 'Not found' })
  res.json(recipe)
})

app.post('/recipes', async (req, res) => {
  const recipe = await prisma.recipe.create({ data: req.body })
  res.status(201).json(recipe)
})

app.patch('/recipes/:id', async (req, res) => {
  const recipe = await prisma.recipe.update({
    where: { id: req.params.id },
    data: req.body
  })
  res.json(recipe)
})

app.delete('/recipes/:id', async (req, res) => {
  await prisma.recipe.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

// ==================== MENUS ====================

// IMPORTANT : routes spécifiques AVANT les routes avec paramètres

app.get('/menu/history', async (req, res) => {
  const weeks = await prisma.menuWeek.findMany({
    where: { validated: true },
    include: { slots: { include: { recipe: true } } },
    orderBy: { weekStart: 'desc' }
  })
  res.json(weeks)
})

app.post('/menu/generate', async (req, res) => {
  const { weekStart } = req.body

  const validatedWeeks = await prisma.menuWeek.findMany({
    where: { validated: true },
    include: { slots: true },
    orderBy: { weekStart: 'desc' },
    take: 8
  })

  const recentRecipeIds = new Set(
    validatedWeeks.flatMap(w => w.slots.map(s => s.recipeId).filter(Boolean))
  )

  const allRecipes = await prisma.recipe.findMany({
    where: { status: 'validee' }
  })

  const semainePool = allRecipes.filter(r => r.type === 'semaine' && !recentRecipeIds.has(r.id))
  const weekendPool = allRecipes.filter(r => r.type === 'weekend' && !recentRecipeIds.has(r.id))

  const semaineAvail = semainePool.length >= 5 ? semainePool : allRecipes.filter(r => r.type === 'semaine')
  const weekendAvail = weekendPool.length >= 1 ? weekendPool : allRecipes.filter(r => r.type === 'weekend')

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
  const shuffledSemaine = shuffle(semaineAvail)
  const shuffledWeekend = shuffle(weekendAvail)

  const existing = await prisma.menuWeek.findFirst({
    where: { weekStart: new Date(weekStart) }
  })
  if (existing) {
    await prisma.menuSlot.deleteMany({ where: { menuId: existing.id } })
    await prisma.menuWeek.delete({ where: { id: existing.id } })
  }

  const menu = await prisma.menuWeek.create({
    data: { weekStart: new Date(weekStart) }
  })

  const friday = new Date(weekStart)
  const slots = []
  let semaineIdx = 0
  let weekendIdx = 0

  for (let i = 0; i < 7; i++) {
    const slotDate = new Date(friday)
    slotDate.setDate(friday.getDate() + i)

    if (i === 2) {
      slots.push({ menuId: menu.id, slotDate, recipeId: null, isManual: false })
      continue
    }

    if (i === 1) {
      const recipe = shuffledWeekend[weekendIdx % shuffledWeekend.length] || null
      weekendIdx++
      slots.push({ menuId: menu.id, slotDate, recipeId: recipe?.id || null, isManual: false })
      continue
    }

    const recipe = shuffledSemaine[semaineIdx % shuffledSemaine.length] || null
    semaineIdx++
    slots.push({ menuId: menu.id, slotDate, recipeId: recipe?.id || null, isManual: false })
  }

  await prisma.menuSlot.createMany({ data: slots })

  const result = await prisma.menuWeek.findUnique({
    where: { id: menu.id },
    include: { slots: { include: { recipe: true } } }
  })

  res.json(result)
})

app.patch('/menu/slot/:id', async (req, res) => {
  const slot = await prisma.menuSlot.update({
    where: { id: req.params.id },
    data: { recipeId: req.body.recipeId, isManual: true }
  })
  res.json(slot)
})

app.patch('/menu/:id/validate', async (req, res) => {
  const menu = await prisma.menuWeek.update({
    where: { id: req.params.id },
    data: { validated: true }
  })
  res.json(menu)
})

app.get('/menu/:weekStart', async (req, res) => {
  const week = await prisma.menuWeek.findFirst({
    where: { weekStart: new Date(req.params.weekStart) },
    include: { slots: { include: { recipe: true } } }
  })
  res.json(week || null)
})

// ==================== START ====================

app.listen(3001, '0.0.0.0', () => console.log('API running on http://localhost:3001'))
