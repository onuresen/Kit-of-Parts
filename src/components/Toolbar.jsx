import {
  MousePointer2, Pencil, Scissors, Copy, Trash2,
  Ruler, BarChart3, Map, Undo2, Redo2, Layers, Play, Zap,
  Moon, Sun, Keyboard, HardHat, Clapperboard, Camera, Activity, Wind, LayoutTemplate,
  Droplets, Menu, X, Flame, Shield, Thermometer, Volume2, Factory
} from 'lucide-react'
import ShareButton from './ShareButton'

export default function Toolbar({
  exploded, onToggleExplode,
  builderMode, onToggleBuilderMode,
  sectionCutActive, onToggleSectionCut,
  showDimensions, onToggleDimensions,
  showMetrics, onToggleMetrics,
  siteMode, onToggleSiteMode,
  factoryMode, onToggleFactoryMode,
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
  showWindArrows, onToggleWindArrows,
  showWaterSim, onToggleWaterSim,
  showThermal, onToggleThermal,
  showAcoustic, onToggleAcoustic,
  onShowFloorPlan,
  fireMode, onToggleFireMode,
  showFireCompartments, onToggleFireCompartments,
  mobileSidebarOpen, onToggleMobileSidebar,
}) {
  const isSelectMode = !builderMode && !siteMode && !factoryMode && !sequenceMode && !gameMode

  function handleSelectMode() {
    if (builderMode) onToggleBuilderMode()
    if (siteMode) onToggleSiteMode()
    if (factoryMode) onToggleFactoryMode()
    if (sequenceMode) onToggleSequence()
  }

  return (
    <div className="toolbar">

      <button
        className={`tb-btn tb-btn--mobile-only ${mobileSidebarOpen ? 'tb-btn--active' : ''}`}
        title="Layers"
        onClick={onToggleMobileSidebar}
      >
        {mobileSidebarOpen ? <X size={15} /> : <Menu size={15} />}
      </button>
      <div className="toolbar-sep tb-sep--mobile-only" />

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
          disabled={siteMode || factoryMode || sequenceMode || gameMode}
        >
          <Pencil size={15} />
        </button>
        <button
          className={`tb-btn ${sectionCutActive ? 'tb-btn--active' : ''}`}
          title="Section Cut"
          onClick={onToggleSectionCut}
          disabled={siteMode || factoryMode || gameMode}
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
          disabled={siteMode || factoryMode || gameMode}
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
          disabled={sequenceMode || builderMode || factoryMode || gameMode}
        >
          <Map size={15} />
        </button>
        <button
          className={`tb-btn ${factoryMode ? 'tb-btn--active' : ''}`}
          title="Prefab Factory Layout"
          onClick={onToggleFactoryMode}
          disabled={sequenceMode || builderMode || siteMode || gameMode}
        >
          <Factory size={15} />
        </button>
        <button
          className={`tb-btn ${sequenceMode ? 'tb-btn--active' : ''}`}
          title="Assembly Sequence"
          onClick={onToggleSequence}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Layers size={15} />
        </button>
        <button
          className={`tb-btn ${showCrane ? 'tb-btn--active' : ''}`}
          title="Tower Crane"
          onClick={onToggleCrane}
          disabled={siteMode || factoryMode || gameMode}
        >
          <HardHat size={15} />
        </button>
        <button
          className={`tb-btn ${showEarthquake ? 'tb-btn--active' : ''}`}
          title="Earthquake Simulation"
          onClick={onToggleEarthquake}
          disabled={factoryMode || gameMode}
        >
          <Activity size={15} />
        </button>
        <button
          className={`tb-btn ${showWindArrows ? 'tb-btn--active' : ''}`}
          title="Wind Load Arrows"
          onClick={onToggleWindArrows}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Wind size={15} />
        </button>
        <button
          className={`tb-btn ${showWaterSim ? 'tb-btn--active' : ''}`}
          title="Water Analysis"
          onClick={onToggleWaterSim}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Droplets size={15} />
        </button>
        <button
          className={`tb-btn ${showThermal ? 'tb-btn--active' : ''}`}
          title="Thermal Bridge Visualizer"
          onClick={onToggleThermal}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Thermometer size={15} />
        </button>
        <button
          className={`tb-btn ${showAcoustic ? 'tb-btn--active' : ''}`}
          title="Acoustic Performance Overlay"
          onClick={onToggleAcoustic}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Volume2 size={15} />
        </button>
        <button
          className="tb-btn"
          title="Floor Plan"
          onClick={onShowFloorPlan}
          disabled={siteMode || factoryMode || gameMode}
        >
          <LayoutTemplate size={15} />
        </button>
        <button
          className={`tb-btn ${fireMode ? 'tb-btn--active' : ''}`}
          title="Fire Spread Simulation"
          onClick={onToggleFireMode}
          disabled={factoryMode || gameMode}
          style={fireMode ? { color: '#e74c3c' } : {}}
        >
          <Flame size={15} />
        </button>
        <button
          className={`tb-btn ${showFireCompartments ? 'tb-btn--active' : ''}`}
          title="Fire Compartment Visualizer"
          onClick={onToggleFireCompartments}
          disabled={siteMode || factoryMode || gameMode}
        >
          <Shield size={15} />
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
          disabled={sequenceMode || siteMode || factoryMode || gameMode}
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
          disabled={gameMode || builderMode || factoryMode}
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
