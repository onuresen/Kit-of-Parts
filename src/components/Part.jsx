import { useRef, useEffect, useState, useMemo } from 'react'
import { Edges, Html, TransformControls } from '@react-three/drei'
import { useKit } from './KitContext'
import { gsap } from 'gsap'
import * as THREE from 'three'

export default function Part({
  data,
  isExploded,
  isVisible,
  onSelect,
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
    gsap.to(meshRef.current.position, {
      x: target[0], y: target[1], z: target[2],
      duration: 1, ease: 'expo.out',
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

  // ── Pointer cursor ───────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  function triggerFlash(type) {
    setFlashState(type)
    setTimeout(() => setFlashState(null), 600)
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
  const emissive = flashState === 'correct' ? '#2ecc71'
    : flashState === 'wrong' ? '#e74c3c'
    : color
  const emissiveIntensity = flashState ? 1.5 : (hovered && !isGhost ? 0.25 : 0)
  const opacity = isGhost ? 0.13 : (isWire ? 0.06 : isTrans ? 0.6 : 1)
  const transparent = isGhost || isWire || isTrans
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

  const content = (
    <mesh
      ref={meshRef}
      position={data.pos}
      visible={finalVisible}
      onClick={handleClick}
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
