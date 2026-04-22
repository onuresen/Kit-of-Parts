import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { useKit } from './KitContext'

const CRANE_X = 7
const CRANE_Z = 0
const JIB_Y = 9
const JIB_MIN_X = -2
const APEX_Y = 10.5
const YELLOW = '#e8a200'
const DARK = '#2d2d2d'

const RATED_MOMENT = 60000   // kg·m
const MAX_CAPACITY = 8000    // kg
const MIN_RADIUS   = 2       // m

const C_GREEN   = new THREE.Color('#27ae60')
const C_AMBER   = new THREE.Color('#f39c12')
const C_RED     = new THREE.Color('#e74c3c')
const C_CABLE_D = new THREE.Color('#222222')
const C_HOOK_D  = new THREE.Color('#888888')

const LABEL_STYLE = {
  background: 'rgba(231,76,60,0.88)', color: '#fff', fontSize: 10,
  fontFamily: "'Segoe UI',sans-serif", padding: '2px 7px',
  borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap',
  pointerEvents: 'none',
}

function wireGeom(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  return {
    position: [(ax + bx) / 2, (ay + by) / 2, 0],
    rotation: [0, 0, Math.atan2(dy, dx)],
    length: Math.sqrt(dx * dx + dy * dy),
  }
}

export default function Crane({ sequenceMode, sequenceStep, showRadius, currentPartWeight }) {
  const { parts } = useKit()
  const anim = useRef({ trolleyX: CRANE_X, hookY: JIB_Y - 1 })
  const trolleyRef  = useRef()
  const hookRef     = useRef()
  const cableRef    = useRef()
  const cableMatRef = useRef()
  const hookMatRef  = useRef()
  const liveRingRef = useRef()

  useEffect(() => {
    gsap.killTweensOf(anim.current)
    if (!sequenceMode || !parts || sequenceStep <= 0) {
      gsap.to(anim.current, { trolleyX: CRANE_X, hookY: JIB_Y - 1, duration: 1.2, ease: 'power2.inOut' })
      return
    }
    const sorted = [...parts].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
    const part = sorted[sequenceStep - 1]
    if (!part) return

    const targetX = Math.max(JIB_MIN_X, Math.min(CRANE_X - 0.5, part.pos[0]))
    const targetY = Math.max(0.5, (part.pos[1] ?? 0) + (part.size?.[1] ?? 1) / 2 + 0.6)

    gsap.to(anim.current, { trolleyX: targetX, duration: 1.5, ease: 'power2.inOut' })
    gsap.to(anim.current, { hookY: targetY, duration: 1.2, delay: 1.2, ease: 'power2.out' })
    gsap.to(anim.current, { hookY: JIB_Y - 1, duration: 1, delay: 3.5, ease: 'power2.in' })
    gsap.to(anim.current, { trolleyX: CRANE_X, duration: 1.2, delay: 5, ease: 'power2.in' })
  }, [sequenceStep, sequenceMode])

  useFrame(() => {
    const { trolleyX, hookY } = anim.current

    if (trolleyRef.current) trolleyRef.current.position.x = trolleyX
    if (hookRef.current) {
      hookRef.current.position.x = trolleyX
      hookRef.current.position.y = hookY
    }
    if (cableRef.current) {
      const len = Math.max(0.05, JIB_Y - hookY)
      cableRef.current.position.x = trolleyX
      cableRef.current.position.y = hookY + len / 2
      cableRef.current.scale.y = len
    }

    // ── Load colour & live ring ──────────────────────────────
    const currentRadius = Math.max(0, CRANE_X - trolleyX)
    const capacity = Math.min(MAX_CAPACITY, RATED_MOMENT / Math.max(currentRadius, MIN_RADIUS))
    const weight = currentPartWeight || 0
    const loadPct = weight > 0 ? weight / capacity : 0
    const zoneColor = loadPct >= 0.9 ? C_RED : loadPct >= 0.7 ? C_AMBER : C_GREEN

    if (cableMatRef.current) {
      cableMatRef.current.color.lerp(weight > 0 ? zoneColor : C_CABLE_D, 0.08)
    }
    if (hookMatRef.current) {
      hookMatRef.current.color.lerp(weight > 0 ? zoneColor : C_HOOK_D, 0.08)
    }
    if (liveRingRef.current) {
      const r = Math.max(0.3, currentRadius)
      liveRingRef.current.scale.set(r, 1, r)
      liveRingRef.current.material.color.copy(weight > 0 ? zoneColor : C_AMBER)
      liveRingRef.current.material.opacity = weight > 0 ? 0.6 : 0.35
    }
  })

  const mainWire = wireGeom(CRANE_X, APEX_Y, JIB_MIN_X, JIB_Y)
  const ctrWire  = wireGeom(CRANE_X, APEX_Y, CRANE_X + 3, JIB_Y)

  return (
    <group>
      {/* ── Radius rings ───────────────────────────────────── */}
      {showRadius && (
        <group>
          {/* Jib reach — full 9 m working radius */}
          <mesh position={[CRANE_X, 0.01, CRANE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[9, 0.06, 8, 64]} />
            <meshBasicMaterial color={YELLOW} transparent opacity={0.35} />
          </mesh>

          {/* Counterweight zone — 3 m keep-clear ring */}
          <mesh position={[CRANE_X, 0.01, CRANE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.06, 8, 48]} />
            <meshBasicMaterial color="#e74c3c" transparent opacity={0.30} />
          </mesh>
          <Html position={[CRANE_X + 3.3, 0.15, CRANE_Z]} center distanceFactor={10}>
            <div style={LABEL_STYLE}>Counterweight zone — keep clear (3 m)</div>
          </Html>

          {/* Live radius ring — scales in useFrame */}
          <mesh ref={liveRingRef} position={[CRANE_X, 0.02, CRANE_Z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1, 0.05, 8, 48]} />
            <meshBasicMaterial color={YELLOW} transparent opacity={0.35} />
          </mesh>
        </group>
      )}

      {/* ── Crane structure ────────────────────────────────── */}
      {/* Base plate */}
      <mesh position={[CRANE_X, 0.05, CRANE_Z]} receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color={DARK} />
      </mesh>

      {/* Mast */}
      <mesh position={[CRANE_X, JIB_Y / 2, CRANE_Z]} castShadow>
        <boxGeometry args={[0.4, JIB_Y, 0.4]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>

      {/* Mast cross-braces */}
      {[1.8, 4.5, 7.2].map(y => (
        <mesh key={y} position={[CRANE_X, y, CRANE_Z]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.55, 0.07, 0.07]} />
          <meshStandardMaterial color={YELLOW} />
        </mesh>
      ))}

      {/* Main jib */}
      <mesh position={[(CRANE_X + JIB_MIN_X) / 2, JIB_Y, CRANE_Z]} castShadow>
        <boxGeometry args={[CRANE_X - JIB_MIN_X, 0.22, 0.22]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>

      {/* Counter-jib */}
      <mesh position={[CRANE_X + 1.5, JIB_Y, CRANE_Z]} castShadow>
        <boxGeometry args={[3, 0.22, 0.22]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>

      {/* Apex block */}
      <mesh position={[CRANE_X, APEX_Y, CRANE_Z]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>

      {/* Support wire — main jib */}
      <mesh position={mainWire.position} rotation={mainWire.rotation}>
        <boxGeometry args={[mainWire.length, 0.05, 0.05]} />
        <meshStandardMaterial color={DARK} />
      </mesh>

      {/* Support wire — counter-jib */}
      <mesh position={ctrWire.position} rotation={ctrWire.rotation}>
        <boxGeometry args={[ctrWire.length, 0.05, 0.05]} />
        <meshStandardMaterial color={DARK} />
      </mesh>

      {/* Counterweight */}
      <mesh position={[CRANE_X + 2.5, JIB_Y - 0.45, CRANE_Z]} castShadow>
        <boxGeometry args={[1.5, 0.6, 0.6]} />
        <meshStandardMaterial color="#444" roughness={0.8} />
      </mesh>

      {/* Operator cab */}
      <mesh position={[CRANE_X, JIB_Y - 0.55, CRANE_Z + 0.38]}>
        <boxGeometry args={[0.65, 0.52, 0.28]} />
        <meshStandardMaterial color="#ff6600" transparent opacity={0.85} />
      </mesh>

      {/* Trolley (animated) */}
      <mesh ref={trolleyRef} position={[CRANE_X, JIB_Y - 0.2, CRANE_Z]}>
        <boxGeometry args={[0.3, 0.18, 0.3]} />
        <meshStandardMaterial color={DARK} />
      </mesh>

      {/* Cable (height scaled in useFrame) */}
      <mesh ref={cableRef} position={[CRANE_X, JIB_Y - 1, CRANE_Z]}>
        <boxGeometry args={[0.03, 1, 0.03]} />
        <meshStandardMaterial ref={cableMatRef} color="#222" />
      </mesh>

      {/* Hook (animated) */}
      <mesh ref={hookRef} position={[CRANE_X, JIB_Y - 1, CRANE_Z]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.2]} />
        <meshStandardMaterial ref={hookMatRef} color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}
