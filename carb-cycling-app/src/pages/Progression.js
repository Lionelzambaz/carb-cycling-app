import { useState, useEffect, useCallback } from 'react'
import { useMeasurements } from '../hooks/useMeasurements'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import './Progression.css'

const MONTHS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']

function getMonday(offset = 0) {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1 + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(str) {
  const d = new Date(str + 'T12:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="prog-tooltip">
      <div className="prog-tt-date">{fmtDate(label)}</div>
      <div style={{ color: payload[0].color }}>{payload[0].value} {unit}</div>
    </div>
  )
}

export default function Progression() {
  const { fetchAll, saveMeasurement, deleteMeasurement } = useMeasurements()
  const [weekOffset, setWeekOffset] = useState(0)
  const [measurements, setMeasurements] = useState([])
  const [editData, setEditData] = useState({ weight_kg: '', waist_cm: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deletingKey, setDeletingKey] = useState(null)

  const monday = getMonday(weekOffset)
  const weekKey = dateKey(monday)

  const load = useCallback(async () => {
    const data = await fetchAll()
    setMeasurements(data)
  }, [fetchAll])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const entry = measurements.find(m => m.week_start === weekKey)
    setEditData({
      weight_kg: entry?.weight_kg ?? '',
      waist_cm: entry?.waist_cm ?? ''
    })
  }, [weekKey, measurements])

  async function handleDelete(weekStart) {
    setDeletingKey(weekStart)
    await deleteMeasurement(weekStart)
    setDeletingKey(null)
    await load()
  }

  async function handleSave() {
    setSaving(true)
    const payload = {}
    if (editData.weight_kg !== '') payload.weight_kg = parseFloat(editData.weight_kg)
    if (editData.waist_cm !== '') payload.waist_cm = parseFloat(editData.waist_cm)
    await saveMeasurement(weekKey, payload)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    await load()
  }

  const sorted = [...measurements].sort((a, b) => a.week_start.localeCompare(b.week_start))
  const weightData = sorted.filter(m => m.weight_kg != null)
  const waistData = sorted.filter(m => m.waist_cm != null)

  const latestWeight = weightData[weightData.length - 1]
  const firstWeight = weightData[0]
  const prevWeight = weightData[weightData.length - 2]
  const deltaWeightTotal = latestWeight && firstWeight
    ? (latestWeight.weight_kg - firstWeight.weight_kg).toFixed(1)
    : null
  const deltaWeightWeek = latestWeight && prevWeight
    ? (latestWeight.weight_kg - prevWeight.weight_kg).toFixed(1)
    : null

  const latestWaist = waistData[waistData.length - 1]
  const firstWaist = waistData[0]
  const deltaWaistTotal = latestWaist && firstWaist
    ? (latestWaist.waist_cm - firstWaist.waist_cm).toFixed(1)
    : null

  const canSave = editData.weight_kg !== '' || editData.waist_cm !== ''

  return (
    <div className="prog">
      <div className="week-nav">
        <button className="nav-btn" onClick={() => setWeekOffset(w => w - 1)}>← Préc.</button>
        <span className="week-title">Sem. du {monday.getDate()} {MONTHS[monday.getMonth()]}</span>
        <button className="nav-btn" onClick={() => setWeekOffset(w => w + 1)} disabled={false}>Suiv. →</button>
      </div>

      <div className="prog-card">
        <div className="dp-section-label">Mesures de la semaine</div>
        <div className="prog-inputs">
          <div className="prog-field">
            <div className="prog-field-label">Poids</div>
            <div className="prog-input-wrap">
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={editData.weight_kg}
                onChange={e => setEditData(d => ({ ...d, weight_kg: e.target.value }))}
              />
              <span className="prog-unit">kg</span>
            </div>
          </div>
          <div className="prog-field">
            <div className="prog-field-label">Tour de ventre</div>
            <div className="prog-input-wrap">
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={editData.waist_cm}
                onChange={e => setEditData(d => ({ ...d, waist_cm: e.target.value }))}
              />
              <span className="prog-unit">cm</span>
            </div>
          </div>
        </div>
        <button
          className={`save-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={saving || !canSave}
        >
          {saving ? 'Enregistrement...' : saved ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </div>

      {measurements.length === 0 && (
        <div className="empty-state">Aucune mesure pour l'instant. Commence cette semaine !</div>
      )}

      {measurements.length > 0 && (
        <>
          {/* Stats poids */}
          {weightData.length > 0 && (
            <div className="prog-stats-row">
              <div className="prog-stat">
                <div className="ps-val">{latestWeight.weight_kg}<span className="ps-unit"> kg</span></div>
                <div className="ps-label">Poids actuel</div>
              </div>
              <div className="prog-stat">
                <div className="ps-val">{firstWeight.weight_kg}<span className="ps-unit"> kg</span></div>
                <div className="ps-label">Départ</div>
              </div>
              {deltaWeightTotal != null && (
                <div className="prog-stat">
                  <div className={`ps-val ${parseFloat(deltaWeightTotal) < 0 ? 'ps-good' : parseFloat(deltaWeightTotal) > 0 ? 'ps-bad' : ''}`}>
                    {parseFloat(deltaWeightTotal) > 0 ? '+' : ''}{deltaWeightTotal}<span className="ps-unit"> kg</span>
                  </div>
                  <div className="ps-label">Total</div>
                </div>
              )}
              {deltaWeightWeek != null && (
                <div className="prog-stat">
                  <div className={`ps-val ${parseFloat(deltaWeightWeek) < 0 ? 'ps-good' : parseFloat(deltaWeightWeek) > 0 ? 'ps-bad' : ''}`}>
                    {parseFloat(deltaWeightWeek) > 0 ? '+' : ''}{deltaWeightWeek}<span className="ps-unit"> kg</span>
                  </div>
                  <div className="ps-label">Δ semaine</div>
                </div>
              )}
            </div>
          )}

          {weightData.length >= 2 && (
            <div className="prog-chart-section">
              <div className="dp-section-label">Évolution du poids</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week_start" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={(props) => <CustomTooltip {...props} unit="kg" />} />
                  <Line type="monotone" dataKey="weight_kg" stroke="#7c6af7" strokeWidth={2} dot={{ r: 4, fill: '#7c6af7', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats ventre */}
          {waistData.length > 0 && (
            <div className="prog-stats-row">
              <div className="prog-stat">
                <div className="ps-val">{latestWaist.waist_cm}<span className="ps-unit"> cm</span></div>
                <div className="ps-label">Tour de ventre</div>
              </div>
              <div className="prog-stat">
                <div className="ps-val">{firstWaist.waist_cm}<span className="ps-unit"> cm</span></div>
                <div className="ps-label">Départ</div>
              </div>
              {deltaWaistTotal != null && (
                <div className="prog-stat">
                  <div className={`ps-val ${parseFloat(deltaWaistTotal) < 0 ? 'ps-good' : parseFloat(deltaWaistTotal) > 0 ? 'ps-bad' : ''}`}>
                    {parseFloat(deltaWaistTotal) > 0 ? '+' : ''}{deltaWaistTotal}<span className="ps-unit"> cm</span>
                  </div>
                  <div className="ps-label">Total</div>
                </div>
              )}
            </div>
          )}

          {waistData.length >= 2 && (
            <div className="prog-chart-section">
              <div className="dp-section-label">Tour de ventre</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={waistData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week_start" tickFormatter={fmtDate} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={(props) => <CustomTooltip {...props} unit="cm" />} />
                  <Line type="monotone" dataKey="waist_cm" stroke="#4ade80" strokeWidth={2} dot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Historique */}
          <div className="prog-history">
            <div className="dp-section-label" style={{ marginBottom: '8px' }}>Historique</div>
            {sorted.slice().reverse().map(m => (
              <div key={m.week_start} className="prog-history-row">
                <span className="phr-date">{fmtDate(m.week_start)}</span>
                {m.weight_kg != null && <span className="phr-val phr-weight">{m.weight_kg} kg</span>}
                {m.waist_cm != null && <span className="phr-val phr-waist">{m.waist_cm} cm</span>}
                <button
                  className="phr-delete"
                  onClick={() => handleDelete(m.week_start)}
                  disabled={deletingKey === m.week_start}
                >
                  {deletingKey === m.week_start ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
