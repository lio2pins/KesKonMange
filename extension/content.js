function extractRecipe() {
  const title =
    document.querySelector('h1')?.innerText?.trim() ||
    document.querySelector('[class*="title"]')?.innerText?.trim() ||
    document.title || ''

  // Temps : cherche patterns comme "30 min", "1h30", "45 minutes"
  const timeMatch = document.body.innerText.match(/(\d+)\s*(h|heure|min|minute)/i)
  const totalMinutes = timeMatch
    ? timeMatch[2].toLowerCase().startsWith('h')
      ? parseInt(timeMatch[1]) * 60
      : parseInt(timeMatch[1])
    : 0

  // Ingrédients : cherche les listes proches de mots-clés
  let ingredients = ''
  const allLists = document.querySelectorAll('ul, ol')
  for (const list of allLists) {
    const text = list.innerText.toLowerCase()
    const context = list.closest('[class*="ingredient"], [id*="ingredient"]')
    if (context || text.includes('g\n') || text.includes('ml\n') || text.includes('cuill')) {
      ingredients = list.innerText.trim()
      break
    }
  }

  // Étapes : cherche les listes numérotées ou sections préparation
  let steps = ''
  const stepContext = document.querySelector('[class*="instruction"], [class*="preparation"], [class*="etape"], [class*="step"]')
  if (stepContext) {
    steps = stepContext.innerText.trim()
  }

  return {
    title,
    totalMinutes,
    ingredients,
    steps,
    sourceUrl: window.location.href,
    notes: '',
    status: 'a_tester',
    type: 'semaine',
    weekendCategory: ''
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extract') {
    sendResponse(extractRecipe())
  }
})