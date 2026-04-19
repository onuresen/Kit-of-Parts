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
  const totalWeight   = activeParts.reduce((sum, p) => sum + getVariant(p).weight_kg, 0)
  const totalMaterial = activeParts.reduce((sum, p) => sum + getVariant(p).unit_cost_usd, 0)
  const totalLabour   = activeParts.reduce((sum, p) => sum + (getVariant(p).labor_cost_usd ?? 0), 0)
  const totalCost     = totalMaterial + totalLabour
  const costPerM2     = Math.round(totalCost / FOOTPRINT_M2)
  const totalCarbon   = activeParts.reduce((sum, p) => sum + getVariant(p).carbon_kgco2e, 0)
  const carbonPerM2   = Math.round(totalCarbon / FOOTPRINT_M2)
  const budgetPct     = Math.round((carbonPerM2 / RIBA_BUDGET) * 100)
  const budgetColor   = budgetPct < 80 ? '#27ae60' : budgetPct <= 100 ? '#f39c12' : '#e74c3c'
  const barWidth      = Math.min((totalCarbon / RIBA_BUDGET_TOTAL) * 100, 100) + '%'

  const hasLabourData = activeParts.some(p => getVariant(p).labor_cost_usd != null)

  const factoryParts = activeParts.filter(p => p.factory_work === true)
  const siteParts    = activeParts.filter(p => p.factory_work === false)
  const factoryRatio = activeParts.length > 0 ? Math.round((factoryParts.length / activeParts.length) * 100) : 0
  const materialPct   = totalCost > 0 ? (totalMaterial / totalCost) * 100 : 50
  const labourPct     = totalCost > 0 ? (totalLabour   / totalCost) * 100 : 50

  function exportCSV() {
    const headers = [
      'Component', 'Factory/Site', 'Variant', 'SKU', 'Supplier',
      'Visible', 'Weight (kg)', 'Material Cost (USD)', 'Labour Cost (USD)',
      'Total Cost (USD)', 'Lead Time (days)', 'CO2e (kg)', 'Install Time (min)', 'DFMA Notes'
    ]
    const rows = parts.map(part => {
      const v = getVariant(part)
      const labour = v.labor_cost_usd ?? ''
      const total  = labour !== '' ? v.unit_cost_usd + labour : v.unit_cost_usd
      return [
        part.id,
        part.factory_work == null ? '' : part.factory_work ? 'Factory' : 'Site',
        v.label,
        v.sku ?? '',
        v.supplier ?? '',
        visible[part.id] ? 'Yes' : 'No',
        v.weight_kg,
        v.unit_cost_usd,
        labour,
        total,
        v.lead_time_days ?? '',
        v.carbon_kgco2e,
        v.assembly_time_min ?? '',
        v.dfma_notes ?? ''
      ]
    })
    const tw  = activeParts.reduce((s, p) => s + getVariant(p).weight_kg, 0)
    const tm  = activeParts.reduce((s, p) => s + getVariant(p).unit_cost_usd, 0)
    const tl  = activeParts.reduce((s, p) => s + (getVariant(p).labor_cost_usd ?? 0), 0)
    rows.push(['', '', '', '', '', 'TOTALS', tw, tm, tl, tm + tl, '', '', '', ''])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'IC-BOM.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="metrics-panel">
      <div className="metrics-header">
        <div className="metrics-tabs">
          {['cost', 'carbon', 'bom', 'prefab'].map(tab => (
            <button
              key={tab}
              className={`metrics-tab ${activeTab === tab ? 'metrics-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'cost' ? 'Cost' : tab === 'carbon' ? 'Carbon' : tab === 'bom' ? 'BOM' : 'Prefab'}
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
              <span className="est-unit">all-in cost</span>
            </div>
            <div className="est-divider" />
            <div className="est-metric">
              <span className="est-value">${costPerM2.toLocaleString()}</span>
              <span className="est-unit">per m² ({FOOTPRINT_M2} m²)</span>
            </div>
          </div>

          {hasLabourData && (
            <div className="cost-split-section">
              <div className="cost-split-label-row">
                <span className="cost-split-legend cost-split-legend--material">Material</span>
                <span className="cost-split-values">
                  ${totalMaterial.toLocaleString()} · {materialPct.toFixed(0)}%
                </span>
              </div>
              <div className="cost-split-bar">
                <div className="cost-split-bar__material" style={{ width: `${materialPct}%` }} />
                <div className="cost-split-bar__labour"   style={{ width: `${labourPct}%` }} />
              </div>
              <div className="cost-split-label-row">
                <span className="cost-split-legend cost-split-legend--labour">Labour</span>
                <span className="cost-split-values">
                  ${totalLabour.toLocaleString()} · {labourPct.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          <div className="est-breakdown">
            {activeParts.map(part => {
              const v = getVariant(part)
              const matCost = v.unit_cost_usd
              const labCost = v.labor_cost_usd ?? 0
              const partTotal = matCost + labCost
              const matPct = totalCost > 0 ? (matCost / totalCost) * 100 : 0
              const labPctBar = totalCost > 0 ? (labCost / totalCost) * 100 : 0
              return (
                <div key={part.id} className="est-bar-row">
                  <div className="est-bar-label">
                    <span className="est-bar-swatch" style={{ background: v.color }} />
                    <span>{part.id}</span>
                  </div>
                  <div className="est-bar-track">
                    <div className="est-bar-fill" style={{ width: `${matPct}%`, background: v.color }} />
                    {labCost > 0 && (
                      <div className="est-bar-fill est-bar-fill--labour" style={{ width: `${labPctBar}%` }} />
                    )}
                  </div>
                  <span className="est-bar-pct">${partTotal.toLocaleString()}</span>
                </div>
              )
            })}
          </div>

          {hasLabourData && (
            <div className="cost-split-legend-row">
              <span className="cost-split-pip cost-split-pip--material" />Material cost
              <span className="cost-split-pip cost-split-pip--labour" style={{ marginLeft: 12 }} />Labour cost
            </div>
          )}
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
                    <div className="est-bar-fill" style={{ width: `${Math.max(pct, 0)}%`, background: v.color }} />
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
                <th>Material $</th>
                {hasLabourData && <th>Labour $</th>}
                <th>Lead</th>
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
                      {part.factory_work != null && (
                        <span className={`bom-badge ${part.factory_work ? 'bom-badge--factory' : 'bom-badge--site'}`}>
                          {part.factory_work ? 'F' : 'S'}
                        </span>
                      )}
                    </td>
                    <td className="bom-variant">
                      {v.label}
                      {v.sku && <span className="bom-sku">{v.sku}</span>}
                    </td>
                    <td className="bom-num">{v.weight_kg.toLocaleString()}</td>
                    <td className="bom-num">{v.unit_cost_usd.toLocaleString()}</td>
                    {hasLabourData && (
                      <td className="bom-num">{v.labor_cost_usd != null ? v.labor_cost_usd.toLocaleString() : '—'}</td>
                    )}
                    <td className="bom-num">{v.lead_time_days != null ? `${v.lead_time_days}d` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bom-total">
                <td colSpan={2}>Active Totals ({activeParts.length} components)</td>
                <td className="bom-num">{totalWeight.toLocaleString()}</td>
                <td className="bom-num">${totalMaterial.toLocaleString()}</td>
                {hasLabourData && <td className="bom-num">${totalLabour.toLocaleString()}</td>}
                <td />
              </tr>
            </tfoot>
          </table>
          <button className="bom-export" onClick={exportCSV}>Export CSV</button>
        </>
      )}

      {/* ── Prefab tab (工場製作比率) ── */}
      {activeTab === 'prefab' && (
        <>
          <div className="est-metrics">
            <div className="est-metric">
              <span className="est-value">{factoryRatio}%</span>
              <span className="est-unit">factory work ratio</span>
            </div>
            <div className="est-divider" />
            <div className="est-metric">
              <span className="est-value">{factoryParts.length}</span>
              <span className="est-unit">factory parts</span>
            </div>
            <div className="est-divider" />
            <div className="est-metric">
              <span className="est-value">{siteParts.length}</span>
              <span className="est-unit">site parts</span>
            </div>
          </div>
          <div className="cost-split-section">
            <div className="cost-split-label-row">
              <span className="cost-split-legend cost-split-legend--material">Factory</span>
              <span className="cost-split-values">{factoryParts.length} parts · {factoryRatio}%</span>
            </div>
            <div className="cost-split-bar">
              <div className="cost-split-bar__material" style={{ width: `${factoryRatio}%` }} />
              <div className="cost-split-bar__labour"   style={{ width: `${100 - factoryRatio}%` }} />
            </div>
            <div className="cost-split-label-row">
              <span className="cost-split-legend cost-split-legend--labour">Site</span>
              <span className="cost-split-values">{siteParts.length} parts · {100 - factoryRatio}%</span>
            </div>
          </div>
          <div className="est-breakdown">
            {activeParts.map(part => (
              <div key={part.id} className="est-bar-row">
                <div className="est-bar-label">
                  <span className="est-bar-swatch" style={{ background: getVariant(part).color }} />
                  <span>{part.id}</span>
                </div>
                {part.factory_work != null && (
                  <span className={`bom-badge ${part.factory_work ? 'bom-badge--factory' : 'bom-badge--site'}`}>
                    {part.factory_work ? 'Factory' : 'Site'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="carbon-footer-note">工場製作比率 — Japan DfMA KPI</div>
        </>
      )}
    </div>
  )
}
