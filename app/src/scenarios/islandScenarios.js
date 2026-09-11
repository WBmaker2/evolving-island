import { makeIndividual, validateN, validateRecombinationRate, validateSeed } from '../domain/geneticsTypes.js';
import { FITNESS_BY_ENVIRONMENT } from '../engine/selection.js';

export const ISLAND_SCENARIO = {
  id: 'evolving-island-baseline',
  title: '진화하는 섬',
  initialHaplotypes: ['AB', 'ab'],
  generationLimit: 20,
  repeatCount: 10,
  mutationRate: 0,
  fitnessByEnvironment: FITNESS_BY_ENVIRONMENT,
};

export function createInitialPopulation(N) {
  validateN(N);
  return Array.from({ length: N }, (_, index) => makeIndividual(`g0-${index + 1}`, ISLAND_SCENARIO.initialHaplotypes));
}

export function validateSettings(input) {
  const N = validateN(input.N);
  const seed = validateSeed(input.seed);
  const recombinationRate = validateRecombinationRate(input.recombinationRate);
  const selectionOn = Boolean(input.selectionOn);
  const environmentMode = ['A', 'B', 'transition'].includes(input.environmentMode) ? input.environmentMode : null;
  if (!environmentMode) throw new RangeError('환경 조건이 올바르지 않습니다.');
  if (input.mutationRate !== 0) throw new RangeError('이 모델의 돌연변이율은 0으로 고정되어야 합니다.');
  return { N, seed, recombinationRate, selectionOn, environmentMode, mutationRate: 0 };
}
