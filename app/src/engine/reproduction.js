import { makeIndividual } from '../domain/geneticsTypes.js';
import { createRng, weightedIndex } from './rng.js';
import { weightsForPopulation } from './selection.js';

export function gameteFromParent(parent, recombinationRate, rng) {
  const first = rng.next() < 0.5 ? 0 : 1;
  const second = rng.next() < recombinationRate ? 1 - first : first;
  return `${parent.haplotypes[first][0]}${parent.haplotypes[second][1]}`;
}

export function sampleGametes(population, environment, selectionOn, recombinationRate, seed) {
  const rng = createRng(seed);
  const weights = weightsForPopulation(population, environment, selectionOn);
  const gametes = [];
  for (let i = 0; i < population.length * 2; i += 1) {
    const parent = population[weightedIndex(weights, rng)];
    gametes.push(gameteFromParent(parent, recombinationRate, rng));
  }
  return gametes;
}

export function reproduce(population, environment, selectionOn, recombinationRate, seed) {
  const gametes = sampleGametes(population, environment, selectionOn, recombinationRate, seed);
  const children = [];
  for (let i = 0; i < gametes.length; i += 2) {
    children.push(makeIndividual(`g-next-${i / 2 + 1}`, [gametes[i], gametes[i + 1]]));
  }
  return children;
}
