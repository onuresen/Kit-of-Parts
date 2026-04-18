export default function EnvPanel({ envSettings, setEnvSettings, onClose }) {
  return (
    <div className="estimator-panel" style={{ bottom: '20px', right: '310px', top: 'auto', width: '250px' }}>
      <div className="est-header">
        <span className="est-title">Environment Controls</span>
        <button className="est-close" onClick={onClose}>✕</button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, color: '#333' }}>Show Grass Floor</span>
          <input 
            type="checkbox" 
            checked={envSettings.grass} 
            onChange={e => setEnvSettings(s => ({...s, grass: e.target.checked}))} 
            style={{ cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, color: '#333' }}>Show Clouds</span>
          <input 
            type="checkbox" 
            checked={envSettings.clouds} 
            onChange={e => setEnvSettings(s => ({...s, clouds: e.target.checked}))} 
            style={{ cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, color: '#333' }}>Show Stars (Night)</span>
          <input 
            type="checkbox" 
            checked={envSettings.stars} 
            onChange={e => setEnvSettings(s => ({...s, stars: e.target.checked}))} 
            style={{ cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#333' }}>
            Time of Day
            <span style={{ color: '#aaa' }}>{envSettings.time.toString().padStart(2, '0')}:00</span>
          </span>
          <input 
            type="range" 
            min="0" max="23" step="1" 
            value={envSettings.time} 
            onChange={e => setEnvSettings(s => ({...s, time: parseInt(e.target.value)}))} 
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </label>
      </div>
    </div>
  )
}
