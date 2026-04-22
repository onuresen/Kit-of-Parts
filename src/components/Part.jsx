import { useRef, useEffect, useState, useMemo, Suspense } from 'react'
import { Edges, Html, TransformControls, useGLTF } from '@react-three/drei'
import { useKit } from './KitContext'
import { gsap } from 'gsap'
import * as THREE from 'three'

function GlbMesh({ url, opacity, transparent, depthWrite, clippingPlanes, isWire, isGhost, emissiveIntensity }) {
  const { scene } = useGLTF(url)

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(obj => {
      if (obj.isMesh) {
        obj.material = Array.isArray(obj.material)
          ? obj.material.map(m => m.clone())
          : obj.material.clone()
      }
    })
    return c
  }, [scene])

  useEffect(() => {
    cloned.traverse(obj => {
      if (!obj.isMesh) return
      obj.castShadow = !isWire && !isGhost
      obj.receiveShadow = true
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach(m => {
        m.transparent = transparent
        m.opacity = opacity
        m.depthWrite = depthWrite
        m.clippingPlanes = clippingPlanes
        m.clipShadows = true
        m.emissiveIntensity = emissiveIntensity
        m.needsUpdate = true
      })
    })
  }, [cloned, opacity, transparent, depthWrite, clippingPlanes, emissiveIntensity, isWire, isGhost])

  return <primitive object={cloned} />
}

export default function Part({
  data,
  isExploded,
  isVisible,
  onSelect,
  onFrame,
  activeVariant,
  sequenceMode,
  sequenceStep,
  sectionCutActive,
  sectionCutY,
  gameMode,
  gameStep,
  onGameClick,
  builderMode,
  isSelected,
  isShaking,
  earthquakeMagnitude,
  highlightedWeek,
}) {
  const meshRef = useRef()
  const { updatePart } = useKit()
  const [hovered, setHovered] = useState(false)
  const [flashState, setFlashState] = useState(null) // null | 'correct' | 'wrong'
  const prevSequenceStep = useRef(-1)

  const color = activeVariant?.color ?? data.variants[0].color
  const isWire = data.wire ?? false
  const isTrans = data.transparent ?? false

  // Ghost = in game mode and not yet placed
  const isGhost = gameMode && data.sequence >= gameStep

  // ── Clipping plane ──────────────────────────────────────
  const clippingPlanes = useMemo(
    () => sectionCutActive ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionCutY)] : [],
    [sectionCutActive, sectionCutY]
  )

  // ── Explode / Assemble animation ────────────────────────
  useEffect(() => {
    if (sequenceMode || gameMode) return
    const target = isExploded ? data.exp : data.pos
    const hasConnections = (data.connections ?? []).length > 0
    gsap.to(meshRef.current.position, {
      x: target[0], y: target[1], z: target[2],
      duration: hasConnections ? 1.4 : 1,
      ease: hasConnections ? 'elastic.out(1, 0.5)' : 'expo.out',
    })
  }, [isExploded, sequenceMode, gameMode])

  // ── Assembly sequence animation ─────────────────────────
  useEffect(() => {
    if (gameMode) return
    if (!sequenceMode) {
      gsap.to(meshRef.current.position, {
        x: data.pos[0], y: data.pos[1], z: data.pos[2],
        duration: 0.6, ease: 'expo.out',
      })
      prevSequenceStep.current = -1
      return
    }

    const mySeq = data.sequence
    if (sequenceStep < mySeq) {
      gsap.set(meshRef.current.position, {
        x: data.exp[0], y: data.exp[1] - 6, z: data.exp[2],
      })
    } else if (sequenceStep === mySeq && prevSequenceStep.current < mySeq) {
      gsap.set(meshRef.current.position, {
        x: data.exp[0], y: data.exp[1], z: data.exp[2],
      })
      gsap.to(meshRef.current.position, {
        x: data.pos[0], y: data.pos[1], z: data.pos[2],
        duration: 1, ease: 'expo.out',
      })
    } else if (sequenceStep > mySeq) {
      gsap.to(meshRef.current.position, {
        x: data.pos[0], y: data.pos[1], z: data.pos[2],
        duration: 0.5, ease: 'expo.out',
      })
    }
    prevSequenceStep.current = sequenceStep
  }, [sequenceMode, sequenceStep, gameMode])

  // ── Game mode positioning ───────────────────────────────
  useEffect(() => {
    if (!gameMode) {
      // Return to assembled when game exits (non-game effects will handle it too,
      // but this ensures a clean reset)
      gsap.to(meshRef.current.position, {
        x: data.pos[0], y: data.pos[1], z: data.pos[2],
        duration: 0.6, ease: 'expo.out',
      })
      return
    }

    if (data.sequence < gameStep) {
      // Already placed: fly to assembled position
      gsap.to(meshRef.current.position, {
        x: data.pos[0], y: data.pos[1], z: data.pos[2],
        duration: 1, ease: 'expo.out',
      })
    } else {
      // Ghost: move to exploded position
      gsap.to(meshRef.current.position, {
        x: data.exp[0], y: data.exp[1], z: data.exp[2],
        duration: 0.6, ease: 'expo.out',
      })
    }
  }, [gameMode, gameStep])

  // ── Earthquake shake ─────────────────────────────────────
  useEffect(() => {
    if (!isShaking || !meshRef.current) return
    const mesh = meshRef.current
    const baseX = mesh.position.x
    const baseZ = mesh.position.z
    const seismicGrade = activeVariant?.seismic_grade ?? 1
    const hasBaseIso = (data.connections ?? []).some(c => c.type === 'base-isolation')
    const isoFactor = hasBaseIso ? 0.15 : 1
    const amplitude = (earthquakeMagnitude ?? 5) * 0.045 * (1 / seismicGrade) * isoFactor
    const cycles = Math.round((earthquakeMagnitude ?? 5) * 4)
    const tl = gsap.timeline({
      onComplete: () => gsap.to(mesh.position, { x: baseX, z: baseZ, duration: 0.4, ease: 'expo.out' }),
    })
    for (let i = 0; i < cycles; i++) {
      const a = (i / cycles) * Math.PI * 4 + Math.random() * 0.5
      tl.to(mesh.position, {
        x: baseX + Math.cos(a) * amplitude * (1 - i / cycles * 0.5),
        z: baseZ + Math.sin(a) * amplitude * (1 - i / cycles * 0.5),
        duration: 0.07, ease: 'none',
      })
    }
    tl.to(mesh.position, { x: baseX, z: baseZ, duration: 0.4, ease: 'expo.out' })
    return () => { tl.kill(); gsap.to(mesh.position, { x: baseX, z: baseZ, duration: 0.2 }) }
  }, [isShaking])

  // ── Pointer cursor ───────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  function triggerFlash(type) {
    setFlashState(type)
    setTimeout(() => setFlashState(null), 600)
  }

  function handleDoubleClick(e) {
    e.stopPropagation()
    onFrame?.({ pos: data.pos, size: data.size })
  }

  function handleClick(e) {
    e.stopPropagation()

    if (gameMode) {
      if (!isGhost) return // clicking already-placed parts does nothing
      const correct = data.sequence === gameStep
      triggerFlash(correct ? 'correct' : 'wrong')
      onGameClick({ id: data.id, correct })
      return
    }

    // Normal mode
    gsap.fromTo(
      meshRef.current.scale,
      { x: 1, y: 1, z: 1 },
      { x: 1.05, y: 1.05, z: 1.05, duration: 0.1, yoyo: true, repeat: 1 }
    )
    onSelect({ ...data, meta: activeVariant?.meta ?? data.variants[0].meta })
  }

  // ── Visibility ───────────────────────────────────────────
  const seqVisible = !sequenceMode || sequenceStep >= data.sequence
  const finalVisible = isVisible && seqVisible

  // ── Material properties ──────────────────────────────────
  const seismicGrade = activeVariant?.seismic_grade ?? 1
  const shakeAtRisk = isShaking && earthquakeMagnitude != null && earthquakeMagnitude > seismicGrade * 2.2
  const partWeek = data.week ?? Math.ceil((data.sequence ?? 1) / 2)
  const isWeekHighlighted = highlightedWeek != null && partWeek === highlightedWeek
  const isWeekDimmed = highlightedWeek != null && partWeek !== highlightedWeek
  const emissive = flashState === 'correct' ? '#2ecc71'
    : flashState === 'wrong' ? '#e74c3c'
    : shakeAtRisk ? '#e74c3c'
    : isWeekHighlighted ? '#3498db'
    : color
  const emissiveIntensity = flashState ? 1.5 : shakeAtRisk ? 0.8 : isWeekHighlighted ? 0.5 : (hovered && !isGhost ? 0.25 : 0)
  const opacity = isGhost ? 0.13 : isWeekDimmed ? 0.25 : (isWire ? 0.06 : isTrans ? 0.6 : 1)
  const transparent = isGhost || isWire || isTrans || isWeekDimmed
  const depthWrite = !isGhost && !isWire

  // ── Edges color ──────────────────────────────────────────
  const edgesColor = isGhost
    ? (flashState === 'correct' ? '#2ecc71' : flashState === 'wrong' ? '#e74c3c' : color)
    : (hovered ? '#ffffff' : isWire ? color : 'black')

  // ── Label ────────────────────────────────────────────────
  const showNormalLabel = !gameMode && (hovered || isExploded || (sequenceMode && sequenceStep === data.sequence))
  const showGameLabel = gameMode && ((isGhost && hovered) || flashState !== null)
  const showLabel = showNormalLabel || showGameLabel

  let labelText = data.id
  if (gameMode) {
    if (flashState === 'correct') labelText = `✓ ${data.id}`
    else if (flashState === 'wrong') labelText = '✗ Wrong order!'
    else labelText = '?'
  }

  const labelY = data.size[1] / 2 + 0.25

  function handleTranslateEnd() {
    if (!meshRef.current) return
    const p = meshRef.current.position
    // Update both pos and exp so explode view scales relative to new position
    updatePart(data.id, { pos: [p.x, p.y, p.z], exp: [p.x, p.y + 2, p.z] })
  }

  const [W, H, D] = data.size
  const t = Math.max(0.05, Math.min(W, H) * 0.08)
  const isComposite = data.shape === 'window' || data.shape === 'door'

  const frameMat = {
    color, transparent, opacity, depthWrite,
    emissive, emissiveIntensity,
    clippingPlanes, clipShadows: true,
  }

  const content = data.glb ? (
    <group
      ref={meshRef}
      position={data.pos}
      visible={finalVisible}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      <Suspense fallback={null}>
        <GlbMesh
          url={data.glb}
          opacity={opacity}
          transparent={transparent}
          depthWrite={depthWrite}
          clippingPlanes={clippingPlanes}
          isWire={isWire}
          isGhost={isGhost}
          emissiveIntensity={emissiveIntensity}
        />
      </Suspense>
      {showLabel && (
        <Html position={[0, labelY, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className={`part-label ${flashState === 'correct' ? 'part-label--correct' : flashState === 'wrong' ? 'part-label--wrong' : ''}`}>
            {labelText}
          </div>
        </Html>
      )}
    </group>
  ) : isComposite ? (
    <group
      ref={meshRef}
      position={data.pos}
      visible={finalVisible}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
    >
      {/* top bar */}
      <mesh position={[0, H / 2 - t / 2, 0]} castShadow={!isWire && !isGhost} receiveShadow>
        <boxGeometry args={[W, t, D]} />
        <meshStandardMaterial {...frameMat} />
        <Edges threshold={15} color={edgesColor} />
      </mesh>
      {/* bottom bar */}
      <mesh position={[0, -H / 2 + t / 2, 0]} castShadow={!isWire && !isGhost} receiveShadow>
        <boxGeometry args={[W, t, D]} />
        <meshStandardMaterial {...frameMat} />
        <Edges threshold={15} color={edgesColor} />
      </mesh>
      {/* left bar */}
      <mesh position={[-W / 2 + t / 2, 0, 0]} castShadow={!isWire && !isGhost} receiveShadow>
        <boxGeometry args={[t, H - 2 * t, D]} />
        <meshStandardMaterial {...frameMat} />
        <Edges threshold={15} color={edgesColor} />
      </mesh>
      {/* right bar */}
      <mesh position={[W / 2 - t / 2, 0, 0]} castShadow={!isWire && !isGhost} receiveShadow>
        <boxGeometry args={[t, H - 2 * t, D]} />
        <meshStandardMaterial {...frameMat} />
        <Edges threshold={15} color={edgesColor} />
      </mesh>
      {/* glass or inner panel */}
      {data.shape === 'window' ? (
        <mesh receiveShadow>
          <boxGeometry args={[W - 2 * t, H - 2 * t, D * 0.25]} />
          <meshStandardMaterial
            color="#a8d8ea"
            transparent
            opacity={isGhost ? 0.1 : 0.35}
            depthWrite={false}
            emissive="#a8d8ea"
            emissiveIntensity={hovered ? 0.15 : 0}
            clippingPlanes={clippingPlanes}
            clipShadows
          />
        </mesh>
      ) : (
        <mesh castShadow={!isWire && !isGhost} receiveShadow>
          <boxGeometry args={[W - 2 * t, H - 2 * t, D]} />
          <meshStandardMaterial {...frameMat} />
          <Edges threshold={15} color={edgesColor} />
        </mesh>
      )}
      {showLabel && (
        <Html position={[0, labelY, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className={`part-label ${flashState === 'correct' ? 'part-label--correct' : flashState === 'wrong' ? 'part-label--wrong' : ''}`}>
            {labelText}
          </div>
        </Html>
      )}
    </group>
  ) : (
    <mesh
      ref={meshRef}
      position={data.pos}
      visible={finalVisible}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={() => setHovered(false)}
      castShadow={!isWire && !isGhost}
      receiveShadow
    >
      {data.shape === 'cylinder' ? (
        <cylinderGeometry args={data.cylinderArgs || [data.size[0]/2, data.size[0]/2, data.size[1], 32]} />
      ) : (
        <boxGeometry args={data.size} />
      )}
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        depthWrite={depthWrite}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        clippingPlanes={clippingPlanes}
        clipShadows
      />
      <Edges threshold={15} color={edgesColor} />

      {showLabel && (
        <Html position={[0, labelY, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div className={`part-label ${flashState === 'correct' ? 'part-label--correct' : flashState === 'wrong' ? 'part-label--wrong' : ''}`}>
            {labelText}
          </div>
        </Html>
      )}
    </mesh>
  )

  if (builderMode && isSelected) {
    return (
      <TransformControls mode="translate" translationSnap={0.5} onMouseUp={handleTranslateEnd}>
        {content}
      </TransformControls>
    )
  }

  return content
}
