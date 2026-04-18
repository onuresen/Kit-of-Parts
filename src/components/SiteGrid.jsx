import { useState } from 'react'
import { Grid, Html, Edges } from '@react-three/drei'
import { useKit } from './KitContext'

const COLS = 5
const ROWS = 5
const SPACING = 5.5

function getPresetColor(presetId, partId, parts, presets) {
  const preset = presets.find(p => p.id === presetId)
  const part = parts.find(p => p.id === partId)
  if (!part) return '#888'
  const idx = preset?.variants?.[partId] ?? 0
  return part.variants[idx]?.color ?? '#888'
}

function cellPos(col, row) {
  return [
    (col - Math.floor(COLS / 2)) * SPACING,
    (row - Math.floor(ROWS / 2)) * SPACING,
  ]
}

function MiniBuilding({ presetId, col, row }) {
  const { parts, presets } = useKit()
  const [cx, cz] = cellPos(col, row)
  const preset = presets.find(p => p.id === presetId)

  return (
    <group position={[cx, 0, cz]} scale={[0.48, 0.48, 0.48]}>
      {parts && parts.map(part => {
        const variantIdx = preset?.variants?.[part.id] ?? 0
        const color = part.variants[variantIdx]?.color ?? '#888'
        const isWire = part.wire ?? false
        const isTrans = part.transparent ?? false

        return (
          <mesh key={part.id} position={part.pos} castShadow={!isWire} receiveShadow={!isWire}>
            {part.shape === 'cylinder' ? (
              <cylinderGeometry args={part.cylinderArgs || [part.size[0]/2, part.size[0]/2, part.size[1], 32]} />
            ) : (
              <boxGeometry args={part.size} />
            )}
            <meshStandardMaterial 
              color={color} 
              transparent={isTrans || isWire} 
              opacity={isWire ? 0.07 : isTrans ? 0.5 : 1}
              depthWrite={!isWire} 
            />
            {isWire && <Edges color={color} />}
          </mesh>
        )
      })}
    </group>
  )
}

function GridCell({ col, row, placed, onPlace, onRemove, selectedUnitType }) {
  const { presets } = useKit()
  const [hovered, setHovered] = useState(false)
  const [cx, cz] = cellPos(col, row)
  const cw = SPACING - 0.6
  const presetLabel = presets.find(p => p.id === selectedUnitType)?.label ?? selectedUnitType

  return (
    <group position={[cx, 0, cz]}>
      {/* Cell border outline */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[cw, 0.01, cw]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color={placed ? '#888' : hovered ? '#3498db' : '#ccc'} />
      </mesh>

      {/* Hover highlight */}
      {hovered && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cw, cw]} />
          <meshBasicMaterial
            color={placed ? '#e74c3c' : '#3498db'}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Invisible click target */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); placed ? onRemove(col, row) : onPlace(col, row, selectedUnitType) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[cw, cw]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {hovered && (
        <Html position={[0, placed ? 1.8 : 0.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: placed ? 'rgba(231,76,60,0.92)' : 'rgba(52,152,219,0.92)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: '700',
            fontFamily: "'Segoe UI', sans-serif",
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>
            {placed ? '✕ Remove' : `+ ${presetLabel}`}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function SiteGrid({ placedUnits, onPlace, onRemove, selectedUnitType }) {
  return (
    <group>
      <Grid
        position={[0, -0.01, 0]}
        args={[COLS * SPACING, ROWS * SPACING]}
        cellSize={SPACING}
        cellThickness={1}
        cellColor="#d0d0d0"
        sectionSize={COLS * SPACING}
        sectionThickness={2}
        sectionColor="#aaa"
        fadeDistance={80}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const placed = placedUnits.find(u => u.col === col && u.row === row)
          return (
            <GridCell
              key={`${col}-${row}`}
              col={col}
              row={row}
              placed={!!placed}
              onPlace={onPlace}
              onRemove={onRemove}
              selectedUnitType={selectedUnitType}
            />
          )
        })
      )}

      {placedUnits.map(unit => (
        <MiniBuilding
          key={`${unit.col}-${unit.row}`}
          presetId={unit.presetId}
          col={unit.col}
          row={unit.row}
        />
      ))}
    </group>
  )
}
