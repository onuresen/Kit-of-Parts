import { useState, useEffect, useRef } from 'react'
import Scene from './components/Scene'
import InfoPanel from './components/InfoPanel'
import Sidebar from './components/Sidebar'
import BOMPanel from './components/BOMPanel'
import EstimatorPanel from './components/EstimatorPanel'
import GameScorePanel from './components/GameScorePanel'
import CarbonPanel from './components/CarbonPanel'
import EnvPanel from './components/EnvPanel'
import { useKit } from './components/KitContext'
import './App.css'

export default function App() {
  const { parts, presets, isLoading } = useKit()
  // ── Existing state ──────────────────────────────────────
  const [exploded, setExploded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [visible, setVisible] = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [activePreset, setActivePreset] = useState(null)

  useEffect(() => {
    if (parts && parts.length > 0) {
      setVisible(Object.fromEntries(parts.map((p) => [p.id, true])))
      setSelectedVariants(Object.fromEntries(parts.map((p) => [p.id, 0])))
      setSelected(null)
      setActivePreset(null)
    }
  }, [parts])

  const [sequenceMode, setSequenceMode] = useState(false)
  const [sequenceStep, setSequenceStep] = useState(0)

  const [showBOM, setShowBOM] = useState(false)
  const [showEstimator, setShowEstimator] = useState(false)
  const [showCarbon, setShowCarbon] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)

  const [sectionCutActive, setSectionCutActive] = useState(false)
  const [sectionCutY, setSectionCutY] = useState(3.5)

  // ── Environment Settings ─────────────────────────────────
  const [showEnv, setShowEnv] = useState(false)
  const [envSettings, setEnvSettings] = useState({
    grass: true,
    time: 12,
    clouds: false,
    stars: false
  })

  // ── Site mode ───────────────────────────────────────────
  const [siteMode, setSiteMode] = useState(false)
  const [placedUnits, setPlacedUnits] = useState([])
  const [selectedUnitType, setSelectedUnitType] = useState(null)

  // ── Builder mode ─────────────────────────────────────────
  const [builderMode, setBuilderMode] = useState(false)

  useEffect(() => {
    if (presets && presets.length > 0 && !selectedUnitType) {
      setSelectedUnitType(presets[0].id)
    }
  }, [presets, selectedUnitType])

  // ── Game mode ───────────────────────────────────────────
  const [gameMode, setGameMode] = useState(false)
  const [gamePhase, setGamePhase] = useState('idle') // 'idle' | 'playing' | 'complete'
  const [gameStep, setGameStep] = useState(1)
  const [gameMistakes, setGameMistakes] = useState(0)
  const [gameElapsed, setGameElapsed] = useState(0)
  const gameStartTimeRef = useRef(null)

  // Live timer while playing
  useEffect(() => {
    if (gamePhase !== 'playing') return
    gameStartTimeRef.current = Date.now()
    const interval = setInterval(() => {
      setGameElapsed(Date.now() - gameStartTimeRef.current)
    }, 100)
    return () => clearInterval(interval)
  }, [gamePhase])

  // ── Existing handlers ────────────────────────────────────
  function togglePart(id) {
    setVisible((v) => ({ ...v, [id]: !v[id] }))
    setActivePreset(null)
  }

  function setVariant(partId, variantIdx) {
    setSelectedVariants((v) => ({ ...v, [partId]: variantIdx }))
    setActivePreset(null)
  }

  function applyPreset(preset) {
    const defaultVariants = Object.fromEntries(parts.map((p) => [p.id, 0]))
    const defaultVisible = Object.fromEntries(parts.map((p) => [p.id, true]))
    setSelectedVariants({ ...defaultVariants, ...preset.variants })
    setVisible({ ...defaultVisible, ...preset.visible })
    setActivePreset(preset.id)
    setSelected(null)
  }

  function toggleSequenceMode() {
    if (sequenceMode) {
      setSequenceMode(false)
      setSequenceStep(0)
      setExploded(false)
    } else {
      setSequenceMode(true)
      setSequenceStep(0)
      setExploded(false)
    }
  }

  const maxStep = parts ? parts.length : 0

  function stepForward() { setSequenceStep((s) => Math.min(s + 1, maxStep)) }
  function stepBack() { setSequenceStep((s) => Math.max(s - 1, 0)) }

  // ── Site mode handlers ───────────────────────────────────
  function toggleSiteMode() {
    if (!siteMode) {
      setExploded(false)
      setSequenceMode(false)
      setSequenceStep(0)
      setGameMode(false)
      setGamePhase('idle')
    }
    setSiteMode(v => !v)
  }

  // ── Builder mode handlers ────────────────────────────────
  function toggleBuilderMode() {
    if (!builderMode) {
      setExploded(false)
      setSequenceMode(false)
      setSequenceStep(0)
      setGameMode(false)
      setGamePhase('idle')
      setSiteMode(false)
    }
    setBuilderMode(v => !v)
    setSelected(null)
  }

  function placeUnit(col, row, presetId) {
    setPlacedUnits(prev => [...prev, { col, row, presetId }])
  }

  function removeUnit(col, row) {
    setPlacedUnits(prev => prev.filter(u => !(u.col === col && u.row === row)))
  }

  // ── Game mode handlers ───────────────────────────────────
  function startGame() {
    setGameMode(true)
    setGamePhase('playing')
    setGameStep(1)
    setGameMistakes(0)
    setGameElapsed(0)
    setExploded(false)
    setSequenceMode(false)
    setSequenceStep(0)
    setSiteMode(false)
    setShowBOM(false)
    setShowEstimator(false)
    setShowCarbon(false)
    setSelected(null)
  }

  function exitGame() {
    setGameMode(false)
    setGamePhase('idle')
    setGameStep(1)
    setGameMistakes(0)
    setGameElapsed(0)
  }

  function handleGameClick({ id, correct }) {
    if (!correct) {
      setGameMistakes(m => m + 1)
      return
    }
    const nextStep = gameStep + 1
    if (nextStep > parts.length) {
      // Capture exact final time before interval stops
      setGameElapsed(Date.now() - gameStartTimeRef.current)
      setGamePhase('complete')
      setGameStep(nextStep)
    } else {
      setGameStep(nextStep)
    }
  }

  if (isLoading || !parts || parts.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: '#2c3e50' }}>Loading Kit...</div>
  }

  return (
    <div id="root-container">
      <Sidebar
        exploded={exploded}
        onToggleExplode={() => { setExploded((v) => !v); setSequenceMode(false) }}
        visible={visible}
        onToggle={togglePart}
        selected={selected}
        selectedVariants={selectedVariants}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
        sequenceMode={sequenceMode}
        onToggleSequence={toggleSequenceMode}
        sequenceStep={sequenceStep}
        maxStep={maxStep}
        onStepForward={stepForward}
        onStepBack={stepBack}
        showBOM={showBOM}
        onToggleBOM={() => setShowBOM((v) => !v)}
        showEstimator={showEstimator}
        onToggleEstimator={() => setShowEstimator((v) => !v)}
        showCarbon={showCarbon}
        onToggleCarbon={() => setShowCarbon((v) => !v)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions((v) => !v)}
        sectionCutActive={sectionCutActive}
        onToggleSectionCut={() => setSectionCutActive((v) => !v)}
        sectionCutY={sectionCutY}
        onSectionCutY={setSectionCutY}
        siteMode={siteMode}
        onToggleSiteMode={toggleSiteMode}
        placedUnits={placedUnits}
        selectedUnitType={selectedUnitType}
        onSelectUnitType={setSelectedUnitType}
        gameMode={gameMode}
        gamePhase={gamePhase}
        gameStep={gameStep}
        gameMistakes={gameMistakes}
        gameElapsed={gameElapsed}
        onStartGame={startGame}
        onExitGame={exitGame}
        builderMode={builderMode}
        onToggleBuilderMode={toggleBuilderMode}
        showEnv={showEnv}
        onToggleEnv={() => setShowEnv(v => !v)}
      />

      <Scene
        builderMode={builderMode}
        selectedPartId={selected?.id}
        isExploded={sequenceMode ? false : exploded}
        visible={visible}
        onSelect={setSelected}
        onClearSelect={() => setSelected(null)}
        selectedVariants={selectedVariants}
        sequenceMode={sequenceMode}
        sequenceStep={sequenceStep}
        showDimensions={showDimensions}
        sectionCutActive={sectionCutActive}
        sectionCutY={sectionCutY}
        siteMode={siteMode}
        placedUnits={placedUnits}
        onPlaceUnit={placeUnit}
        onRemoveUnit={removeUnit}
        selectedUnitType={selectedUnitType}
        gameMode={gameMode}
        gameStep={gameStep}
        onGameClick={handleGameClick}
        envSettings={envSettings}
      />

      {!siteMode && !gameMode && !builderMode && (
        <InfoPanel
          selected={selected}
          selectedVariants={selectedVariants}
          onVariantChange={setVariant}
        />
      )}

      {showBOM && (
        <BOMPanel
          selectedVariants={selectedVariants}
          visible={visible}
          onClose={() => setShowBOM(false)}
        />
      )}

      {showEstimator && (
        <EstimatorPanel
          selectedVariants={selectedVariants}
          visible={visible}
          onClose={() => setShowEstimator(false)}
        />
      )}

      {showCarbon && (
        <CarbonPanel
          selectedVariants={selectedVariants}
          visible={visible}
          onClose={() => setShowCarbon(false)}
        />
      )}

      {showEnv && (
        <EnvPanel
          envSettings={envSettings}
          setEnvSettings={setEnvSettings}
          onClose={() => setShowEnv(false)}
        />
      )}

      {gameMode && gamePhase === 'complete' && (
        <GameScorePanel
          mistakes={gameMistakes}
          elapsed={gameElapsed}
          onPlayAgain={startGame}
          onExit={exitGame}
        />
      )}
    </div>
  )
}
