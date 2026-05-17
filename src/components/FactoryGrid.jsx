import { Edges, Grid, Html } from '@react-three/drei'

const BAY_SPACING_X = 4.6
const BAY_SPACING_Z = 4.2
const BAY_COLS = 3

function bayPosition(index) {
  const col = index % BAY_COLS
  const row = Math.floor(index / BAY_COLS)
  return [
    (col - (BAY_COLS - 1) / 2) * BAY_SPACING_X,
    0,
    row * BAY_SPACING_Z - 2.2,
  ]
}

function PartGeometry({ part }) {
  if (part.shape === 'cylinder') {
    return <cylinderGeometry args={part.cylinderArgs || [part.size[0] / 2, part.size[0] / 2, part.size[1], 32]} />
  }
  return <boxGeometry args={part.size} />
}

function FactoryPart({ part, variant, index }) {
  const [x, y, z] = bayPosition(index)
  const scale = Math.min(1, 2.6 / Math.max(part.size[0], part.size[1], part.size[2]))
  const isWire = part.wire ?? false
  const isTrans = part.transparent ?? false
  const bayLabel = `Bay ${String(index + 1).padStart(2, '0')}`

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 3.4]} />
        <meshBasicMaterial color={part.factory_work ? '#d6eaf8' : '#fdebd0'} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[3.8, 0.02, 3.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color={part.factory_work ? '#3498db' : '#f39c12'} />
      </mesh>

      <group position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
        <mesh castShadow receiveShadow>
          <PartGeometry part={part} />
          <meshStandardMaterial
            color={variant?.color ?? '#95a5a6'}
            transparent={isTrans || isWire}
            opacity={isWire ? 0.12 : isTrans ? 0.58 : 1}
            depthWrite={!isWire}
            roughness={0.72}
          />
          <Edges color={isWire ? variant?.color ?? '#95a5a6' : '#26323d'} threshold={15} />
        </mesh>
      </group>

      <Html position={[0, 1.05, -1.45]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="factory-bay-label">
          <span>{bayLabel}</span>
          Seq {part.sequence ?? index + 1}
        </div>
      </Html>
      <Html position={[0, 0.12, 1.58]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="factory-part-label">
          <strong>{part.id}</strong>
          <span>{part.factory_work ? 'Factory fabrication' : 'Site-prep item'}</span>
        </div>
      </Html>
    </group>
  )
}

export default function FactoryGrid({ parts, visible, selectedVariants }) {
  const factoryParts = (parts ?? [])
    .filter(part => visible[part.id])
    .slice()
    .sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))

  const rows = Math.max(1, Math.ceil(factoryParts.length / BAY_COLS))
  const width = BAY_COLS * BAY_SPACING_X + 1.6
  const depth = rows * BAY_SPACING_Z + 1.8

  return (
    <group>
      <Grid
        position={[0, -0.03, (rows - 1) * BAY_SPACING_Z / 2 - 2.2]}
        args={[width, depth]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#cbd5df"
        sectionSize={BAY_SPACING_X}
        sectionThickness={1.5}
        sectionColor="#94a3b8"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <Html position={[0, 1.25, -4.4]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div className="factory-title-label">
          <span>Prefab Factory Layout</span>
          {factoryParts.length} visible parts · sequence order
        </div>
      </Html>

      {factoryParts.map((part, index) => (
        <FactoryPart
          key={part.id}
          part={part}
          variant={part.variants[selectedVariants[part.id] ?? 0]}
          index={index}
        />
      ))}
    </group>
  )
}
