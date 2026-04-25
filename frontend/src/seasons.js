export const SEASONS = {
  printemps: {
    months: [3, 4, 5],
    label: 'Printemps',
    emoji: '🌸',
    colors: {
      primary: '#10b981',
      primaryLight: '#d1fae5',
      accent: '#6ee7b7',
      bg: '#f0fdf4',
      text: '#065f46'
    },
    fruits: ['Fraises', 'Cerises', 'Rhubarbe', 'Citrons'],
    legumes: ['Asperges', 'Petits pois', 'Radis', 'Épinards', 'Artichauts', 'Fèves']
  },
  ete: {
    months: [6, 7, 8],
    label: 'Été',
    emoji: '☀️',
    colors: {
      primary: '#f59e0b',
      primaryLight: '#fef3c7',
      accent: '#fcd34d',
      bg: '#fffbeb',
      text: '#92400e'
    },
    fruits: ['Tomates', 'Pêches', 'Abricots', 'Melons', 'Pastèques', 'Framboises', 'Myrtilles'],
    legumes: ['Courgettes', 'Aubergines', 'Poivrons', 'Concombres', 'Haricots verts', 'Maïs']
  },
  automne: {
    months: [9, 10, 11],
    label: 'Automne',
    emoji: '🍂',
    colors: {
      primary: '#ea580c',
      primaryLight: '#ffedd5',
      accent: '#fb923c',
      bg: '#fff7ed',
      text: '#7c2d12'
    },
    fruits: ['Pommes', 'Poires', 'Raisins', 'Figues', 'Coings', 'Châtaignes'],
    legumes: ['Potiron', 'Butternut', 'Champignons', 'Poireaux', 'Endives', 'Topinambours']
  },
  hiver: {
    months: [12, 1, 2],
    label: 'Hiver',
    emoji: '❄️',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#dbeafe',
      accent: '#93c5fd',
      bg: '#eff6ff',
      text: '#1e3a8a'
    },
    fruits: ['Clémentines', 'Oranges', 'Pamplemousses', 'Kiwis', 'Pomelos'],
    legumes: ['Choux', 'Carottes', 'Navets', 'Céleri', 'Mâche', 'Panais', 'Salsifis']
  }
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  return Object.entries(SEASONS).find(([, s]) => s.months.includes(month))?.[0] || 'printemps'
}