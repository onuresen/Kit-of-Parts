import { useKit } from './KitContext'

const FOOTPRINT_M2 = 16
const RIBA_BUDGET = 300        // kg CO₂e/m²
const RIBA_BUDGET_TOTAL = RIBA_BUDGET * FOOTPRINT_M2  // 4800 kg CO₂e

export default function CarbonPanel({ selectedVariants, visible, onClose }) {
  const { parts } = useKit()

  function getVariant(part) {
    const idx = selectedVariants[part.id] ?? 0
    return part.variants[idx]
  }

  const activeParts = parts.filter(p => visible[p.id])
  const totalCarbon = activeParts.reduce((sum, p) => sum + getVariant(p).carbon_kgco2e, 0)
  const carbonPerM2 = Math.round(totalCarbon / FOOTPRINT_M2)
  const budgetPct = Math.round((carbonPerM2 / RIBA_BUDGET) * 100)
  const budgetColor = budgetPct < 80 ? '#27ae60' : budgetPct <= 100 ? '#f39c12' : '#e74c3c'
  const barWidth = Math.min((totalCarbon / RIBA_BUDGET_TOTAL) * 100, 100) + '%'

  return (
    <div className="estimator-panel carbon-panel">
      <div className="est-header">
        <span className="est-title">Embodied Carbon</span>
        <button className="est-close" onClick={onClose}>✕</button>
      </div>

      <div className="est-metrics">
        <div className="est-metric">
          <span className="est-value">{totalCarbon.toLocaleString()}</span>
          <span className="est-unit">kg CO₂e total</span>
        </div>
        <div className="est-divider" />
        <div className="est-metric">
          <span className="est-value">{carbonPerM2.toLocaleString()}</span>
          <span className="est-unit">kg CO₂e / m²</span>
        </div>
        <div className="est-divider" />
        <div className="est-metric">
          <span className="est-value" style={{ color: budgetColor }}>{budgetPct}%</span>
          <span className="est-unit">vs RIBA 2030</span>
        </div>
      </div>

      <div className="carbon-budget-wrap">
        <div className="carbon-budget-label">RIBA 2030 Budget (300 kg CO₂e / m²)</div>
        <div className="carbon-budget-track">
          <div className="carbon-budget-fill" style={{ width: barWidth }} />
          <div className="carbon-budget-marker" />
        </div>
      </div>

      <div className="est-breakdown">
        {activeParts.map(part => {
          const v = getVariant(part)
          const pct = totalCarbon > 0 ? (v.carbon_kgco2e / totalCarbon) * 100 : 0
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

      <div className="carbon-footer-note">Based on ICE Database v3.0 (Bath Univ.)</div>
    </div>
  )
}
