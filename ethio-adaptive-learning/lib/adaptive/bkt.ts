export type BktParams = {
  pLo: number
  pT: number
  pG: number
  pS: number
}

export const DEFAULT_BKT_PARAMS: BktParams = {
  pLo: 0.15,
  pT: 0.1,
  pG: 0.2,
  pS: 0.1,
}

export function clampProbability(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(1, Math.max(0, value))
}

export function getConceptBktParams(concept?: Partial<BktParams> | null): BktParams {
  return {
    pLo: clampProbability(concept?.pLo ?? DEFAULT_BKT_PARAMS.pLo),
    pT: clampProbability(concept?.pT ?? DEFAULT_BKT_PARAMS.pT),
    pG: clampProbability(concept?.pG ?? DEFAULT_BKT_PARAMS.pG),
    pS: clampProbability(concept?.pS ?? DEFAULT_BKT_PARAMS.pS),
  }
}

export function evidenceUpdateCorrect(prior: number, params: BktParams) {
  const pKnown = clampProbability(prior)
  const numerator = pKnown * (1 - params.pS)
  const denominator = numerator + (1 - pKnown) * params.pG

  if (denominator === 0) {
    return pKnown
  }

  return clampProbability(numerator / denominator)
}

export function evidenceUpdateIncorrect(prior: number, params: BktParams) {
  const pKnown = clampProbability(prior)
  const numerator = pKnown * params.pS
  const denominator = numerator + (1 - pKnown) * (1 - params.pG)

  if (denominator === 0) {
    return pKnown
  }

  return clampProbability(numerator / denominator)
}

export function transitUpdate(posterior: number, params: BktParams) {
  const nextPrior = clampProbability(posterior)
  return clampProbability(nextPrior + (1 - nextPrior) * params.pT)
}

export function applyObservation({
  prior,
  isCorrect,
  params,
}: {
  prior: number
  isCorrect: boolean
  params: BktParams
}) {
  const posteriorEvidence = isCorrect
    ? evidenceUpdateCorrect(prior, params)
    : evidenceUpdateIncorrect(prior, params)

  return {
    posteriorEvidence,
    posteriorNext: transitUpdate(posteriorEvidence, params),
  }
}
