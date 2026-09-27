export function hasFireEffects(fireState) {
  return Object.values(fireState ?? {}).some(
    status => status === 'burning' || status === 'failed'
  )
}

export function getContinuousRenderReasons({
  siteMode = false,
  factoryMode = false,
  showWaterSim = false,
  showThermal = false,
  showWindArrows = false,
  fireState = {},
  isShaking = false,
  envSettings,
} = {}) {
  const reasons = []
  const regularView = !siteMode && !factoryMode

  if (!regularView) return reasons
  if (showWaterSim) reasons.push('water-simulation')
  if (showThermal) reasons.push('thermal-overlay')
  if (showWindArrows) reasons.push('wind-overlay')
  if (hasFireEffects(fireState)) reasons.push('fire-effects')
  if (isShaking) reasons.push('earthquake')
  if (envSettings?.clouds) reasons.push('clouds')
  if (envSettings?.stars) reasons.push('stars')

  return reasons
}
