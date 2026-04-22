import {
  MousePointer2, Pencil, Scissors, Copy, Trash2,
  Ruler, BarChart3, Map, Undo2, Redo2, Layers, Play, Zap,
  Moon, Sun, Keyboard, HardHat, Clapperboard, Camera, Activity
} from 'lucide-react'
import ShareButton from './ShareButton'

export default function Toolbar({
  exploded, onToggleExplode,
  builderMode, onToggleBuilderMode,
  sectionCutActive, onToggleSectionCut,
  showDimensions, onToggleDimensions,
  showMetrics, onToggleMetrics,
  siteMode, onToggleSiteMode,
  sequenceMode, onToggleSequence,
  gameMode, onStartGame,
  selected,
  onDuplicate, onDelete,
  darkMode, onToggleDark, onToggleShortcuts,
  onUndo, onRedo, canUndo, canRedo,
  showCrane, onToggleCrane,
  onShare, shareMetrics,
  cinematicMode, onToggleCinematic,
  showEarthquake, onToggleEarthquake,
}) {
  const isSelectMode = !builderMode && !siteMode && !sequenceMode && !gameMode

  function handleSelectMode() {
    if (builderMode) onToggleBuilderMode()
    if (siteMode) onToggleSiteMode()
    if (sequenceMode) onToggleSequence()
  }

  return (
    <div className="toolbar">

      <div className="toolbar-group">
        <button
          className={`tb-btn ${isSelectMode ? 'tb-btn--active' : ''}`}
          title="Select"
          onClick={handleSelectMode}
        >
          <MousePointer2 size={15} />
        </button>
        <button
          className={`tb-btn ${builderMode ? 'tb-btn--active' : ''}`}
          title="Builder Mode"
          onClick={onToggleBuilderMode}
          disabled={siteMode || sequenceMode || gameMode}
        >
          <Pencil size={15} />
        </button>
        <button
          className={`tb-btn ${sectionCutActive ? 'tb-btn--active' : ''}`}
          title="Section Cut"
          onClick={onToggleSectionCut}
          disabled={siteMode || gameMode}
        >
          <Scissors size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className="tb-btn"
          title="Duplicate selected part"
          onClick={onDuplicate}
          disabled={!selected || !builderMode}
        >
          <Copy size={15} />
        </button>
        <button
          className="tb-btn"
          title="Delete selected part"
          onClick={onDelete}
          disabled={!selected || !builderMode}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className={`tb-btn ${showDimensions ? 'tb-btn--active' : ''}`}
          title="Dimension Overlay"
          onClick={onToggleDimensions}
          disabled={siteMode || gameMode}
        >
          <Ruler size={15} />
        </button>
        <button
          className={`tb-btn ${showMetrics ? 'tb-btn--active' : ''}`}
          title="Metrics (Cost · Carbon · BOM)"
          onClick={onToggleMetrics}
          disabled={gameMode}
        >
          <BarChart3 size={15} />
        </button>
        <button
          className={`tb-btn ${siteMode ? 'tb-btn--active' : ''}`}
          title="Site Plan"
          onClick={onToggleSiteMode}
          disabled={sequenceMode || builderMode || gameMode}
        >
          <Map size={15} />
        </button>
        <button
          className={`tb-btn ${sequenceMode ? 'tb-btn--active' : ''}`}
          title="Assembly Sequence"
          onClick={onToggleSequence}
          disabled={siteMode || gameMode}
        >
          <Layers size={15} />
        </button>
        <button
          className={`tb-btn ${showCrane ? 'tb-btn--active' : ''}`}
          title="Tower Crane"
          onClick={onToggleCrane}
          disabled={siteMode || gameMode}
        >
          <HardHat size={15} />
        </button>
        <button
          className={`tb-btn ${showEarthquake ? 'tb-btn--active' : ''}`}
          title="Earthquake Simulation"
          onClick={onToggleEarthquake}
          disabled={gameMode}
        >
          <Activity size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button className="tb-btn" title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={15} />
        </button>
        <button className="tb-btn" title="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo}>
          <Redo2 size={15} />
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className={`tb-btn tb-btn--text ${exploded ? 'tb-btn--active' : ''}`}
          title="Explode / Assemble"
          onClick={onToggleExplode}
          disabled={sequenceMode || siteMode || gameMode}
        >
          <Zap size={13} />
          {exploded ? 'ASSEMBLE' : 'EXPLODE'}
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className="tb-btn tb-btn--game"
          title="Assembly Challenge Game"
          onClick={onStartGame}
          disabled={gameMode}
        >
          <Play size={13} />
          GAME
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className={`tb-btn tb-btn--text ${cinematicMode ? 'tb-btn--active' : ''}`}
          title="Cinematic demo tour"
          onClick={onToggleCinematic}
          disabled={gameMode || builderMode}
        >
          <Clapperboard size={13} />
          DEMO
        </button>
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <ShareButton shareMetrics={shareMetrics} onShare={onShare} disabled={gameMode} />
      </div>

      <div className="toolbar-sep" />

      <div className="toolbar-group">
        <button
          className="tb-btn"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onToggleDark}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          className="tb-btn"
          title="Keyboard shortcuts (?)"
          onClick={onToggleShortcuts}
        >
          <Keyboard size={15} />
        </button>
      </div>

    </div>
  )
}
