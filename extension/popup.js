const API = 'http://192.168.0.13:3001'

document.getElementById('type').addEventListener('change', (e) => {
  document.getElementById('categoryField').style.display =
    e.target.value === 'weekend' ? 'block' : 'none'
})

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  document.getElementById('sourceUrl').value = tabs[0].url
  chrome.tabs.sendMessage(tabs[0].id, { action: 'extract' }, (recipe) => {
    if (recipe) {
      document.getElementById('title').value = recipe.title || ''
      document.getElementById('totalMinutes').value = recipe.totalMinutes || 0
      document.getElementById('ingredients').value = recipe.ingredients || ''
      document.getElementById('steps').value = recipe.steps || ''
    }
  })
})

document.getElementById('save').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim()
  if (!title) { alert('Le titre est obligatoire'); return }

  const recipe = {
    title,
    totalMinutes: parseInt(document.getElementById('totalMinutes').value) || 0,
    ingredients: document.getElementById('ingredients').value,
    steps: document.getElementById('steps').value,
    notes: document.getElementById('notes').value,
    sourceUrl: document.getElementById('sourceUrl').value,
    status: 'a_tester',
    type: document.getElementById('type').value,
    weekendCategory: document.getElementById('weekendCategory').value
  }

  try {
    const res = await fetch(`${API}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    })
    if (res.ok) {
      document.getElementById('status').style.display = 'block'
      document.getElementById('save').style.display = 'none'
      setTimeout(() => window.close(), 1500)
    } else {
      document.getElementById('error').style.display = 'block'
    }
  } catch (e) {
    document.getElementById('error').style.display = 'block'
  }
})

document.getElementById('cancel').addEventListener('click', () => window.close())