import { PHENOTYPES } from '../domain/geneticsTypes.js';

export const FITNESS_BY_ENVIRONMENT = {
  A: { A_B_: 1.25, A_bb: 1.10, aaB_: 0.90, aabb: 0.78 },
  B: { A_B_: 0.78, A_bb: 0.90, aaB_: 1.10, aabb: 1.25 },
};

export function environmentForGeneration(mode, generation) {
  if (mode === 'transition') return generation <= 10 ? 'A' : 'B';
  return mode === 'B' ? 'B' : 'A';
}

export function fitnessRows(environment, selectionOn) {
  const values = selectionOn ? FITNESS_BY_ENVIRONMENT[environment] : Object.fromEntries(PHENOTYPES.map((p) => [p.id, 1]));
  return PHENOTYPES.map((phenotype) => ({ ...phenotype, weight: values[phenotype.id] }));
}

export function assertUsableWeights(weights) {
  if (!weights.length || weights.some((weight) => !Number.isFinite(weight) || weight < 0)) throw new Error('번식 가중치는 0 이상의 유한한 수여야 합니다.');
  if (weights.every((weight) => weight === 0)) throw new Error('모든 개체의 번식 가중치가 0입니다. 실행할 수 없습니다.');
  return weights;
}

export function weightsForPopulation(population, environment, selectionOn, overrideByPhenotype = null) {
  const values = overrideByPhenotype || (selectionOn ? FITNESS_BY_ENVIRONMENT[environment] : Object.fromEntries(PHENOTYPES.map((p) => [p.id, 1])));
  const weights = population.map((individual) => values[individual.phenotype]);
  assertUsableWeights(weights);
  return weights;
}
