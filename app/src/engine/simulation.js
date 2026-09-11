import { cloneHaplotype } from '../domain/geneticsTypes.js';
import { reproduce } from './reproduction.js';
import { environmentForGeneration, weightsForPopulation } from './selection.js';
import { summarizePopulation, summarizeRepeats } from './stats.js';
import { createInitialPopulation, validateSettings } from '../scenarios/islandScenarios.js';
import { deriveSeed } from './rng.js';

export function clonePopulation(population) {
  return population.map((individual) => ({ id: individual.id, haplotypes: individual.haplotypes.map(cloneHaplotype), phenotype: individual.phenotype }));
}

export function createState(input) {
  const settings = validateSettings(input);
  const population = createInitialPopulation(settings.N);
  return createStateFromPopulation(settings, population);
}

export function createStateFromPopulation(input, population) {
  const settings = validateSettings(input);
  if (population.length !== settings.N) throw new RangeError('초기 개체군의 크기가 N과 다릅니다.');
  const environment = environmentForGeneration(settings.environmentMode, 0);
  const summary = summarizePopulation(population);
  return {
    generation: 0,
    population: clonePopulation(population),
    settings,
    environment,
    history: [{ generation: 0, environment, summary }],
    lastRun: '초기 상태',
  };
}

export function stepState(state) {
  const nextGeneration = state.generation + 1;
  if (nextGeneration > 20) return state;
  const environment = environmentForGeneration(state.settings.environmentMode, nextGeneration);
  weightsForPopulation(state.population, environment, state.settings.selectionOn);
  const population = reproduce(
    state.population,
    environment,
    state.settings.selectionOn,
    state.settings.recombinationRate,
    deriveSeed(state.settings.seed, state.generation),
  );
  const summary = summarizePopulation(population);
  return {
    ...state,
    generation: nextGeneration,
    population,
    environment,
    history: [...state.history, { generation: nextGeneration, environment, summary }],
    lastRun: `${nextGeneration}세대 실행`,
  };
}

export function runGenerations(state, count = 20) {
  let current = state;
  for (let i = 0; i < count && current.generation < 20; i += 1) current = stepState(current);
  return current;
}

export function runRepeat(input, count = 10) {
  const base = validateSettings(input);
  const runs = Array.from({ length: count }, (_, index) => runGenerations(createState({ ...base, seed: base.seed + index }), 20));
  return { seeds: runs.map((run) => run.settings.seed), runs, aggregates: { pA: summarizeRepeats(runs, 'alleleFrequency.pA'), pB: summarizeRepeats(runs, 'alleleFrequency.pB') } };
}

export function getNested(object, path) {
  return path.split('.').reduce((value, key) => value[key], object);
}

export function compareNeutral(input) {
  const selectedInput = validateSettings(input);
  const neutralInput = { ...selectedInput, selectionOn: false };
  const selected = runRepeat({ ...selectedInput, selectionOn: true }, 10);
  const neutral = runRepeat(neutralInput, 10);
  return { selected, neutral };
}

export function compareSizeAndRecombination(input) {
  const base = validateSettings(input);
  const variants = [
    ...[20, 60, 200].map((N) => ({ N, recombinationRate: 0 })),
    { N: base.N, recombinationRate: 0.5 },
  ];
  const seen = new Set();
  return variants.filter(({ N, recombinationRate }) => {
    const key = `${N}:${recombinationRate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((variant) => {
    const settings = { ...base, ...variant, selectionOn: false };
    return { settings, result: runRepeat(settings, 10) };
  });
}
