import { useKit } from './KitContext'

// Foundation footprint for cost/m² calculation (4m × 4m = 16 m²)
const FOOTPRINT_M2 = 16

export default function EstimatorPanel({ selectedVariants, visible, onClose }) {
  const { parts } = useKit()

  function getVariant(part) {
    const idx = selectedVariants[part.id] ?? 0
    return part.variants[idx]
  }

  const activeParts = parts.filter((p) => visible[p.id])
  const totalWeight = activeParts.reduce((sum, p) => sum + getVariant(p).weight_kg, 0)
  const totalCost = activeParts.reduce((sum, p) => sum + getVariant(p).unit_cost_usd, 0)
  const costPerM2 = Math.round(totalCost / FOOTPRINT_M2)

  return (
    <div className="estimator-panel">
      <div className="est-header">
        <span className="est-title">Cost & Weight</span>
        <button className="est-close" onClick={onClose}>✕</button>
      </div>

      <div className="est-metrics">
        <div className="est-metric">
          <span className="est-value">{totalWeight.toLocaleString()}</span>
          <span className="est-unit">kg total weight</span>
        </div>
        <div className="est-divider" />
        <div className="est-metric">
          <span className="est-value">${totalCost.toLocaleString()}</span>
          <span className="est-unit">estimated cost</span>
        </div>
        <div className="est-divider" />
        <div className="est-metric">
          <span className="est-value">${costPerM2.toLocaleString()}</span>
          <span className="est-unit">per m² ({FOOTPRINT_M2} m²)</span>
        </div>
      </div>

      <div className="est-breakdown">
        {activeParts.map((part) => {
          const v = getVariant(part)
          const pct = totalCost > 0 ? (v.unit_cost_usd / totalCost) * 100 : 0
          return (
            <div key={part.id} className="est-bar-row">
              <div className="est-bar-label">
                <span className="est-bar-swatch" style={{ background: v.color }} />
                <span>{part.id}</span>
              </div>
              <div className="est-bar-track">
                <div
                  className="est-bar-fill"
                  style={{ width: `${pct}%`, background: v.color }}
                />
              </div>
              <span className="est-bar-pct">{pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
