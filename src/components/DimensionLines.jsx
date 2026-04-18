import { Html, Line } from '@react-three/drei'

// Draws overall dimension annotations for the assembled building.
// Shows: total width (X), total depth (Z), total height (Y).

const LABEL_STYLE = {
  background: 'rgba(20,30,40,0.82)',
  color: '#fff',
  fontFamily: "'Segoe UI', sans-serif",
  fontSize: '11px',
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: '3px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  letterSpacing: '0.04em',
}

// Overall bounding extents of the assembled model
const X_MIN = -2   // foundation left edge
const X_MAX = 2    // foundation right edge
const Z_MIN = -2   // foundation front edge
const Z_MAX = 2    // foundation back edge
const Y_MIN = -0.25 // bottom of foundation
const Y_MAX = 2.55  // top of interface layer

const DIM_OFFSET = 0.55  // how far outside the model to draw lines

export default function DimensionLines({ selectedVariants }) {
  // Width line — along X, positioned in front (Z = Z_MAX + offset)
  const widthZ = Z_MAX + DIM_OFFSET
  const widthY = Y_MIN

  // Depth line — along Z, positioned to the right (X = X_MAX + offset)
  const depthX = X_MAX + DIM_OFFSET
  const depthY = Y_MIN

  // Height line — along Y, positioned to the right (X = X_MAX + offset)
  const heightX = X_MAX + DIM_OFFSET
  const heightZ = Z_MIN - DIM_OFFSET

  const lineColor = '#3498db'
  const tickLen = 0.12

  return (
    <group>
      {/* ── Width (X axis) ── */}
      <Line
        points={[[X_MIN, widthY, widthZ], [X_MAX, widthY, widthZ]]}
        color={lineColor}
        lineWidth={1.5}
      />
      {/* ticks */}
      <Line points={[[X_MIN, widthY - tickLen, widthZ], [X_MIN, widthY + tickLen, widthZ]]} color={lineColor} lineWidth={1.5} />
      <Line points={[[X_MAX, widthY - tickLen, widthZ], [X_MAX, widthY + tickLen, widthZ]]} color={lineColor} lineWidth={1.5} />
      {/* leader lines from model edge */}
      <Line points={[[X_MIN, widthY, Z_MAX], [X_MIN, widthY, widthZ]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={[[X_MAX, widthY, Z_MAX], [X_MAX, widthY, widthZ]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Html position={[0, widthY, widthZ + 0.18]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div style={LABEL_STYLE}>4000 mm</div>
      </Html>

      {/* ── Depth (Z axis) ── */}
      <Line
        points={[[depthX, depthY, Z_MIN], [depthX, depthY, Z_MAX]]}
        color={lineColor}
        lineWidth={1.5}
      />
      <Line points={[[depthX - tickLen, depthY, Z_MIN], [depthX + tickLen, depthY, Z_MIN]]} color={lineColor} lineWidth={1.5} />
      <Line points={[[depthX - tickLen, depthY, Z_MAX], [depthX + tickLen, depthY, Z_MAX]]} color={lineColor} lineWidth={1.5} />
      <Line points={[[X_MAX, depthY, Z_MIN], [depthX, depthY, Z_MIN]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={[[X_MAX, depthY, Z_MAX], [depthX, depthY, Z_MAX]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Html position={[depthX + 0.18, depthY, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div style={LABEL_STYLE}>4000 mm</div>
      </Html>

      {/* ── Height (Y axis) ── */}
      <Line
        points={[[heightX, Y_MIN, heightZ], [heightX, Y_MAX, heightZ]]}
        color={lineColor}
        lineWidth={1.5}
      />
      <Line points={[[heightX - tickLen, Y_MIN, heightZ], [heightX + tickLen, Y_MIN, heightZ]]} color={lineColor} lineWidth={1.5} />
      <Line points={[[heightX - tickLen, Y_MAX, heightZ], [heightX + tickLen, Y_MAX, heightZ]]} color={lineColor} lineWidth={1.5} />
      <Line points={[[X_MAX, Y_MIN, Z_MIN], [heightX, Y_MIN, heightZ]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Line points={[[X_MAX, Y_MAX, Z_MIN], [heightX, Y_MAX, heightZ]]} color={lineColor} lineWidth={0.8} dashed dashSize={0.08} gapSize={0.06} />
      <Html position={[heightX + 0.18, (Y_MIN + Y_MAX) / 2, heightZ]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div style={LABEL_STYLE}>2800 mm</div>
      </Html>
    </group>
  )
}
