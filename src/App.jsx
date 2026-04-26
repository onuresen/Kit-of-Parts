import { useState, useEffect, useRef } from 'react'
import Scene from './components/Scene'
import InfoPanel from './components/InfoPanel'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import MetricsPanel from './components/MetricsPanel'
import GameScorePanel from './components/GameScorePanel'
import ShortcutsModal from './components/ShortcutsModal'
import ViewCube from './components/ViewCube'
import CranePanel from './components/CranePanel'
import EarthquakePanel from './components/EarthquakePanel'
import FloorPlanPanel from './components/FloorPlanPanel'
import { useKit } from './components/KitContext'
import './App.css'

export default function App() {
  const { parts, presets, isLoading, duplicatePart, removePart, undo, redo, canUndo, canRedo } = useKit()

  const [exploded, setExploded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [visible, setVisible] = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [activePreset, setActivePreset] = useState(null)

  useEffect(() => {
    if (parts && parts.length > 0) {
      setVisible(Object.fromEntries(parts.map(p => [p.id, true])))
      setSelectedVariants(Object.fromEntries(parts.map(p => [p.id, 0])))
      setSelected(null)
      setActivePreset(null)
    }
  }, [parts])

  const [sequenceMode, setSequenceMode] = useState(false)
  const [sequenceStep, setSequenceStep] = useState(0)

  const [showMetrics, setShowMetrics] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)

  const [sectionCutActive, setSectionCutActive] = useState(false)
  const [sectionCutY, setSectionCutY] = useState(3.5)

  const [envSettings, setEnvSettings] = useState({ grass: true, time: 12, clouds: false, stars: false, kenGrid: false })

  const [siteMode, setSiteMode] = useState(false)
  const [placedUnits, setPlacedUnits] = useState([])
  const [selectedUnitType, setSelectedUnitType] = useState(null)

  const [builderMode, setBuilderMode] = useState(false)
  const [cameraCmd, setCameraCmd] = useState(null)

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ic-dark') === 'true')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCrane, setShowCrane] = useState(false)
  const [showCraneRadius, setShowCraneRadius] = useState(false)
  const [cinematicMode, setCinematicMode] = useState(false)
  const rendererRef = useRef(null)

  // ── Gantt / schedule ─────────────────────────────────────
  const [highlightedWeek, setHighlightedWeek] = useState(null)

  // ── Multi-crane ──────────────────────────────────────────
  const [showSecondCrane, setShowSecondCrane] = useState(false)
  const [secondCraneX, setSecondCraneX] = useState(-8)

  // ── Wind arrows ──────────────────────────────────────────
  const [showWindArrows, setShowWindArrows] = useState(false)
  const [windSpeed, setWindSpeed] = useState(8.0)

  // ── Water simulation ─────────────────────────────────────
  const [showWaterSim, setShowWaterSim] = useState(false)

  // ── Floor plan ───────────────────────────────────────────
  const [showFloorPlan, setShowFloorPlan] = useState(false)

  // ── Mobile panel toggles ─────────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── Earthquake ───────────────────────────────────────────
  const [showEarthquake, setShowEarthquake] = useState(false)
  const [earthquakeMagnitude, setEarthquakeMagnitude] = useState(6.0)
  const [isShaking, setIsShaking] = useState(false)
  const [hasShaken, setHasShaken] = useState(false)

  const currentPartWeight = (() => {
    if (!sequenceMode || !parts || sequenceStep <= 0) return 0
    const sorted = [...parts].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
    const part = sorted[sequenceStep - 1]
    if (!part) return 0
    const variantIdx = selectedVariants[part.id] ?? 0
    return part.variants[variantIdx]?.weight_kg ?? 0
  })()

  useEffect(() => {
    localStorage.setItem('ic-dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (presets && presets.length > 0 && !selectedUnitType) {
      setSelectedUnitType(presets[0].id)
    }
  }, [presets, selectedUnitType])

  // ── Game mode ───────────────────────────────────────────
  const [gameMode, setGameMode] = useState(false)
  const [gamePhase, setGamePhase] = useState('idle')
  const [gameStep, setGameStep] = useState(1)
  const [gameMistakes, setGameMistakes] = useState(0)
  const [gameElapsed, setGameElapsed] = useState(0)
  const gameStartTimeRef = useRef(null)

  useEffect(() => {
    if (gamePhase !== 'playing') return
    gameStartTimeRef.current = Date.now()
    const interval = setInterval(() => {
      setGameElapsed(Date.now() - gameStartTimeRef.current)
    }, 100)
    return () => clearInterval(interval)
  }, [gamePhase])

  // ── Global keyboard shortcuts ─────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === '?') { setShowShortcuts(s => !s); return }
      if (e.key === 'Escape') { setShowShortcuts(false); setSelected(null); return }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
      if (e.key === 'e' || e.key === 'E') { setExploded(v => !v); setSequenceMode(false) }
      if (e.key === 'd' || e.key === 'D') setShowDimensions(v => !v)
      if (e.key === 'm' || e.key === 'M') setShowMetrics(v => !v)
      if (e.key === 'x' || e.key === 'X') setSectionCutActive(v => !v)
      if (e.key === 'b' || e.key === 'B') toggleBuilderMode()
      if (e.key === '1') handleCameraPreset('front')
      if (e.key === '2') handleCameraPreset('top')
      if (e.key === '3') handleCameraPreset('right')
      if (e.key === '0') handleCameraPreset('home')
      if (e.key === 's' || e.key === 'S') {
        if (builderMode) setBuilderMode(false)
        if (siteMode) setSiteMode(false)
        if (sequenceMode) { setSequenceMode(false); setSequenceStep(0) }
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [builderMode, siteMode, sequenceMode])

  // ── Handlers ─────────────────────────────────────────────
  function togglePart(id) {
    setVisible(v => ({ ...v, [id]: !v[id] }))
    setActivePreset(null)
  }

  function setVariant(partId, variantIdx) {
    setSelectedVariants(v => ({ ...v, [partId]: variantIdx }))
    setActivePreset(null)
  }

  function applyPreset(preset) {
    const defaultVariants = Object.fromEntries(parts.map(p => [p.id, 0]))
    const defaultVisible = Object.fromEntries(parts.map(p => [p.id, true]))
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
  function stepForward() { setSequenceStep(s => Math.min(s + 1, maxStep)) }
  function stepBack() { setSequenceStep(s => Math.max(s - 1, 0)) }

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

  function handleCameraPreset(preset) {
    setCameraCmd({ type: 'preset', preset, ts: Date.now() })
  }

  function handleFramePart({ pos, size }) {
    setCameraCmd({ type: 'frame', pos, size, ts: Date.now() })
  }

  function handleDuplicate() {
    if (selected) duplicatePart(selected.id)
  }

  function handleDelete() {
    if (selected) {
      removePart(selected.id)
      setSelected(null)
    }
  }

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
    setShowMetrics(false)
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
      setGameElapsed(Date.now() - gameStartTimeRef.current)
      setGamePhase('complete')
      setGameStep(nextStep)
    } else {
      setGameStep(nextStep)
    }
  }

  // ── Earthquake ───────────────────────────────────────────
  function handleShake() {
    if (isShaking) return
    setIsShaking(true)
    setHasShaken(false)
    const duration = (earthquakeMagnitude * 0.35 + 1) * 1000
    setTimeout(() => {
      setIsShaking(false)
      setHasShaken(true)
    }, duration)
  }

  // ── Share / screenshot ───────────────────────────────────
  const shareMetrics = (() => {
    if (!parts) return { carbon: 0, casbee: 'A', cost: '$0', parts: 0 }
    const activeParts = parts.filter(p => visible[p.id])
    const totalCarbon = activeParts.reduce((s, p) => {
      const v = p.variants[selectedVariants[p.id] ?? 0]
      return s + (v?.carbon_kgco2e ?? 0)
    }, 0)
    const totalCost = activeParts.reduce((s, p) => {
      const v = p.variants[selectedVariants[p.id] ?? 0]
      return s + (v?.unit_cost_usd ?? 0) + (v?.labor_cost_usd ?? 0)
    }, 0)
    const carbonPerM2 = totalCarbon / 16
    const casbee = carbonPerM2 <= 200 ? 'S' : carbonPerM2 <= 350 ? 'A' : carbonPerM2 <= 500 ? 'B+' : carbonPerM2 <= 700 ? 'B-' : 'C'
    return {
      carbon: Math.round(totalCarbon),
      casbee,
      cost: `$${Math.round(totalCost).toLocaleString()}`,
      parts: activeParts.length,
    }
  })()

  async function handleShare() {
    if (!rendererRef.current) return
    const gl = rendererRef.current
    const src = gl.domElement.toDataURL('image/png')

    const img = new Image()
    img.src = src
    await new Promise(r => { img.onload = r })

    const W = img.width, H = img.height
    const cvs = document.createElement('canvas')
    cvs.width = W; cvs.height = H
    const ctx = cvs.getContext('2d')
    ctx.drawImage(img, 0, 0)

    const pad = Math.round(W * 0.018)
    const bW = Math.round(W * 0.42)
    const bH = Math.round(H * 0.13)
    const bX = pad, bY = H - bH - pad, rr = 10

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(bX + rr, bY); ctx.lineTo(bX + bW - rr, bY)
    ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + rr)
    ctx.lineTo(bX + bW, bY + bH - rr)
    ctx.quadraticCurveTo(bX + bW, bY + bH, bX + bW - rr, bY + bH)
    ctx.lineTo(bX + rr, bY + bH)
    ctx.quadraticCurveTo(bX, bY + bH, bX, bY + bH - rr)
    ctx.lineTo(bX, bY + rr)
    ctx.quadraticCurveTo(bX, bY, bX + rr, bY)
    ctx.closePath()
    ctx.fillStyle = 'rgba(20,24,36,0.88)'
    ctx.fill()
    ctx.restore()

    const fs1 = Math.round(bH * 0.28), fs2 = Math.round(bH * 0.22), fs3 = Math.round(bH * 0.18)
    ctx.font = `700 ${fs1}px "Segoe UI",system-ui,sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Kit-of-Parts', bX + pad, bY + bH * 0.34)

    ctx.font = `500 ${fs2}px "Segoe UI",system-ui,sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText(
      `${shareMetrics.carbon} kg CO₂e · CASBEE ${shareMetrics.casbee} · ${shareMetrics.cost} · ${shareMetrics.parts} parts`,
      bX + pad, bY + bH * 0.7
    )

    ctx.font = `400 ${fs3}px "Segoe UI",system-ui,sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText('onuresen47.github.io/Kit-of-Parts', bX + pad, bY + bH * 0.92)

    const link = document.createElement('a')
    link.download = 'kit-of-parts.png'
    link.href = cvs.toDataURL('image/png')
    link.click()

    const caption = `Designed with Kit-of-Parts — open-source 3D modular building configurator.

📐 ${shareMetrics.parts} prefab components
♻️ ${shareMetrics.carbon} kg CO₂e embodied carbon · CASBEE rank ${shareMetrics.casbee}
💰 ${shareMetrics.cost} all-in

Built in React + Three.js with real-time cost, carbon & IFC export.

🔗 Try it live: https://onuresen47.github.io/Kit-of-Parts/`

    try { await navigator.clipboard.writeText(caption) } catch { /* clipboard unavailable */ }
  }

  if (isLoading || !parts || parts.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', background: '#2c3e50' }}>
        Loading Kit...
      </div>
    )
  }

  return (
    <div id="root-container" data-theme={darkMode ? 'dark' : 'light'}>

      <Toolbar
        exploded={exploded}
        onToggleExplode={() => { setExploded(v => !v); setSequenceMode(false) }}
        builderMode={builderMode}
        onToggleBuilderMode={toggleBuilderMode}
        sectionCutActive={sectionCutActive}
        onToggleSectionCut={() => setSectionCutActive(v => !v)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions(v => !v)}
        showMetrics={showMetrics}
        onToggleMetrics={() => setShowMetrics(v => !v)}
        siteMode={siteMode}
        onToggleSiteMode={toggleSiteMode}
        sequenceMode={sequenceMode}
        onToggleSequence={toggleSequenceMode}
        gameMode={gameMode}
        onStartGame={startGame}
        selected={selected}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
        onToggleShortcuts={() => setShowShortcuts(v => !v)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        showCrane={showCrane}
        onToggleCrane={() => setShowCrane(v => !v)}
        showEarthquake={showEarthquake}
        onToggleEarthquake={() => { setShowEarthquake(v => !v); setHasShaken(false) }}
        showWindArrows={showWindArrows}
        onToggleWindArrows={() => setShowWindArrows(v => !v)}
        showWaterSim={showWaterSim}
        onToggleWaterSim={() => setShowWaterSim(v => !v)}
        onShowFloorPlan={() => setShowFloorPlan(true)}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen(v => !v)}
        onShare={handleShare}
        shareMetrics={shareMetrics}
        cinematicMode={cinematicMode}
        onToggleCinematic={() => setCinematicMode(v => !v)}
      />

      <Sidebar
        visible={visible}
        onToggle={togglePart}
        selected={selected}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        selectedVariants={selectedVariants}
        activePreset={activePreset}
        onApplyPreset={applyPreset}
        siteMode={siteMode}
        placedUnits={placedUnits}
        selectedUnitType={selectedUnitType}
        onSelectUnitType={setSelectedUnitType}
        gameMode={gameMode}
        gamePhase={gamePhase}
        gameStep={gameStep}
        gameMistakes={gameMistakes}
        gameElapsed={gameElapsed}
        maxStep={maxStep}
        onExitGame={exitGame}
        builderMode={builderMode}
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
        cameraCmd={cameraCmd}
        onFramePart={handleFramePart}
        showCrane={showCrane}
        showCraneRadius={showCraneRadius}
        currentPartWeight={currentPartWeight}
        isShaking={isShaking}
        earthquakeMagnitude={earthquakeMagnitude}
        highlightedWeek={highlightedWeek}
        showSecondCrane={showSecondCrane}
        secondCraneX={secondCraneX}
        showWindArrows={showWindArrows}
        windSpeed={windSpeed}
        showWaterSim={showWaterSim}
        onRendererReady={gl => { rendererRef.current = gl }}
        cinematicMode={cinematicMode}
        onCinematicEnd={() => setCinematicMode(false)}
        onSetExploded={setExploded}
        onSetSequenceMode={setSequenceMode}
        onSetSequenceStep={setSequenceStep}
        onSetShowMetrics={setShowMetrics}
        maxStep={maxStep}
      />

      <InfoPanel
        selected={selected}
        selectedVariants={selectedVariants}
        onVariantChange={setVariant}
        sequenceMode={sequenceMode}
        sequenceStep={sequenceStep}
        maxStep={maxStep}
        onStepForward={stepForward}
        onStepBack={stepBack}
        sectionCutActive={sectionCutActive}
        sectionCutY={sectionCutY}
        onSectionCutY={setSectionCutY}
        envSettings={envSettings}
        setEnvSettings={setEnvSettings}
        gameMode={gameMode}
      />

      {showMetrics && (
        <MetricsPanel
          selectedVariants={selectedVariants}
          visible={visible}
          onClose={() => setShowMetrics(false)}
          onVariantChange={setVariant}
          highlightedWeek={highlightedWeek}
          onHighlightWeek={w => setHighlightedWeek(w)}
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

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showCrane && (
        <CranePanel
          sequenceMode={sequenceMode}
          sequenceStep={sequenceStep}
          currentPartWeight={currentPartWeight}
          showRadius={showCraneRadius}
          onToggleRadius={() => setShowCraneRadius(v => !v)}
          onWindChange={setWindSpeed}
          showSecondCrane={showSecondCrane}
          onToggleSecondCrane={() => setShowSecondCrane(v => !v)}
          secondCraneX={secondCraneX}
          onSecondCraneX={setSecondCraneX}
        />
      )}

      {showEarthquake && (
        <EarthquakePanel
          magnitude={earthquakeMagnitude}
          onMagnitude={setEarthquakeMagnitude}
          isShaking={isShaking}
          onShake={handleShake}
          hasShaken={hasShaken}
          selectedVariants={selectedVariants}
        />
      )}

      {showFloorPlan && (
        <FloorPlanPanel
          visible={visible}
          showKenGrid={envSettings.kenGrid}
          onClose={() => setShowFloorPlan(false)}
        />
      )}

      <ViewCube onPreset={handleCameraPreset} darkMode={darkMode} />

    </div>
  )
}
