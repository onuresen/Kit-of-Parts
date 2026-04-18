import React from 'react'
import { useKit } from './KitContext'

export default function BuilderPanel({ selected }) {
  const { parts, updatePart, addPart, duplicatePart, removePart, exportKit, clearAutoSave } = useKit()

  const part = selected ? parts.find(p => p.id === selected.id) : null

  function handleSize(axis, value) {
    if (!part) return
    const newSize = [...part.size]
    newSize[axis] = Number(value)
    updatePart(part.id, { size: newSize })
  }

  function handleCylArg(idx, value) {
    if (!part) return
    const newArgs = part.cylinderArgs ? [...part.cylinderArgs] : [part.size[0]/2, part.size[0]/2, part.size[1], 32]
    newArgs[idx] = Number(value)
    updatePart(part.id, { cylinderArgs: newArgs })
  }

  function handleVariant(field, value, isNumber = false) {
    if (!part) return
    const v = { ...part.variants[0] }
    v[field] = isNumber ? Number(value) : value
    const newVariants = [v, ...part.variants.slice(1)]
    updatePart(part.id, { variants: newVariants })
  }

  function handleDelete() {
    if (!part) return
    removePart(part.id)
  }

  function handleDuplicate() {
    if (!part) return
    duplicatePart(part.id)
  }

  return (
    <div className="builder-panel" style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase' }}>Builder Panel</div>
      
      {!part && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
          Select a part in the scene to edit its properties, or add a new part.
        </div>
      )}

      {part && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          
          <label style={{ fontSize: '11px', display: 'block' }}>Name:
            <input type="text" value={part.id} disabled style={{ width: '100%', fontSize: '12px', padding: '4px' }} />
          </label>

          <label style={{ fontSize: '11px', display: 'block' }}>Shape:
            <select 
              value={part.shape || 'box'} 
              onChange={e => updatePart(part.id, { shape: e.target.value })}
              style={{ width: '100%', fontSize: '12px', padding: '4px' }}
            >
              <option value="box">Box</option>
              <option value="cylinder">Cylinder</option>
            </select>
          </label>

          {(part.shape === 'cylinder') ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <label style={{ fontSize: '11px', flex: 1 }}>Radius Top:
                <input type="number" step="0.1" value={part.cylinderArgs?.[0] ?? (part.size[0]/2)} onChange={e => handleCylArg(0, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
              <label style={{ fontSize: '11px', flex: 1 }}>Radius Bot:
                <input type="number" step="0.1" value={part.cylinderArgs?.[1] ?? (part.size[0]/2)} onChange={e => handleCylArg(1, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
              <label style={{ fontSize: '11px', flex: 1 }}>Height:
                <input type="number" step="0.1" value={part.cylinderArgs?.[2] ?? part.size[1]} onChange={e => handleCylArg(2, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <label style={{ fontSize: '11px', flex: 1 }}>Width (X):
                <input type="number" step="0.1" value={part.size[0]} onChange={e => handleSize(0, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
              <label style={{ fontSize: '11px', flex: 1 }}>Height (Y):
                <input type="number" step="0.1" value={part.size[1]} onChange={e => handleSize(1, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
              <label style={{ fontSize: '11px', flex: 1 }}>Depth (Z):
                <input type="number" step="0.1" value={part.size[2]} onChange={e => handleSize(2, e.target.value)} style={{ width: '100%', padding: '2px' }} />
              </label>
            </div>
          )}

          <div style={{ margin: '8px 0', borderTop: '1px solid #ccc' }} />

          <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
            Color:
            <input type="color" value={part.variants[0].color} onChange={e => handleVariant('color', e.target.value)} style={{ marginLeft: '8px' }} />
          </label>

          <label style={{ fontSize: '11px', display: 'block' }}>Cost ($):
            <input type="number" value={part.variants[0].unit_cost_usd} onChange={e => handleVariant('unit_cost_usd', e.target.value, true)} style={{ width: '100%', padding: '2px' }} />
          </label>

          <label style={{ fontSize: '11px', display: 'block' }}>Carbon (CO2e):
            <input type="number" value={part.variants[0].carbon_kgco2e} onChange={e => handleVariant('carbon_kgco2e', e.target.value, true)} style={{ width: '100%', padding: '2px' }} />
          </label>

          <label style={{ fontSize: '11px', display: 'block' }}>Weight (kg):
            <input type="number" value={part.variants[0].weight_kg} onChange={e => handleVariant('weight_kg', e.target.value, true)} style={{ width: '100%', padding: '2px' }} />
          </label>

          <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
            <input type="checkbox" checked={!!part.wire} onChange={e => updatePart(part.id, { wire: e.target.checked })} style={{ marginRight: '6px' }} />
            Wireframe Only
          </label>

          <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" checked={!!part.transparent} onChange={e => updatePart(part.id, { transparent: e.target.checked })} style={{ marginRight: '6px' }} />
            Transparent
          </label>

          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <button onClick={handleDuplicate} style={{ flex: 1, background: '#f39c12', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
              Duplicate Part
            </button>
            <button onClick={handleDelete} style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
              Delete Part
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button onClick={addPart} style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          + Add New Part
        </button>
        <button onClick={exportKit} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ↓ Export Kit JSON
        </button>
        <button onClick={clearAutoSave} style={{ background: '#7f8c8d', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
          ↻ Clear Local Save
        </button>
      </div>
    </div>
  )
}
