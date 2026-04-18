import { useKit } from './KitContext'

export default function InfoPanel({ selected, selectedVariants, onVariantChange }) {
  const { parts } = useKit()

  if (!selected) {
    return <div className="info-panel" style={{ opacity: 0, pointerEvents: 'none' }} />
  }

  const part = parts.find((p) => p.id === selected.id)
  if (!part) return null

  const activeIdx = selectedVariants[part.id] ?? 0
  const activeVariant = part.variants[activeIdx]

  return (
    <div className="info-panel" style={{ opacity: 1, borderLeftColor: activeVariant.color }}>
      <h3 className="info-title">{selected.id}</h3>
      <p className="info-meta">{activeVariant.meta}</p>

      {part.variants.length > 1 && (
        <>
          <div className="info-variants-label">Variants</div>
          <div className="info-variants">
            {part.variants.map((v, i) => (
              <button
                key={i}
                className={`variant-btn ${i === activeIdx ? 'variant-btn--active' : ''}`}
                style={i === activeIdx ? { borderColor: v.color, background: v.color + '22' } : {}}
                onClick={() => onVariantChange(part.id, i)}
                title={v.meta}
              >
                <span className="variant-swatch" style={{ background: v.color }} />
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="info-stats">
        <div className="info-stat">
          <span className="info-stat-label">Weight</span>
          <span className="info-stat-value">{activeVariant.weight_kg.toLocaleString()} kg</span>
        </div>
        <div className="info-stat">
          <span className="info-stat-label">Unit Cost</span>
          <span className="info-stat-value">${activeVariant.unit_cost_usd.toLocaleString()}</span>
        </div>
        <div className="info-stat">
          <span className="info-stat-label">CO₂e</span>
          <span className="info-stat-value">{activeVariant.carbon_kgco2e.toLocaleString()} kg</span>
        </div>
      </div>
    </div>
  )
}
