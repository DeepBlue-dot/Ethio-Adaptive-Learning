/**
 * --- INLINED BKT & SIM LOGIC ---
 */
export function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v || 0))
}

export function evidenceUpdateCorrect(prior, params) {
  const pK = clamp(prior)
  const num = pK * (1 - params.pS)
  const den = num + (1 - pK) * params.pG
  return den === 0 ? pK : clamp(num / den)
}

export function evidenceUpdateIncorrect(prior, params) {
  const pK = clamp(prior)
  const num = pK * params.pS
  const den = num + (1 - pK) * (1 - params.pG)
  return den === 0 ? pK : clamp(num / den)
}

export function transitUpdate(posterior, params) {
  const nextPrior = clamp(posterior)
  return clamp(nextPrior + (1 - nextPrior) * params.pT)
}

export function applyObservation({ prior, isCorrect, params }) {
  const posteriorEvidence = isCorrect
    ? evidenceUpdateCorrect(prior, params)
    : evidenceUpdateIncorrect(prior, params)
  return {
    posteriorEvidence,
    posteriorNext: transitUpdate(posteriorEvidence, params),
  }
}

export function getConceptBktParams(concept) {
  return {
    pLo: clamp(concept?.pLo ?? 0.15),
    pT: clamp(concept?.pT ?? 0.1),
    pG: clamp(concept?.pG ?? 0.2),
    pS: clamp(concept?.pS ?? 0.1),
  }
}
