function calcStars(mistakes, elapsedMs) {
  const s = elapsedMs / 1000
  if (mistakes === 0 && s <= 20) return 3
  if (mistakes <= 3 && s <= 60) return 2
  return 1
}

export default function GameScorePanel({ mistakes, elapsed, onPlayAgain, onExit }) {
  const seconds = (elapsed / 1000).toFixed(1)
  const stars = calcStars(mistakes, elapsed)

  return (
    <div className="game-overlay">
      <div className="game-score-panel">
        <div className="game-score-title">BUILD COMPLETE!</div>
        <div className="game-score-stars">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`star ${i < stars ? 'star--filled' : 'star--empty'}`}>★</span>
          ))}
        </div>
        <div className="game-score-rating">
          {stars === 3 ? 'Perfect Build!' : stars === 2 ? 'Good Work!' : 'Keep Practicing!'}
        </div>
        <div className="game-score-stats">
          <div className="game-stat">
            <span className="game-stat-value">{seconds}s</span>
            <span className="game-stat-label">TIME</span>
          </div>
          <div className="game-stat-divider" />
          <div className="game-stat">
            <span className="game-stat-value">{mistakes}</span>
            <span className="game-stat-label">MISTAKES</span>
          </div>
        </div>
        <div className="game-score-actions">
          <button className="game-btn game-btn--primary" onClick={onPlayAgain}>PLAY AGAIN</button>
          <button className="game-btn game-btn--secondary" onClick={onExit}>EXIT</button>
        </div>
      </div>
    </div>
  )
}
