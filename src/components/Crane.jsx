import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { useKit } from './KitContext'

const CRANE_X = 7
const CRANE_Z = 0
const JIB_Y = 9
const JIB_LEN = 9       // main jib length (constant regardless of offsetX)
const CTR_LEN = 3       // counter-jib length
const JIB_MIN_OFF = -JIB_LEN
const APEX_Y = 10.5
const YELLOW = '#e8a200'
const DARK = '#2d2d2d'

const RATED_MOMENT = 60000
const MAX_CAPACITY = 8000
const MIN_RADIUS   = 2

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

// Sector mesh in XZ plane; angles follow atan2(z, x) convention
function SectorMesh({ cx, cz, radius, startAngle, sweepAngle }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const segs = 48
    const verts = [0, 0, 0]
    for (let i = 0; i <= segs; i++) {
      const a = startAngle + (sweepAngle * i / segs)
      verts.push(radius * Math.cos(a), 0, radius * Math.sin(a))
    }
    const idx = []
    for (let i = 0; i < segs; i++) idx.push(0, i + 1, i + 2)
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [radius, startAngle, sweepAngle])

  return (
    <mesh geometry={geo} position={[cx, 0.05, cz]}>
      <meshBasicMaterial color="#e74c3c" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

export default function Crane({
  sequenceMode, sequenceStep, showRadius, currentPartWeight,
  offsetX = 0, offsetZ = 0,
  liftPlanMode, liftStart, liftEnd,
}) {
  const { parts } = useKit()
  const cx = CRANE_X + offsetX
  const cz = CRANE_Z + offsetZ

  // worldSlew: atan2-convention angle the jib tip points toward. Default π = -X direction.
  const anim = useRef({ trolleyOffset: -0.5, hookY: JIB_Y - 1, worldSlew: Math.PI })
  const jibGroupRef = useRef()
  const trolleyRef  = useRef()
  const hookRef     = useRef()
  const cableRef    = useRef()
  const cableMatRef = useRef()
  const hookMatRef  = useRef()
  const liveRingRef = useRef()

  // ── Sequence mode: move trolley, keep default jib orientation ─
  useEffect(() => {
    gsap.killTweensOf(anim.current)
    gsap.to(anim.current, { worldSlew: Math.PI, duration: 1, ease: 'power2.inOut' })

    if (!sequenceMode || !parts || sequenceStep <= 0) {
      gsap.to(anim.current, { trolleyOffset: -0.5, hookY: JIB_Y - 1, duration: 1.2, ease: 'power2.inOut' })
      return
    }
    const sorted = [...parts].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
    const part = sorted[sequenceStep - 1]
    if (!part) return

    const targetOffset = Math.max(JIB_MIN_OFF, Math.min(-0.5, part.pos[0] - cx))
    const targetY = Math.max(0.5, (part.pos[1] ?? 0) + (part.size?.[1] ?? 1) / 2 + 0.6)

    gsap.to(anim.current, { trolleyOffset: targetOffset, duration: 1.5, ease: 'power2.inOut' })
    gsap.to(anim.current, { hookY: targetY, duration: 1.2, delay: 1.2, ease: 'power2.out' })
    gsap.to(anim.current, { hookY: JIB_Y - 1, duration: 1, delay: 3.5, ease: 'power2.in' })
    gsap.to(anim.current, { trolleyOffset: -0.5, duration: 1.2, delay: 5, ease: 'power2.in' })
  }, [sequenceStep, sequenceMode])

  // ── Lift plan: slew jib to start point, then animate to end ─
  useEffect(() => {
    if (!liftStart) return
    const sa = Math.atan2(liftStart.z - cz, liftStart.x - cx)
    gsap.to(anim.current, { worldSlew: sa, duration: 1.5, ease: 'power2.inOut' })
    if (!liftEnd) return
    const ea = Math.atan2(liftEnd.z - cz, liftEnd.x - cx)
    gsap.to(anim.current, { worldSlew: ea, duration: 2, delay: 1.6, ease: 'power2.inOut' })
  }, [liftStart, liftEnd])

  useFrame(() => {
    const { trolleyOffset, hookY, worldSlew } = anim.current

    // jib group: rotation.y = -(worldSlew + π)  so jib tip (-X) points toward worldSlew angle
    if (jibGroupRef.current) {
      jibGroupRef.current.rotation.y = -(worldSlew + Math.PI)
    }
    if (trolleyRef.current) trolleyRef.current.position.x = trolleyOffset
    if (hookRef.current) {
      hookRef.current.position.x = trolleyOffset
      hookRef.current.position.y = hookY
    }
    if (cableRef.current) {
      const len = Math.max(0.05, JIB_Y - hookY)
      cableRef.current.position.x = trolleyOffset
      cableRef.current.position.y = hookY + len / 2
      cableRef.current.scale.y = len
    }

    const currentRadius = Math.abs(trolleyOffset)
    const capacity = Math.min(MAX_CAPACITY, RATED_MOMENT / Math.max(currentRadius, MIN_RADIUS))
    const weight = currentPartWeight || 0
    const loadPct = weight > 0 ? weight / capacity : 0
    const zoneColor = loadPct >= 0.9 ? C_RED : loadPct >= 0.7 ? C_AMBER : C_GREEN

    if (cableMatRef.current) cableMatRef.current.color.lerp(weight > 0 ? zoneColor : C_CABLE_D, 0.08)
    if (hookMatRef.current)  hookMatRef.current.color.lerp(weight > 0 ? zoneColor : C_HOOK_D, 0.08)
    if (liveRingRef.current) {
      const r = Math.max(0.3, currentRadius)
      liveRingRef.current.scale.set(r, 1, r)
      liveRingRef.current.material.color.copy(weight > 0 ? zoneColor : C_AMBER)
      liveRingRef.current.material.opacity = weight > 0 ? 0.6 : 0.35
    }
  })

  // Sweep arc sector
  let sectorProps = null
  if (liftStart && liftEnd) {
    const sa = Math.atan2(liftStart.z - cz, liftStart.x - cx)
    const ea = Math.atan2(liftEnd.z - cz, liftEnd.x - cx)
    let sweep = ea - sa
    if (sweep < 0) sweep += Math.PI * 2
    sectorProps = { startAngle: sa, sweepAngle: sweep }
  }

  const mainWire = wireGeom(0, APEX_Y, JIB_MIN_OFF, JIB_Y)
  const ctrWire  = wireGeom(0, APEX_Y, CTR_LEN, JIB_Y)

  return (
    <group>
      {/* ── Radius rings (fixed) ────────────────────────── */}
      {showRadius && (
        <group>
          <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[9, 0.06, 8, 64]} />
            <meshBasicMaterial color={YELLOW} transparent opacity={0.35} />
          </mesh>
          <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3, 0.06, 8, 48]} />
            <meshBasicMaterial color="#e74c3c" transparent opacity={0.30} />
          </mesh>
          <Html position={[cx + 3.3, 0.15, cz]} center distanceFactor={10}>
            <div style={LABEL_STYLE}>Counterweight zone — keep clear (3 m)</div>
          </Html>
        </group>
      )}

      {/* ── Lift plan visualizations ────────────────────── */}
      {sectorProps && <SectorMesh cx={cx} cz={cz} radius={JIB_LEN} {...sectorProps} />}
      {liftStart && (
        <mesh position={[liftStart.x, 0.3, liftStart.z]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshBasicMaterial color="#27ae60" transparent opacity={0.9} />
        </mesh>
      )}
      {liftEnd && (
        <mesh position={[liftEnd.x, 0.3, liftEnd.z]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshBasicMaterial color="#3498db" transparent opacity={0.9} />
        </mesh>
      )}

      {/* ── Fixed mast & base ───────────────────────────── */}
      <mesh position={[cx, 0.05, cz]} receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      <mesh position={[cx, JIB_Y / 2, cz]} castShadow>
        <boxGeometry args={[0.4, JIB_Y, 0.4]} />
        <meshStandardMaterial color={YELLOW} />
      </mesh>
      {[1.8, 4.5, 7.2].map(y => (
        <mesh key={y} position={[cx, y, cz]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.55, 0.07, 0.07]} />
          <meshStandardMaterial color={YELLOW} />
        </mesh>
      ))}

      {/* ── Rotating jib group (centered at crane position) ─ */}
      <group ref={jibGroupRef} position={[cx, 0, cz]}>
        {/* Main jib */}
        <mesh position={[JIB_MIN_OFF / 2, JIB_Y, 0]} castShadow>
          <boxGeometry args={[JIB_LEN, 0.22, 0.22]} />
          <meshStandardMaterial color={YELLOW} />
        </mesh>
        {/* Counter-jib */}
        <mesh position={[CTR_LEN / 2, JIB_Y, 0]} castShadow>
          <boxGeometry args={[CTR_LEN, 0.22, 0.22]} />
          <meshStandardMaterial color={YELLOW} />
        </mesh>
        {/* Apex */}
        <mesh position={[0, APEX_Y, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={YELLOW} />
        </mesh>
        {/* Stay wires */}
        <mesh position={mainWire.position} rotation={mainWire.rotation}>
          <boxGeometry args={[mainWire.length, 0.05, 0.05]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        <mesh position={ctrWire.position} rotation={ctrWire.rotation}>
          <boxGeometry args={[ctrWire.length, 0.05, 0.05]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        {/* Counterweight */}
        <mesh position={[CTR_LEN - 0.5, JIB_Y - 0.45, 0]} castShadow>
          <boxGeometry args={[1.5, 0.6, 0.6]} />
          <meshStandardMaterial color="#444" roughness={0.8} />
        </mesh>
        {/* Operator cabin */}
        <mesh position={[0, JIB_Y - 0.55, 0.38]}>
          <boxGeometry args={[0.65, 0.52, 0.28]} />
          <meshStandardMaterial color="#ff6600" transparent opacity={0.85} />
        </mesh>
        {/* Trolley */}
        <mesh ref={trolleyRef} position={[-0.5, JIB_Y - 0.2, 0]}>
          <boxGeometry args={[0.3, 0.18, 0.3]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        {/* Cable */}
        <mesh ref={cableRef} position={[-0.5, JIB_Y - 1, 0]}>
          <boxGeometry args={[0.03, 1, 0.03]} />
          <meshStandardMaterial ref={cableMatRef} color="#222" />
        </mesh>
        {/* Hook */}
        <mesh ref={hookRef} position={[-0.5, JIB_Y - 1, 0]} castShadow>
          <boxGeometry args={[0.2, 0.14, 0.2]} />
          <meshStandardMaterial ref={hookMatRef} color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Live radius ring */}
        <mesh ref={liveRingRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.05, 8, 48]} />
          <meshBasicMaterial color={YELLOW} transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  )
}
