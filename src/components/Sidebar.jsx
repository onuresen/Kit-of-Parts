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
  exploded, onToggleExplode,
  visible, onToggle,
  selected, selectedVariants,
  activePreset, onApplyPreset,
  sequenceMode, onToggleSequence, sequenceStep, maxStep, onStepForward, onStepBack,
  showBOM, onToggleBOM,
  showEstimator, onToggleEstimator,
  showCarbon, onToggleCarbon,
  showDimensions, onToggleDimensions,
  sectionCutActive, onToggleSectionCut, sectionCutY, onSectionCutY,
  siteMode, onToggleSiteMode, placedUnits, selectedUnitType, onSelectUnitType,
  gameMode, gamePhase, gameStep, gameMistakes, gameElapsed, onStartGame, onExitGame,
  builderMode, onToggleBuilderMode,
  showEnv, onToggleEnv,
}) {
  const { parts, presets, loadKitFromFile } = useKit()

  const currentSequencePart = sequenceMode && sequenceStep > 0
    ? parts.find((p) => p.sequence === sequenceStep)
    : null

  // ── Game HUD mode ────────────────────────────────────────
  if (gameMode) {
    const placedCount = gameStep - 1
    const nextPart = parts.find(p => p.sequence === gameStep)

    return (
      <aside className="sidebar">
        <div className="sidebar-brand">Assembly Challenge</div>

        <div className="game-hud">
          <div className="game-hud-phase">
            {gamePhase === 'complete' ? 'Complete!' : 'Build in order →'}
          </div>

          {/* Progress dots */}
          <div className="game-progress-dots">
            {parts.map((p) => (
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

          {nextPart && gamePhase === 'playing' && (
            <div className="game-hud-hint">
              Click part #{gameStep} in the scene
            </div>
          )}

          <button className="game-exit-btn" onClick={onExitGame}>EXIT GAME</button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">IC Configurator</div>

      {/* ── View Controls ── */}
      <div className="sidebar-section-label">View</div>
      <div className="btn-row">
        <button
          className={`view-btn ${!sequenceMode && !siteMode && exploded ? 'view-btn--active' : ''}`}
          onClick={onToggleExplode}
          disabled={sequenceMode || siteMode}
          title="Explode / Assemble view"
        >
          {exploded && !sequenceMode && !siteMode ? 'ASSEMBLE' : 'EXPLODE'}
        </button>
        <button
          className={`view-btn ${sequenceMode ? 'view-btn--active' : ''}`}
          onClick={onToggleSequence}
          disabled={siteMode}
          title="Step through assembly sequence"
        >
          SEQUENCE
        </button>
      </div>
      <div className="btn-row" style={{ marginTop: 6 }}>
        <button
          className={`view-btn ${siteMode ? 'view-btn--active view-btn--site' : ''}`}
          onClick={onToggleSiteMode}
          disabled={sequenceMode || builderMode}
          title="Site plan layout — place multiple units"
        >
          {siteMode ? 'EXIT SITE' : 'SITE PLAN'}
        </button>
        <button
          className={`view-btn ${builderMode ? 'view-btn--active' : ''}`}
          onClick={onToggleBuilderMode}
          disabled={sequenceMode || siteMode}
          title="Author Kit — construct assemblies visually"
        >
          {builderMode ? 'EXIT BUILDER' : 'BUILDER MODE'}
        </button>
      </div>

      {/* ── Sequence Step Controls ── */}
      {sequenceMode && (
        <div className="sequence-controls">
          <div className="seq-label">
            {sequenceStep === 0
              ? 'Press NEXT to start'
              : currentSequencePart
              ? `Step ${sequenceStep}/${maxStep}: ${currentSequencePart.id}`
              : `Complete (${maxStep}/${maxStep})`}
          </div>
          <div className="btn-row">
            <button className="seq-btn" onClick={onStepBack} disabled={sequenceStep === 0}>← PREV</button>
            <button className="seq-btn" onClick={onStepForward} disabled={sequenceStep === maxStep}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ── Site unit picker ── */}
      {siteMode && (
        <div className="site-controls">
          <div className="sidebar-section-label" style={{ marginTop: 8 }}>Unit Type</div>
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
        </div>
      )}

      <div className="sidebar-divider" />

      {/* ── Presets ── */}
      {!siteMode && (
        <>
          <div className="sidebar-section-label">Presets</div>
          <div className="preset-row">
            {presets.map((preset) => (
              <button
                key={preset.id}
                className={`preset-btn ${activePreset === preset.id ? 'preset-btn--active' : ''}`}
                onClick={() => onApplyPreset(preset)}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="sidebar-divider" />
        </>
      )}

      {/* ── Components ── */}
      {!siteMode && (
        <>
          <div className="sidebar-section-label">Components</div>
          <ul className="parts-list">
            {parts.map((part) => {
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

      {/* ── Kit Definition ── */}
      {!siteMode && (
        <>
          <div className="sidebar-section-label">Configurator</div>
          <div style={{ padding: '0 12px 12px' }}>
            <button className="tool-btn" style={{ width: '100%', position: 'relative' }}>
              LOAD KIT JSON
              <input type="file" accept=".json" onChange={(e) => {
                if (e.target.files.length > 0) loadKitFromFile(e.target.files[0])
              }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
            </button>
          </div>
          <div className="sidebar-divider" />
        </>
      )}

      {/* ── Tools ── */}
      {!siteMode && (
        <>
          <div className="sidebar-section-label">Tools</div>
          <div className="tools-grid">
            <button
              className={`tool-btn ${showBOM ? 'tool-btn--active' : ''}`}
              onClick={onToggleBOM}
              title="Bill of Materials"
            >
              BOM
            </button>
            <button
              className={`tool-btn ${showEstimator ? 'tool-btn--active' : ''}`}
              onClick={onToggleEstimator}
              title="Weight & Cost Estimator"
            >
              COST
            </button>
            <button
              className={`tool-btn ${showDimensions ? 'tool-btn--active' : ''}`}
              onClick={onToggleDimensions}
              title="Dimension Overlay"
            >
              DIMS
            </button>
            <button
              className={`tool-btn ${sectionCutActive ? 'tool-btn--active' : ''}`}
              onClick={onToggleSectionCut}
              title="Section Cut"
            >
              CUT
            </button>
          </div>

          {/* ENVIRONMENT button */}
          <div style={{ marginTop: 5 }}>
            <button
              className={`tool-btn ${showEnv ? 'tool-btn--active' : ''}`}
              style={{ width: '100%' }}
              onClick={onToggleEnv}
              title="Environment settings (Sky, Grass, Weather)"
            >
              ENVIRONMENT
            </button>
          </div>

          {/* CARBON button — full width below the 2×2 grid */}
          <div style={{ marginTop: 5 }}>
            <button
              className={`tool-btn tool-btn--carbon ${showCarbon ? 'tool-btn--active' : ''}`}
              style={{ width: '100%' }}
              onClick={onToggleCarbon}
              title="Embodied Carbon — RIBA 2030 budget tracker"
            >
              CO₂ CARBON
            </button>
          </div>

          {/* GAME button — full width below the 2×2 grid */}
          <div style={{ marginTop: 5 }}>
            <button
              className="tool-btn tool-btn--game"
              style={{ width: '100%' }}
              onClick={onStartGame}
              title="Assembly Challenge — click parts in build order!"
            >
              ▶ ASSEMBLY GAME
            </button>
          </div>
        </>
      )}

      {/* ── Builder Panel ── */}
      {builderMode && (
        <BuilderPanel selected={selected} />
      )}

      {/* ── Section Cut Slider ── */}
      {sectionCutActive && !siteMode && (
        <div className="section-slider-wrap">
          <div className="section-slider-label">Cut height: {sectionCutY.toFixed(1)} m</div>
          <input
            type="range"
            className="section-slider"
            min="-0.5"
            max="3.5"
            step="0.05"
            value={sectionCutY}
            onChange={(e) => onSectionCutY(parseFloat(e.target.value))}
          />
          <div className="section-slider-ends">
            <span>Bottom</span>
            <span>Top</span>
          </div>
        </div>
      )}

      <div className="sidebar-hint">
        {siteMode ? 'Click a cell to place · Click unit to remove' : 'Click a part to inspect'}
      </div>
    </aside>
  )
}
