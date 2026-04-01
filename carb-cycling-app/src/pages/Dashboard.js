import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useEntries } from '../hooks/useEntries'
import Progression from './Progression'
import './Dashboard.css'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
const SPORTS = ['Musculation', 'Cardio', 'HIIT', 'HIRT', 'Yoga', 'Natation', 'Vélo', 'Course', 'Ski randonnée', 'Repos']
const TYPES = [
  { key: 'normal', label: 'Normal', color: '#7c6af7', bg: 'rgba(124,106,247,0.15)' },
  { key: 'low', label: 'Low carb', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  { key: 'cheat', label: 'Cheat meal', color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  { key: 'fast', label: 'Jeûne', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
]

function getMonday(offset) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { fetchWeek, saveEntry, deleteEntry, loading } = useEntries()
  const [tab, setTab] = useState('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekData, setWeekData] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [editEntry, setEditEntry] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadWeek = useCallback(async () => {
    const mon = getMonday(weekOffset)
    const data = await fetchWeek(mon)
    setWeekData(data)
  }, [weekOffset, fetchWeek])

  useEffect(() => { loadWeek() }, [loadWeek])

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const weekTitle = `${monday.getDate()} ${MONTHS[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`

  function selectDay(k, d) {
    setSelectedDate(k)
    setEditEntry(weekData[k] || { type: 'normal' })
  }

  async function handleSave() {
    setSaving(true)
    await saveEntry(selectedDate, editEntry)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    await loadWeek()
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteEntry(selectedDate)
    setDeleting(false)
    setSelectedDate(null)
    setEditEntry({})
    await loadWeek()
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return { d, k: dateKey(d) }
  })

  const weekEntries = days.map(({ k }) => weekData[k]).filter(Boolean)
  const totalCal = weekEntries.reduce((s, e) => s + (e.cal || 0), 0)
  const totalCarbs = weekEntries.reduce((s, e) => s + (e.carbs || 0), 0)
  const totalProt = weekEntries.reduce((s, e) => s + (e.prot || 0), 0)
  const totalFat = weekEntries.reduce((s, e) => s + (e.fat || 0), 0)
  const sportDays = weekEntries.filter(e => e.sport && e.sport !== 'Repos').length

  const macroTotal = totalCarbs + totalProt + totalFat
  const pieData = macroTotal > 0 ? [
    { name: 'Glucides', value: Math.round((totalCarbs / macroTotal) * 100), color: '#7c6af7' },
    { name: 'Protéines', value: Math.round((totalProt / macroTotal) * 100), color: '#4ade80' },
    { name: 'Lipides', value: Math.round((totalFat / macroTotal) * 100), color: '#fb923c' },
  ] : []

  const hasEntry = selectedDate && weekData[selectedDate]

  function WeekNav({ onPrev, onNext }) {
    return (
      <div className="week-nav">
        <button className="nav-btn" onClick={onPrev}>← Préc.</button>
        <span className="week-title">{weekTitle}</span>
        <button className="nav-btn" onClick={onNext} disabled={false}>Suiv. →</button>
      </div>
    )
  }

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-logo">
          <img src="/carbcycle-icon.svg" alt="CarbCycle" className="dash-logo-img" />
          CarbCycle
        </div>
        <div className="dash-user">
          <span>{user?.email}</span>
          <button onClick={signOut} className="signout-btn">Déconnexion</button>
        </div>
      </header>

      <div className="dash-tabs">
        {['calendar', 'journal', 'summary', 'progression'].map((t, i) => (
          <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {['Calendrier', 'Journal', 'Semaine', 'Progression'][i]}
          </button>
        ))}
      </div>

      <div className="dash-body">
        {/* CALENDRIER */}
        {tab === 'calendar' && (
          <>
            <div className="week-nav">
              <button className="nav-btn" onClick={() => { setWeekOffset(w => w - 1); setSelectedDate(null) }}>← Préc.</button>
              <span className="week-title">{weekTitle}</span>
              <button className="nav-btn" onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(null) }} disabled={false}>Suiv. →</button>
            </div>
            {loading && <div className="loading-bar" />}
            <div className="week-grid">
              {days.map(({ d, k }, i) => {
                const entry = weekData[k]
                const type = entry ? TYPES.find(t => t.key === entry.type) : null
                const isToday = dateKey(new Date()) === k
                const hasSport = entry?.sport && entry.sport !== 'Repos'
                return (
                  <div
                    key={k}
                    className={`day-card ${selectedDate === k ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => selectDay(k, d)}
                  >
                    <div className="dc-day">{DAYS[i]}</div>
                    <div className="dc-num">{d.getDate()}</div>
                    {type && (
                      <div className="dc-badge" style={{ background: type.bg, color: type.color }}>
                        {type.label}
                      </div>
                    )}
                    {!type && <div className="dc-badge dc-empty">—</div>}
                    {hasSport && <div className="dc-sport">{entry.sport}</div>}
                  </div>
                )
              })}
            </div>

            {selectedDate ? (
              <div className="detail-panel">
                <div className="dp-header">
                  <span className="dp-title">
                    {(() => { const d = new Date(selectedDate + 'T12:00:00'); return `${DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} ${MONTHS[d.getMonth()]}` })()}
                  </span>
                  {hasEntry && (
                    <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
                      {deleting ? '…' : 'Supprimer'}
                    </button>
                  )}
                </div>

                <div className="dp-section-label">Type de jour</div>
                <div className="type-selector">
                  {TYPES.map(t => (
                    <button
                      key={t.key}
                      className={`type-btn ${editEntry.type === t.key ? 'active' : ''}`}
                      style={editEntry.type === t.key ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                      onClick={() => setEditEntry(e => ({ ...e, type: t.key }))}
                    >{t.label}</button>
                  ))}
                </div>

                <div className="dp-section-label">Sport du jour</div>
                <div className="sport-selector">
                  {SPORTS.map(s => (
                    <button
                      key={s}
                      className={`sport-btn ${editEntry.sport === s ? 'active' : ''}`}
                      onClick={() => setEditEntry(e => ({ ...e, sport: s }))}
                    >{s}</button>
                  ))}
                  <button
                    className={`sport-btn ${editEntry.sport && !SPORTS.includes(editEntry.sport) ? 'active' : ''}`}
                    onClick={() => { if (SPORTS.includes(editEntry.sport)) setEditEntry(e => ({ ...e, sport: '' })) }}
                  >Autre</button>
                </div>
                {editEntry.sport !== undefined && !SPORTS.includes(editEntry.sport) && (
                  <input
                    type="text"
                    className="autre-sport-input"
                    placeholder="Précise le sport..."
                    value={editEntry.sport || ''}
                    onChange={e => setEditEntry(en => ({ ...en, sport: e.target.value }))}
                    autoFocus
                  />
                )}

                <div className="dp-section-label">Repas</div>
                <div className="meal-grid">
                  {[['meal1', 'Petit-déjeuner', 'Ex: flocons d\'avoine, whey...'],
                    ['meal2', 'Déjeuner', 'Ex: riz, poulet, légumes...'],
                    ['meal3', 'Collation', 'Ex: yaourt grec, amandes...'],
                    ['meal4', 'Dîner', 'Ex: saumon, patate douce...']].map(([id, label, ph]) => (
                    <div key={id}>
                      <div className="meal-label">{label}</div>
                      <textarea
                        rows={2}
                        placeholder={ph}
                        value={editEntry[id] || ''}
                        onChange={e => setEditEntry(en => ({ ...en, [id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="dp-section-label">Macros estimées</div>
                <div className="macro-row">
                  {[['cal', 'Calories'], ['carbs', 'Glucides (g)'], ['prot', 'Protéines (g)'], ['fat', 'Graisses (g)']].map(([id, label]) => (
                    <div key={id} className="macro-wrap">
                      <div className="macro-label">{label}</div>
                      <input
                        type="number"
                        placeholder="0"
                        value={editEntry[id] || ''}
                        onChange={e => setEditEntry(en => ({ ...en, [id]: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>

                <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement...' : saved ? 'Enregistré ✓' : 'Enregistrer'}
                </button>
              </div>
            ) : (
              <div className="empty-panel">Clique sur un jour pour noter ton alimentation et ton sport.</div>
            )}
          </>
        )}

        {/* JOURNAL */}
        {tab === 'journal' && (
          <>
            <WeekNav
              onPrev={() => setWeekOffset(w => w - 1)}
              onNext={() => setWeekOffset(w => w + 1)}
            />
            {loading && <div className="loading-bar" />}
            <div className="journal-list">
              {days.filter(({ k }) => weekData[k]).length === 0 && (
                <div className="empty-state">Aucune entrée cette semaine.</div>
              )}
              {days.filter(({ k }) => weekData[k]).map(({ k }, i) => {
                const entry = weekData[k]
                const type = TYPES.find(t => t.key === entry.type) || TYPES[0]
                const d = new Date(k + 'T12:00:00')
                const label = `${DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
                const meals = [entry.meal1, entry.meal2, entry.meal3, entry.meal4].filter(Boolean).join(' · ') || '—'
                return (
                  <div key={k} className="journal-item">
                    <div className="ji-dot" style={{ background: type.color }} />
                    <div className="ji-body">
                      <div className="ji-meta">
                        {label} · <span style={{ color: type.color }}>{type.label}</span>
                        {entry.sport && ` · ${entry.sport}`}
                      </div>
                      <div className="ji-meals">{meals.length > 100 ? meals.slice(0, 100) + '…' : meals}</div>
                      {entry.cal > 0 && (
                        <div className="ji-macros">{entry.cal} kcal · G:{entry.carbs}g · P:{entry.prot}g · L:{entry.fat}g</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* PROGRESSION */}
        {tab === 'progression' && <Progression />}

        {/* SEMAINE */}
        {tab === 'summary' && (
          <div className="summary">
            <WeekNav
              onPrev={() => setWeekOffset(w => w - 1)}
              onNext={() => setWeekOffset(w => w + 1)}
            />
            {loading && <div className="loading-bar" />}
            <div className="summary-card-full">
              <div className="sc-val">{totalCal.toLocaleString()}</div>
              <div className="sc-label">kcal totales</div>
            </div>
            <div className="summary-grid">
              {[
                { val: `${totalCarbs}g`, label: 'glucides' },
                { val: `${totalProt}g`, label: 'protéines' },
                { val: `${totalFat}g`, label: 'lipides' },
                { val: sportDays, label: 'séances sport' },
              ].map((m, i) => (
                <div key={i} className="summary-card">
                  <div className="sc-val">{m.val}</div>
                  <div className="sc-label">{m.label}</div>
                </div>
              ))}
            </div>
            {pieData.length > 0 && (
              <div className="macro-chart">
                <div className="dp-section-label" style={{ marginBottom: '12px' }}>Répartition des macros</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={90} label={({ name, value }) => `${name} ${value}%`} labelLine={true}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="type-breakdown">
              <div className="dp-section-label" style={{ marginBottom: '12px' }}>Répartition des jours</div>
              {TYPES.map(t => {
                const count = weekEntries.filter(e => e.type === t.key).length
                return (
                  <div key={t.key} className="breakdown-row">
                    <div className="br-dot" style={{ background: t.color }} />
                    <span className="br-label">{t.label}</span>
                    <span className="br-count">{count} jour{count > 1 ? 's' : ''}</span>
                  </div>
                )
              })}
              <div className="breakdown-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div className="br-dot" style={{ background: '#7c6af7' }} />
                <span className="br-label">Jours renseignés</span>
                <span className="br-count">{weekEntries.length} / 7</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
