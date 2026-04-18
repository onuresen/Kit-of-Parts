import { useState } from 'react'
import { useKit } from './KitContext'

const FOOTPRINT_M2 = 16
const RIBA_BUDGET = 300
const RIBA_BUDGET_TOTAL = RIBA_BUDGET * FOOTPRINT_M2

export default function MetricsPanel({ selectedVariants, visible, onClose }) {
  const { parts } = useKit()
  const [activeTab, setActiveTab] = useState('cost')

  function getVariant(part) {
    const idx = selectedVariants[part.id] ?? 0
    return part.variants[idx]
  }

  const activeParts = parts.filter(p => visible[p.id])
  const totalWeight = activeParts.reduce((sum, p) => sum + getVariant(p).weight_kg, 0)
  const totalCost = activeParts.reduce((sum, p) => sum + getVariant(p).unit_cost_usd, 0)
  const costPerM2 = Math.round(totalCost / FOOTPRINT_M2)
  const totalCarbon = activeParts.reduce((sum, p) => sum + getVariant(p).carbon_kgco2e, 0)
  const carbonPerM2 = Math.round(totalCarbon / FOOTPRINT_M2)
  const budgetPct = Math.round((carbonPerM2 / RIBA_BUDGET) * 100)
  const budgetColor = budgetPct < 80 ? '#27ae60' : budgetPct <= 100 ? '#f39c12' : '#e74c3c'
  const barWidth = Math.min((totalCarbon / RIBA_BUDGET_TOTAL) * 100, 100) + '%'

  function exportCSV() {
    const headers = ['Component', 'Type', 'Variant', 'Visible', 'Weight (kg)', 'Unit Cost (USD)']
    const rows = parts.map(part => {
      const v = getVariant(part)
      return [part.id, v.meta, v.label, visible[part.id] ? 'Yes' : 'No', v.weight_kg, v.unit_cost_usd]
    })
    const tw = activeParts.reduce((sum, p) => sum + getVariant(p).weight_kg, 0)
    const tc = activeParts.reduce((sum, p) => sum + getVariant(p).unit_cost_usd, 0)
    rows.push(['', '', '', 'TOTALS', tw, tc])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'IC-BOM.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="metrics-panel">
      <div className="metrics-header">
        <div className="metrics-tabs">
          {['cost', 'carbon', 'bom'].map(tab => (
            <button
              key={tab}
              className={`metrics-tab ${activeTab === tab ? 'metrics-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'cost' ? 'Cost' : tab === 'carbon' ? 'Carbon' : 'BOM'}
            </button>
          ))}
        </div>
        <button className="est-close" onClick={onClose}>✕</button>
      </div>

      {/* ── Cost tab ── */}
      {activeTab === 'cost' && (
        <>
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
            {activeParts.map(part => {
              const v = getVariant(part)
              const pct = totalCost > 0 ? (v.unit_cost_usd / totalCost) * 100 : 0
              return (
                <div key={part.id} className="est-bar-row">
                  <div className="est-bar-label">
                    <span className="est-bar-swatch" style={{ background: v.color }} />
                    <span>{part.id}</span>
                  </div>
                  <div className="est-bar-track">
                    <div className="est-bar-fill" style={{ width: `${pct}%`, background: v.color }} />
                  </div>
                  <span className="est-bar-pct">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Carbon tab ── */}
      {activeTab === 'carbon' && (
        <>
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
                    <div className="est-bar-fill" style={{ width: `${pct}%`, background: v.color }} />
                  </div>
                  <span className="est-bar-pct">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
          <div className="carbon-footer-note">Based on ICE Database v3.0 (Bath Univ.)</div>
        </>
      )}

      {/* ── BOM tab ── */}
      {activeTab === 'bom' && (
        <>
          <table className="bom-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Variant</th>
                <th>kg</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => {
                const v = getVariant(part)
                const isHidden = !visible[part.id]
                return (
                  <tr key={part.id} className={isHidden ? 'bom-row--hidden' : ''}>
                    <td>
                      <span className="bom-swatch" style={{ background: v.color }} />
                      {part.id}
                    </td>
                    <td className="bom-variant">{v.label}</td>
                    <td className="bom-num">{v.weight_kg.toLocaleString()}</td>
                    <td className="bom-num">{v.unit_cost_usd.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bom-total">
                <td colSpan={2}>Active Totals ({activeParts.length} components)</td>
                <td className="bom-num">{totalWeight.toLocaleString()}</td>
                <td className="bom-num">${totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <button className="bom-export" onClick={exportCSV}>Export CSV</button>
        </>
      )}
    </div>
  )
}
