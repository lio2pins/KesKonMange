import { useState, useEffect } from 'react'
import axios from 'axios'
import { SEASONS, getCurrentSeason } from './seasons.js'

const API = 'http://192.168.0.13:3001'
const STATUS_LABELS = { a_tester: 'À tester', validee: 'Validée', a_oublier: 'À oublier' }
const STATUS_COLORS = { a_tester: '#f59e0b', validee: '#10b981', a_oublier: '#ef4444' }
const EMPTY_FORM = {
  title: '', ingredients: '', totalMinutes: 0, steps: '',
  sourceUrl: '', notes: '', status: 'validee', type: 'semaine', weekendCategory: ''
}
const JOURS = ['Vendredi', 'Samedi soir', 'Dimanche soir', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi']

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const diffToFriday = day >= 5 ? day - 5 : day + 2
  const friday = new Date(today)
  friday.setDate(today.getDate() - diffToFriday)
  friday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(friday)
    d.setDate(friday.getDate() + i)
    return d
  })
}

function getWeekStart() {
  const dates = getWeekDates()
  return dates[0].toISOString().split('T')[0]
}

function formatDate(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function dateKey(d) {
  return d.toISOString().split('T')[0]
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [recipes, setRecipes] = useState([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selected, setSelected] = useState(null)
  const [menu, setMenu] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [slotPicker, setSlotPicker] = useState(null) // slot en cours de remplacement manuel
  const [history, setHistory] = useState([])
  const [historySelected, setHistorySelected] = useState(null)

  const season = getCurrentSeason()
  const seasonData = SEASONS[season]
  const sc = seasonData.colors

  const weekDates = getWeekDates()

  const loadRecipes = async () => {
    const url = filter === 'all' ? `${API}/recipes` : `${API}/recipes?status=${filter}`
    const { data } = await axios.get(url)
    setRecipes(data)
  }

  const loadMenu = async () => {
    const { data } = await axios.get(`${API}/menu/${getWeekStart()}`)
    setMenu(data)
  }

  const loadHistory = async () => {
    const { data } = await axios.get(`${API}/menu/history`)
    setHistory(data)
  }

  useEffect(() => { loadRecipes() }, [filter])
  useEffect(() => { loadMenu(); loadHistory() }, [])

  const getSlotForDate = (date) => {
    if (!menu) return null
    const key = dateKey(date)
    return menu.slots?.find(s => s.slotDate.split('T')[0] === key) || null
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { data } = await axios.post(`${API}/menu/generate`, { weekStart: getWeekStart() })
      setMenu(data)
    } catch (e) {
      alert('Erreur lors de la génération')
    }
    setGenerating(false)
  }

  const handleValidateMenu = async () => {
    if (!menu) return
    await axios.patch(`${API}/menu/${menu.id}/validate`)
    setMenu({ ...menu, validated: true })
  }

  const handleSlotChange = async (slotId, recipeId) => {
    await axios.patch(`${API}/menu/slot/${slotId}`, { recipeId })
    setSlotPicker(null)
    loadMenu()
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    await axios.post(`${API}/recipes`, form)
    setForm(EMPTY_FORM)
    setShowForm(false)
    loadRecipes()
  }

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/recipes/${id}`, { status })
    setSelected(null)
    loadRecipes()
  }

  const deleteRecipe = async (id) => {
    if (!confirm('Supprimer cette recette ?')) return
    await axios.delete(`${API}/recipes/${id}`)
    setSelected(null)
    loadRecipes()
  }

  const validatedRecipes = recipes.filter(r => r.status === 'validee')


function ExtensionBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('ext-dismissed') === '1')
  if (dismissed) return null
  return (
    <div style={{
      background: '#fefce8', border: '1px solid #fde047', borderRadius: 10,
      padding: '12px 16px', marginBottom: 16, display: 'flex',
      justifyContent: 'space-between', alignItems: 'center', gap: 12
    }}>
      <div style={{ fontSize: 13, color: '#854d0e' }}>
        🧩 <strong>Extension Chrome non détectée</strong> — Installez-la pour ajouter des recettes depuis n'importe quel site.{' '}
        <a href="https://github.com/lio2pins/KesKonMange/tree/main/extension"
          target="_blank" rel="noreferrer"
          style={{ color: '#854d0e', fontWeight: 600 }}>
          Voir les instructions →
        </a>
      </div>
      <button onClick={() => { localStorage.setItem('ext-dismissed', '1'); setDismissed(true) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#854d0e' }}>
        ✕
      </button>
    </div>
  )
}


  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
    <ExtensionBanner />
      {/* Header */}
      <div style={{ background: sc.bg, borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: `1px solid ${sc.accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: sc.text }}>
            {seasonData.emoji} KesKonMange
          </h1>
          {view === 'recipes' && (
            <button onClick={() => setShowForm(true)} style={btnStyle(sc.primary)}>+ Nouvelle recette</button>
          )}
        </div>
        {/* Bandeau saison */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: sc.text, textTransform: 'uppercase', opacity: 0.6 }}>
              {seasonData.label} — Fruits
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {seasonData.fruits.map(f => (
                <span key={f} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: sc.primaryLight, color: sc.text }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: sc.text, textTransform: 'uppercase', opacity: 0.6 }}>
              Légumes
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {seasonData.legumes.map(l => (
                <span key={l} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: sc.accent + '55', color: sc.text }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #e2e8f0' }}>
        {[['dashboard', '📅 Tableau de bord'], ['recipes', '📋 Recettes'], ['history', '📖 Historique']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            color: view === v ? '#0f172a' : '#94a3b8',
            borderBottom: view === v ? '2px solid #0f172a' : '2px solid transparent', marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {/* TABLEAU DE BORD */}
      {view === 'dashboard' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#475569' }}>
              Semaine du {formatDate(weekDates[0])} au {formatDate(weekDates[6])}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {menu && !menu.validated && (
                <button onClick={handleValidateMenu} style={btnStyle('#10b981')}>✅ Valider ce menu</button>
              )}
              {menu?.validated && (
                <span style={{ fontSize: 13, color: '#10b981', padding: '8px 0' }}>✅ Menu validé</span>
              )}
              <button onClick={handleGenerate} disabled={generating} style={btnStyle('#6366f1')}>
                {generating ? '...' : '✨ Générer le menu'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weekDates.map((date, i) => {
              const key = dateKey(date)
              const slot = getSlotForDate(date)
              const isToday = dateKey(new Date()) === key
              const isApero = i === 2
              const isWeekendDay = i === 1

              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isToday ? '#f0fdf4' : '#fff',
                  border: `1px solid ${isToday ? '#86efac' : '#e2e8f0'}`,
                  borderRadius: 10, padding: '12px 16px'
                }}>
                  <div style={{ minWidth: 110 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? '#16a34a' : '#1e293b' }}>
                      {JOURS[i]}
                      {isToday && <span style={{ marginLeft: 6, fontSize: 11, background: '#16a34a', color: '#fff', borderRadius: 10, padding: '1px 7px' }}>Aujourd'hui</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(date)}</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    {isApero ? (
                      <span style={{ fontSize: 14, color: '#a78bfa', fontStyle: 'italic' }}>🥂 Apéro dinatoire</span>
                    ) : slot?.recipe ? (
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{slot.recipe.title}</span>
                    ) : (
                      <span style={{ fontSize: 13, color: '#cbd5e1' }}>— pas encore de recette —</span>
                    )}
                  </div>

                  {/* Actions sur le slot */}
                  {!isApero && slot && (
                    <button onClick={() => setSlotPicker(slot)} style={{
                      background: 'none', border: '1px solid #e2e8f0', borderRadius: 6,
                      padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#64748b'
                    }}>↺ Changer</button>
                  )}

                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: isWeekendDay ? '#ede9fe' : '#f0f9ff',
                    color: isWeekendDay ? '#7c3aed' : '#0284c7'
                  }}>
                    {isWeekendDay ? 'Week-end' : isApero ? '' : 'Semaine'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* RECETTES */}
      {view === 'recipes' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[['all', 'Toutes'], ['a_tester', 'À tester'], ['validee', 'Validées'], ['a_oublier', 'À oublier']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{
                border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: filter === val ? '#1e293b' : '#f1f5f9', color: filter === val ? '#fff' : '#475569'
              }}>{label}</button>
            ))}
          </div>
          {recipes.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 48 }}>Aucune recette ici.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recipes.map(r => (
              <div key={r.id} onClick={() => setSelected(r)} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                    {r.type === 'weekend' ? `Week-end · ${r.weekendCategory}` : 'Semaine'} · {r.totalMinutes} min
                  </div>
                </div>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status], fontWeight: 500 }}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      {view === 'history' && (
        <div>
          {history.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: 48 }}>Aucun menu validé pour l'instant.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(week => {
              const start = new Date(week.weekStart)
              const end = new Date(start)
              end.setDate(start.getDate() + 6)
              return (
                <div key={week.id} onClick={() => setHistorySelected(historySelected?.id === week.id ? null : week)}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        Semaine du {formatDate(start)} au {formatDate(end)}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {week.slots.filter(s => s.recipe).length} recettes
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                      {historySelected?.id === week.id ? '▲' : '▼'}
                    </span>
                  </div>

                  {historySelected?.id === week.id && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px 16px 12px' }}>
                      {week.slots.map((slot, i) => {
                        const slotDate = new Date(slot.slotDate)
                        const isApero = i === 2
                        return (
                          <div key={slot.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < 6 ? '1px solid #f8fafc' : 'none', alignItems: 'center' }}>
                            <div style={{ minWidth: 100, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                              {JOURS[i]} {formatDate(slotDate)}
                            </div>
                            <div style={{ fontSize: 13 }}>
                              {isApero
                                ? <span style={{ color: '#a78bfa', fontStyle: 'italic' }}>🥂 Apéro dinatoire</span>
                                : slot.recipe
                                  ? slot.recipe.title
                                  : <span style={{ color: '#cbd5e1' }}>—</span>
                              }
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal slot picker */}
      {slotPicker && (
        <Overlay onClick={() => setSlotPicker(null)}>
          <div style={{ ...modalStyle, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, fontSize: 17 }}>Choisir une recette</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {validatedRecipes.map(r => (
                <div key={r.id} onClick={() => handleSlotChange(slotPicker.id, r.id)}
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                  <span style={{ fontWeight: 500 }}>{r.title}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{r.totalMinutes} min</span>
                </div>
              ))}
              {validatedRecipes.length === 0 && <p style={{ color: '#94a3b8' }}>Aucune recette validée disponible.</p>}
            </div>
            <button onClick={() => setSlotPicker(null)} style={{ ...btnStyle('#94a3b8'), marginTop: 16 }}>Annuler</button>
          </div>
        </Overlay>
      )}

      {/* Modal détail recette */}
      {selected && (
        <Overlay onClick={() => setSelected(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{selected.title}</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>{selected.type === 'weekend' ? `Week-end · ${selected.weekendCategory}` : 'Semaine'} · {selected.totalMinutes} min</p>
            {selected.sourceUrl && <p style={{ fontSize: 13 }}><a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceUrl}</a></p>}
            <Section label="Ingrédients" text={selected.ingredients} />
            <Section label="Étapes" text={selected.steps} />
            {selected.notes && <Section label="Notes" text={selected.notes} />}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {selected.status === 'a_tester' && <>
                <button onClick={() => updateStatus(selected.id, 'validee')} style={btnStyle('#10b981')}>✅ Valider</button>
                <button onClick={() => updateStatus(selected.id, 'a_oublier')} style={btnStyle('#ef4444')}>❌ À oublier</button>
              </>}
              <button onClick={() => deleteRecipe(selected.id)} style={btnStyle('#ef4444')}>🗑 Supprimer</button>
              <button onClick={() => setSelected(null)} style={btnStyle('#94a3b8')}>Fermer</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Modal ajout recette */}
      {showForm && (
        <Overlay onClick={() => setShowForm(false)}>
          <div style={{ ...modalStyle, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Nouvelle recette</h2>
            <Field label="Titre *" value={form.title} onChange={v => setForm({ ...form, title: v })} />
            <Field label="Ingrédients" value={form.ingredients} onChange={v => setForm({ ...form, ingredients: v })} multi />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                  <option value="semaine">Semaine</option>
                  <option value="weekend">Week-end</option>
                </select>
              </div>
              {form.type === 'weekend' && (
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={form.weekendCategory} onChange={e => setForm({ ...form, weekendCategory: e.target.value })} style={inputStyle}>
                    <option value="">--</option>
                    <option value="entree">Entrée</option>
                    <option value="plat">Plat</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Temps (min)</label>
                <input type="number" value={form.totalMinutes} onChange={e => setForm({ ...form, totalMinutes: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </div>
            </div>
            <Field label="Étapes" value={form.steps} onChange={v => setForm({ ...form, steps: v })} multi />
            <Field label="Source (URL)" value={form.sourceUrl} onChange={v => setForm({ ...form, sourceUrl: v })} />
            <Field label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} multi />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSubmit} style={btnStyle('#10b981')}>Ajouter</button>
              <button onClick={() => setShowForm(false)} style={btnStyle('#94a3b8')}>Annuler</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

function Overlay({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      {children}
    </div>
  )
}

function Section({ label, text }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: '#1e293b' }}>{text}</div>
    </div>
  )
}

function Field({ label, value, onChange, multi }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      {multi
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />}
    </div>
  )
}

const btnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500
})
const modalStyle = {
  background: '#fff', borderRadius: 14, padding: 24,
  width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto'
}
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box'
}
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4
}
