import { useKit } from './KitContext'

export default function InfoPanel({
  selected, selectedVariants, onVariantChange,
  sequenceMode, sequenceStep, maxStep, onStepForward, onStepBack,
  sectionCutActive, sectionCutY, onSectionCutY,
  envSettings, setEnvSettings,
  gameMode,
}) {
  const { parts } = useKit()

  if (gameMode) return null

  const part = selected ? parts.find(p => p.id === selected.id) : null
  const activeIdx = part ? (selectedVariants[part.id] ?? 0) : 0
  const activeVariant = part ? part.variants[activeIdx] : null

  return (
    <div className="info-panel-right">

      {part ? (
        /* ── Part selected ── */
        <>
          <div className="ipr-part-header" style={{ borderLeftColor: activeVariant.color }}>
            <h3 className="ipr-title">{selected.id}</h3>
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
              <span className="info-stat-label">Unit Cost</span>
              <span className="info-stat-value">${activeVariant.unit_cost_usd.toLocaleString()}</span>
            </div>
            <div className="info-stat">
              <span className="info-stat-label">CO₂e</span>
              <span className="info-stat-value">{activeVariant.carbon_kgco2e.toLocaleString()} kg</span>
            </div>
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
              <div className="section-slider-label">Height: {sectionCutY.toFixed(1)} m</div>
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
