import { useState } from 'react'
import { useKit } from './KitContext'
import { TYPE_COLOR } from './Connection'

const CONN_TYPES = ['bolted', 'dry-fit', 'welded', 'adhesive', 'damper', 'base-isolation']

export default function InfoPanel({
  selected, selectedVariants, onVariantChange,
  sequenceMode, sequenceStep, maxStep, onStepForward, onStepBack,
  sectionCutActive, sectionCutY, onSectionCutY,
  envSettings, setEnvSettings,
  gameMode,
}) {
  const { parts, addConnection, removeConnection: removeConn } = useKit()
  const [addingConn, setAddingConn] = useState(false)
  const [newConn, setNewConn] = useState({ to: '', type: 'bolted', hardware: '' })

  if (gameMode) return null

  const part = selected ? parts.find(p => p.id === selected.id) : null
  const activeIdx = part ? (selectedVariants[part.id] ?? 0) : 0
  const activeVariant = part ? part.variants[activeIdx] : null

  const otherParts = part ? parts.filter(p => p.id !== part.id) : []
  const connections = part?.connections ?? []

  function removeConnection(connTo) {
    removeConn(part.id, connTo)
  }

  function saveConnection() {
    if (!newConn.to) return
    addConnection(part.id, { ...newConn })
    setAddingConn(false)
    setNewConn({ to: '', type: 'bolted', hardware: '' })
  }

  return (
    <div className="info-panel-right">

      {part ? (
        /* ── Part selected ── */
        <>
          <div className="ipr-part-header" style={{ borderLeftColor: activeVariant.color }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 className="ipr-title">{selected.id}</h3>
              {part.factory_work != null && (
                <span className={`ipr-badge ${part.factory_work ? 'ipr-badge--factory' : 'ipr-badge--site'}`}>
                  {part.factory_work ? 'Factory' : 'Site'}
                </span>
              )}
            </div>
            <p className="ipr-meta">{activeVariant.meta}</p>
          </div>

          {part.variants.length > 1 && (
            <div className="ipr-section">
              <div className="ipr-section-label">Variants</div>
              <div className="info-variants">
                {part.variants.map((v, i) => (
                  <button
                    key={i}
                    className={`variant-btn ${i === activeIdx ? 'variant-btn--active' : ''}`}
                    style={i === activeIdx ? { borderColor: v.color, background: v.color + '22' } : {}}
                    onClick={() => onVariantChange(part.id, i)}
                    title={v.meta}
                  >
                    <span className="variant-swatch" style={{ background: v.color }} />
                    {v.label}
                    {v.lead_time_days != null && (
                      <span className="variant-lead-badge">{v.lead_time_days}d</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ipr-stats">
            <div className="info-stat">
              <span className="info-stat-label">Weight</span>
              <span className="info-stat-value">{activeVariant.weight_kg.toLocaleString()} kg</span>
            </div>
            <div className="info-stat">
              <span className="info-stat-label">Material Cost</span>
              <span className="info-stat-value">${activeVariant.unit_cost_usd.toLocaleString()}</span>
            </div>
            {activeVariant.labor_cost_usd != null && (
              <div className="info-stat">
                <span className="info-stat-label">Labour Cost</span>
                <span className="info-stat-value">${activeVariant.labor_cost_usd.toLocaleString()}</span>
              </div>
            )}
            <div className="info-stat">
              <span className="info-stat-label">CO₂e</span>
              <span className="info-stat-value">{activeVariant.carbon_kgco2e.toLocaleString()} kg</span>
            </div>
            {activeVariant.assembly_time_min != null && (
              <div className="info-stat">
                <span className="info-stat-label">Install Time</span>
                <span className="info-stat-value">{activeVariant.assembly_time_min} min</span>
              </div>
            )}
            {activeVariant.lead_time_days != null && (
              <div className="info-stat">
                <span className="info-stat-label">Lead Time</span>
                <span className="info-stat-value">{activeVariant.lead_time_days} days</span>
              </div>
            )}
          </div>

          <div className="ipr-section">
            <div className="ipr-section-label">Dimensions</div>
            <div className="ipr-dimensions">
              {(part.size[0] * 1000).toFixed(0)} × {(part.size[1] * 1000).toFixed(0)} × {(part.size[2] * 1000).toFixed(0)} mm
              <span className="ipr-dim-sub">W × H × D</span>
            </div>
          </div>

          {activeVariant.dfma_notes && (
            <div className="ipr-section">
              <div className="ipr-section-label">Install Notes</div>
              <div className="ipr-dfma-notes">{activeVariant.dfma_notes}</div>
            </div>
          )}

          {activeVariant.supplier && (
            <div className="ipr-section">
              <div className="ipr-section-label">Supplier</div>
              <div className="ipr-supplier-row">
                <span>{activeVariant.supplier}</span>
                {activeVariant.sku && <span className="ipr-sku">{activeVariant.sku}</span>}
              </div>
            </div>
          )}

          {/* ── Connections ── */}
          <div className="ipr-section">
            <div className="ipr-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Connections</span>
              <button className="conn-add-toggle" onClick={() => { setAddingConn(s => !s); setNewConn({ to: otherParts[0]?.id ?? '', type: 'bolted', hardware: '' }) }}>
                {addingConn ? '✕' : '+'}
              </button>
            </div>

            {connections.length === 0 && !addingConn && (
              <div className="conn-empty">No connections defined</div>
            )}

            {connections.map((conn, i) => {
              const color = TYPE_COLOR[conn.type] ?? '#95a5a6'
              return (
                <div key={i} className="conn-row">
                  <span className="conn-type-dot" style={{ background: color }} />
                  <span className="conn-type-label" style={{ color }}>{conn.type}</span>
                  <span className="conn-arrow">→</span>
                  <span className="conn-target">{conn.to}</span>
                  {conn.hardware && <span className="conn-hardware">{conn.hardware}</span>}
                  <button className="conn-remove" onClick={() => removeConnection(conn.to)} title="Remove connection">✕</button>
                </div>
              )
            })}

            {addingConn && (
              <div className="conn-form">
                <select className="conn-select" value={newConn.to} onChange={e => setNewConn(s => ({ ...s, to: e.target.value }))}>
                  <option value="">— select part —</option>
                  {otherParts.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
                <select className="conn-select" value={newConn.type} onChange={e => setNewConn(s => ({ ...s, type: e.target.value }))}>
                  {CONN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  className="conn-input"
                  type="text"
                  placeholder="Hardware detail (optional)"
                  value={newConn.hardware}
                  onChange={e => setNewConn(s => ({ ...s, hardware: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') saveConnection() }}
                />
                <button className="conn-save" onClick={saveConnection} disabled={!newConn.to}>Add</button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Global settings ── */
        <>
          <div className="ipr-settings-header">
            <span className="ipr-settings-title">Settings</span>
          </div>

          {sequenceMode && (
            <div className="ipr-section">
              <div className="ipr-section-label">Sequence</div>
              <div className="seq-label" style={{ marginBottom: 6 }}>
                {sequenceStep === 0
                  ? 'Press NEXT to start'
                  : `Step ${sequenceStep} / ${maxStep}`}
              </div>
              <div className="btn-row">
                <button className="seq-btn" onClick={onStepBack} disabled={sequenceStep === 0}>← PREV</button>
                <button className="seq-btn" onClick={onStepForward} disabled={sequenceStep === maxStep}>NEXT →</button>
              </div>
            </div>
          )}

          {sectionCutActive && (
            <div className="ipr-section">
              <div className="ipr-section-label">Section Cut</div>
              <div className="section-slider-label">Height: {sectionCutY.toFixed(1)} m <span className="ipr-dim-sub">({Math.round(sectionCutY * 1000)} mm)</span></div>
              <input
                type="range"
                className="section-slider"
                min="-0.5" max="3.5" step="0.05"
                value={sectionCutY}
                onChange={e => onSectionCutY(parseFloat(e.target.value))}
              />
              <div className="section-slider-ends">
                <span>Bottom</span><span>Top</span>
              </div>
            </div>
          )}

          <div className="ipr-section">
            <div className="ipr-section-label">Environment</div>
            <div className="ipr-env-controls">
              <label className="ipr-env-row">
                <span>Grass Floor</span>
                <input type="checkbox" checked={envSettings.grass}
                  onChange={e => setEnvSettings(s => ({ ...s, grass: e.target.checked }))} />
              </label>
              <label className="ipr-env-row">
                <span>Clouds</span>
                <input type="checkbox" checked={envSettings.clouds}
                  onChange={e => setEnvSettings(s => ({ ...s, clouds: e.target.checked }))} />
              </label>
              <label className="ipr-env-row">
                <span>Stars (Night)</span>
                <input type="checkbox" checked={envSettings.stars}
                  onChange={e => setEnvSettings(s => ({ ...s, stars: e.target.checked }))} />
              </label>
              <label className="ipr-env-row">
                <span>Ken Grid (910mm)</span>
                <input type="checkbox" checked={!!envSettings.kenGrid}
                  onChange={e => setEnvSettings(s => ({ ...s, kenGrid: e.target.checked }))} />
              </label>
              <div className="ipr-env-row ipr-env-row--time">
                <span>
                  Time of Day
                  <span className="ipr-time-val">{envSettings.time.toString().padStart(2, '0')}:00</span>
                </span>
                <input type="range" min="0" max="23" step="1"
                  value={envSettings.time}
                  onChange={e => setEnvSettings(s => ({ ...s, time: parseInt(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div className="ipr-hint">Click a part in the scene to inspect</div>
        </>
      )}
    </div>
  )
}
