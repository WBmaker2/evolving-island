import { GENOTYPES, HAPLOTYPES, PHENOTYPES, canonicalGenotype, phenotypeFromHaplotypes } from '../domain/geneticsTypes.js';

const emptyCounts = (keys) => Object.fromEntries(keys.map((key) => [key, 0]));

export function summarizePopulation(population) {
  const allele = { A: 0, a: 0, B: 0, b: 0 };
  const haplotype = emptyCounts(HAPLOTYPES);
  const genotype = emptyCounts(GENOTYPES);
  const phenotype = emptyCounts(PHENOTYPES.map((p) => p.id));
  population.forEach((individual) => {
    genotype[canonicalGenotype(individual.haplotypes)] += 1;
    const phenotypeId = phenotypeFromHaplotypes(individual.haplotypes);
    phenotype[phenotypeId] += 1;
    individual.haplotypes.forEach((hap) => {
      haplotype[hap] += 1;
      allele.A += hap[0] === 'A' ? 1 : 0;
      allele.a += hap[0] === 'a' ? 1 : 0;
      allele.B += hap[1] === 'B' ? 1 : 0;
      allele.b += hap[1] === 'b' ? 1 : 0;
    });
  });
  const N = population.length;
  return {
    N,
    alleleCount: allele,
    alleleFrequency: { pA: allele.A / (2 * N), pB: allele.B / (2 * N) },
    haplotypeCount: haplotype,
    haplotypeFrequency: Object.fromEntries(HAPLOTYPES.map((h) => [h, haplotype[h] / (2 * N)])),
    genotypeCount: genotype,
    genotypeFrequency: Object.fromEntries(GENOTYPES.map((key) => [key, genotype[key] / N])),
    phenotypeCount: phenotype,
    phenotypeFrequency: Object.fromEntries(Object.entries(phenotype).map(([key, value]) => [key, value / N])),
  };
}

export function quantile(values, q) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function summarizeRepeats(runs, field) {
  const generations = runs[0]?.history.length || 0;
  return Array.from({ length: generations }, (_, generation) => {
    const values = runs.map((run) => field.split('.').reduce((value, key) => value[key], run.history[generation].summary));
    return {
      generation,
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
      median: quantile(values, 0.5),
      p10: quantile(values, 0.1),
      p90: quantile(values, 0.9),
      values,
    };
  });
}
