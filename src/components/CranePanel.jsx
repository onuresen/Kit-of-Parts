import { useState, useEffect, useRef, useMemo } from 'react'
import { useKit } from './KitContext'

const CRANE_X      = 7
const JIB_MIN_X    = -2
const RATED_MOMENT = 60000
const MAX_CAPACITY = 8000
const MIN_RADIUS   = 2

function beaufort(ws) {
  if (ws < 1)  return 0
  if (ws < 3)  return 1
  if (ws < 6)  return 2
  if (ws < 9)  return 3
  if (ws < 12) return 4
  if (ws < 16) return 5
  if (ws < 20) return 6
  return 7
}

const SPECS = [
  ['Jib span',       '9 m'],
  ['Counter-jib',    '3 m'],
  ['Hook height',    '8.5 m'],
  ['Max capacity',   '8 t'],
  ['Rated moment',   '60 t·m'],
]

export default function CranePanel({ sequenceMode, sequenceStep, currentPartWeight, showRadius, onToggleRadius }) {
  const { parts } = useKit()

  // ── Wind simulation ─────────────────────────────────────
  const [windSpeed, setWindSpeed] = useState(8.0)
  const windRef = useRef(8.0)
  useEffect(() => {
    const id = setInterval(() => {
      windRef.current = Math.max(0, Math.min(25, windRef.current + (Math.random() - 0.5) * 0.6))
      setWindSpeed(+(windRef.current.toFixed(1)))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // ── Active lift data ────────────────────────────────────
  const { activeRadius, partName } = useMemo(() => {
    if (!sequenceMode || !parts || sequenceStep <= 0) return { activeRadius: 0, partName: null }
    const sorted = [...parts].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
    const part = sorted[sequenceStep - 1]
    if (!part) return { activeRadius: 0, partName: null }
    const targetX = Math.max(JIB_MIN_X, Math.min(CRANE_X - 0.5, part.pos[0]))
    return {
      activeRadius: +(Math.max(0, CRANE_X - targetX).toFixed(1)),
      partName: part.id,
    }
  }, [parts, sequenceStep, sequenceMode])

  const capacityAtRadius = activeRadius > 0
    ? Math.round(Math.min(MAX_CAPACITY, RATED_MOMENT / Math.max(activeRadius, MIN_RADIUS)))
    : MAX_CAPACITY

  const loadPct   = (capacityAtRadius > 0 && currentPartWeight > 0)
    ? Math.min(1, currentPartWeight / capacityAtRadius) : 0
  const loadPctN  = Math.round(loadPct * 100)
  const loadColor = loadPct >= 0.9 ? '#e74c3c' : loadPct >= 0.7 ? '#f39c12' : '#27ae60'
  const loadLabel = loadPct >= 0.9 ? 'OVERLOAD RISK' : loadPct >= 0.7 ? 'CAUTION' : 'SAFE'

  const windColor = windSpeed > 20 ? '#e74c3c' : windSpeed > 12 ? '#f39c12' : '#27ae60'
  const windLabel = windSpeed > 20 ? 'STOP' : windSpeed > 12 ? 'CAUTION' : 'OK'
  const bf        = beaufort(windSpeed)

  const liftActive = sequenceMode && currentPartWeight > 0

  return (
    <div
      className="metrics-panel"
      style={{ bottom: 20, right: 280, left: 'auto', top: 'auto', width: 290, maxHeight: '80vh', overflow: 'auto' }}
    >
      {/* Header */}
      <div className="metrics-header" style={{ padding: '10px 14px 0' }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e8a200' }}>
          🏗 Tower Crane
        </div>
      </div>

      {/* ── Crane Specs ──────────────────────────────────── */}
      <div className="ipr-section" style={{ padding: '10px 14px' }}>
        <div className="ipr-section-label">Crane Specs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5 }}>
          {SPECS.map(([label, value]) => (
            <div key={label} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', gridColumn: 'span 2' }}>
              <span style={{ color: '#aaa' }}>{label}</span>
              <span style={{ fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current Lift ─────────────────────────────────── */}
      <div className="ipr-section" style={{ padding: '10px 14px' }}>
        <div className="ipr-section-label">Current Lift</div>

        <div className="est-metrics" style={{ padding: '6px 0' }}>
          <div className="est-metric">
            <span className="est-value">{sequenceMode && activeRadius > 0 ? `${activeRadius}` : '—'}</span>
            <span className="est-unit">radius (m)</span>
          </div>
          <div className="est-divider" />
          <div className="est-metric">
            <span className="est-value">{sequenceMode ? `${(capacityAtRadius / 1000).toFixed(1)}t` : '—'}</span>
            <span className="est-unit">capacity</span>
          </div>
          <div className="est-divider" />
          <div className="est-metric">
            <span className="est-value">{currentPartWeight > 0 ? `${(currentPartWeight / 1000).toFixed(1)}t` : '—'}</span>
            <span className="est-unit">{partName ?? 'weight'}</span>
          </div>
        </div>

        {liftActive && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3, color: '#888' }}>
              <span>Load utilisation</span>
              <span style={{ fontWeight: 700, color: loadColor }}>{loadPctN}%</span>
            </div>
            <div style={{ height: 6, background: '#ebebeb', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${loadPctN}%`,
                background: loadColor, borderRadius: 3,
                transition: 'width 0.4s ease, background 0.4s ease',
              }} />
            </div>
            <div style={{ marginTop: 5, textAlign: 'right' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: loadColor,
                background: loadColor + '22', padding: '2px 8px', borderRadius: 10,
              }}>
                {loadLabel}
              </span>
            </div>
          </div>
        )}

        {!liftActive && (
          <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic', marginTop: 4 }}>
            {sequenceMode ? 'No part selected' : 'Enter Sequence mode to see lift data'}
          </div>
        )}
      </div>

      {/* ── Environment ──────────────────────────────────── */}
      <div className="ipr-section" style={{ padding: '10px 14px' }}>
        <div className="ipr-section-label">Environment</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Wind speed</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: windColor }}>{windSpeed} m/s</span>
        </div>
        <div style={{ height: 5, background: '#ebebeb', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (windSpeed / 25) * 100)}%`,
            background: windColor, borderRadius: 3,
            transition: 'width 1.8s ease, background 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
          <span>Beaufort {bf} · EN 14439 limit 20 m/s</span>
          <span style={{
            fontWeight: 700, color: windColor,
            background: windColor + '22', padding: '1px 7px', borderRadius: 10,
          }}>
            {windLabel}
          </span>
        </div>
      </div>

      {/* ── Reach rings toggle ───────────────────────────── */}
      <div style={{ padding: '10px 14px' }}>
        <button
          className={`view-btn ${showRadius ? 'view-btn--active' : ''}`}
          style={{ width: '100%' }}
          onClick={onToggleRadius}
        >
          {showRadius ? 'Hide Reach Rings' : 'Show Reach Rings'}
        </button>
      </div>
    </div>
  )
}
