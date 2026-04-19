import { useState } from 'react'
import { useKit } from './KitContext'
import BuilderPanel from './BuilderPanel'

function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeClosed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Sidebar({
  visible, onToggle, selected,
  selectedVariants,
  activePreset, onApplyPreset,
  siteMode, placedUnits, selectedUnitType, onSelectUnitType,
  gameMode, gamePhase, gameStep, gameMistakes, gameElapsed, maxStep, onExitGame,
  builderMode,
}) {
  const { parts, presets, loadKitFromFile, savePreset, removePreset } = useKit()
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  function handleSavePreset() {
    const name = presetName.trim()
    if (!name) return
    savePreset(name, selectedVariants, visible)
    setPresetName('')
    setSavingPreset(false)
  }

  /* ── Game HUD ── */
  if (gameMode) {
    const placedCount = gameStep - 1
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">Assembly Challenge</div>
        <div className="game-hud">
          <div className="game-hud-phase">
            {gamePhase === 'complete' ? 'Complete!' : 'Build in order →'}
          </div>
          <div className="game-progress-dots">
            {parts.map(p => (
              <div
                key={p.id}
                className={`game-dot ${p.sequence < gameStep ? 'game-dot--done' : p.sequence === gameStep ? 'game-dot--current' : ''}`}
                title={p.id}
              />
            ))}
          </div>
          <div className="game-hud-stats">
            <div className="game-hud-stat">
              <span className="game-hud-val">{formatTime(gameElapsed)}</span>
              <span className="game-hud-label">TIME</span>
            </div>
            <div className="game-hud-divider" />
            <div className="game-hud-stat">
              <span className="game-hud-val">{gameMistakes}</span>
              <span className="game-hud-label">MISTAKES</span>
            </div>
            <div className="game-hud-divider" />
            <div className="game-hud-stat">
              <span className="game-hud-val">{placedCount}/{maxStep}</span>
              <span className="game-hud-label">PLACED</span>
            </div>
          </div>
          {gamePhase === 'playing' && (
            <div className="game-hud-hint">Click part #{gameStep} in the scene</div>
          )}
          <button className="game-exit-btn" onClick={onExitGame}>EXIT GAME</button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">IC Configurator</div>

      {/* ── Site unit picker ── */}
      {siteMode && (
        <div className="site-controls">
          <div className="sidebar-section-label">Unit Type</div>
          <div className="preset-row">
            {presets.map(preset => (
              <button
                key={preset.id}
                className={`preset-btn ${selectedUnitType === preset.id ? 'preset-btn--active' : ''}`}
                onClick={() => onSelectUnitType(preset.id)}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="site-unit-count">
            {placedUnits.length} unit{placedUnits.length !== 1 ? 's' : ''} placed &nbsp;·&nbsp; 25 cells
          </div>
          <div className="sidebar-divider" />
        </div>
      )}

      {/* ── Presets ── */}
      {!siteMode && !builderMode && (
        <>
          <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Presets</span>
            <button
              className="preset-save-toggle"
              onClick={() => { setSavingPreset(s => !s); setPresetName('') }}
              title="Save current configuration as a new preset"
            >
              {savingPreset ? '✕' : '+'}
            </button>
          </div>

          {savingPreset && (
            <div className="preset-save-row">
              <input
                className="preset-save-input"
                type="text"
                placeholder="Preset name…"
                value={presetName}
                autoFocus
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSavePreset()
                  if (e.key === 'Escape') { setSavingPreset(false); setPresetName('') }
                }}
              />
              <button
                className="preset-save-confirm"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                Save
              </button>
            </div>
          )}

          <div className="preset-row">
            {presets.map(preset => (
              <div key={preset.id} className="preset-btn-wrap">
                <button
                  className={`preset-btn ${activePreset === preset.id ? 'preset-btn--active' : ''}`}
                  onClick={() => onApplyPreset(preset)}
                  title={preset.description}
                >
                  {preset.label}
                </button>
                {preset.custom && (
                  <button
                    className="preset-delete-btn"
                    onClick={() => removePreset(preset.id)}
                    title="Delete preset"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="sidebar-divider" />
        </>
      )}

      {/* ── Layers / Components ── */}
      {!siteMode && (
        <>
          <div className="sidebar-section-label">Layers</div>
          <ul className="parts-list">
            {parts.map(part => {
              const variantIdx = selectedVariants[part.id] ?? 0
              const activeColor = part.variants[variantIdx].color
              const isActive = selected?.id === part.id
              const isHidden = !visible[part.id]
              return (
                <li
                  key={part.id}
                  className={[
                    'part-item',
                    isActive ? 'part-item--active' : '',
                    isHidden ? 'part-item--hidden' : '',
                  ].join(' ')}
                >
                  <div className="part-swatch" style={{ background: activeColor }} />
                  <span className="part-name">{part.id}</span>
                  <button
                    className="part-toggle"
                    onClick={() => onToggle(part.id)}
                    title={isHidden ? 'Show' : 'Hide'}
                  >
                    {isHidden ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="sidebar-divider" />
        </>
      )}

      {/* ── Builder Panel ── */}
      {builderMode && <BuilderPanel selected={selected} />}

      {/* ── Load Kit ── */}
      {!siteMode && !builderMode && (
        <div style={{ paddingBottom: 12 }}>
          <button className="tool-btn" style={{ width: '100%', position: 'relative' }}>
            LOAD KIT JSON
            <input
              type="file"
              accept=".json"
              onChange={e => { if (e.target.files.length > 0) loadKitFromFile(e.target.files[0]) }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
            />
          </button>
        </div>
      )}

      <div className="sidebar-hint">
        {siteMode ? 'Click a cell to place · Click unit to remove' : 'Click a part to inspect'}
      </div>
    </aside>
  )
}
