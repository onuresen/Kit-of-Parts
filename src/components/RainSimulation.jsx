import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_FALL = 80
const MAX_PUDDLES = 20
const GRAVITY = 0.018
const dummy = new THREE.Object3D()

function makeParticle() {
  return { x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, active: false, pooled: false }
}

export default function RainSimulation({ parts, visible }) {
  const fallRef = useRef()
  const puddleRef = useRef()
  const particles = useRef(Array.from({ length: MAX_FALL }, makeParticle))
  const puddles = useRef([])
  const spawnTimer = useRef(0)

  useFrame((_, delta) => {
    if (!parts || !visible) return
    spawnTimer.current += delta

    // Build emitters from roof face centres of visible parts
    const emitters = []
    for (const p of parts) {
      if (!visible[p.id]) continue
      const [px, py, pz] = p.pos
      const [W, H, D] = p.size
      emitters.push({ x: px, y: py + H / 2, z: pz, W, D })
    }
    if (emitters.length === 0) return

    // Spawn ~3 particles every 50ms
    if (spawnTimer.current > 0.05) {
      spawnTimer.current = 0
      let spawned = 0
      for (let i = 0; i < MAX_FALL && spawned < 3; i++) {
        const p = particles.current[i]
        if (!p.active) {
          const em = emitters[Math.floor(Math.random() * emitters.length)]
          p.x = em.x + (Math.random() - 0.5) * em.W * 0.85
          p.y = em.y + 0.15
          p.z = em.z + (Math.random() - 0.5) * em.D * 0.85
          p.vx = (Math.random() - 0.5) * 0.03
          p.vy = -0.05
          p.vz = (Math.random() - 0.5) * 0.03
          p.active = true
          p.pooled = false
          spawned++
        }
      }
    }

    // Integrate gravity and check landing
    for (const p of particles.current) {
      if (!p.active || p.pooled) continue
      p.vy -= GRAVITY * delta * 60
      p.x += p.vx
      p.y += p.vy
      p.z += p.vz

      // Find highest surface below this particle (ground or part top)
      let landY = 0
      for (const part of parts) {
        if (!visible[part.id]) continue
        const [bx, by, bz] = part.pos
        const [W, H, D] = part.size
        const topY = by + H / 2
        if (
          topY > landY &&
          p.x > bx - W / 2 && p.x < bx + W / 2 &&
          p.z > bz - D / 2 && p.z < bz + D / 2
        ) {
          landY = topY
        }
      }

      if (p.y <= landY) {
        p.y = landY
        p.pooled = true
        // Accumulate into nearest puddle zone or start a new one
        const existing = puddles.current.find(
          pu => Math.abs(pu.x - p.x) < 0.6 && Math.abs(pu.z - p.z) < 0.6
        )
        if (existing) {
          existing.count = Math.min(existing.count + 1, 30)
        } else if (puddles.current.length < MAX_PUDDLES) {
          puddles.current.push({ x: p.x, z: p.z, y: landY + 0.01, count: 1 })
        }
      }

      if (p.y < -3) p.active = false
    }

    // Update falling drop instances
    if (fallRef.current) {
      let idx = 0
      for (const p of particles.current) {
        if (p.active && !p.pooled) {
          dummy.position.set(p.x, p.y, p.z)
          dummy.rotation.set(0, 0, 0)
          dummy.scale.setScalar(1)
          dummy.updateMatrix()
          fallRef.current.setMatrixAt(idx++, dummy.matrix)
        }
      }
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      for (let i = idx; i < MAX_FALL; i++) fallRef.current.setMatrixAt(i, dummy.matrix)
      fallRef.current.instanceMatrix.needsUpdate = true
    }

    // Update puddle disc instances
    if (puddleRef.current) {
      const list = puddles.current
      for (let i = 0; i < MAX_PUDDLES; i++) {
        if (i < list.length) {
          const pu = list[i]
          const s = Math.min(pu.count * 0.08, 1.4)
          dummy.position.set(pu.x, pu.y, pu.z)
          dummy.rotation.set(-Math.PI / 2, 0, 0)
          dummy.scale.setScalar(s)
          dummy.updateMatrix()
          puddleRef.current.setMatrixAt(i, dummy.matrix)
        } else {
          dummy.scale.setScalar(0)
          dummy.updateMatrix()
          puddleRef.current.setMatrixAt(i, dummy.matrix)
        }
      }
      puddleRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={fallRef} args={[null, null, MAX_FALL]} frustumCulled={false}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} />
      </instancedMesh>
      <instancedMesh ref={puddleRef} args={[null, null, MAX_PUDDLES]} frustumCulled={false}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
