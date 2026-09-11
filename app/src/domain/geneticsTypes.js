export const HAPLOTYPES = ['AB', 'Ab', 'aB', 'ab'];
export const GENOTYPES = ['AABB', 'AABb', 'AAbb', 'AaBB', 'AaBb', 'Aabb', 'aaBB', 'aaBb', 'aabb'];
export const PHENOTYPES = [
  { id: 'A_B_', label: 'A 우성 · B 우성', pattern: '▲●', loci: 'A_ B_' },
  { id: 'A_bb', label: 'A 우성 · b 열성', pattern: '▲○', loci: 'A_ bb' },
  { id: 'aaB_', label: 'a 열성 · B 우성', pattern: '△●', loci: 'aa B_' },
  { id: 'aabb', label: 'a 열성 · b 열성', pattern: '△○', loci: 'aa bb' },
];

export function cloneHaplotype(haplotype) {
  return String(haplotype);
}

export function canonicalHaplotypePair(haplotypes) {
  return [...haplotypes].sort().join('/');
}

export function canonicalGenotype(haplotypes) {
  const allelesA = haplotypes.map((haplotype) => haplotype[0]).sort().join('');
  const allelesB = haplotypes.map((haplotype) => haplotype[1]).sort().join('');
  return `${allelesA}${allelesB}`;
}

export function phenotypeFromHaplotypes(haplotypes) {
  const hasA = haplotypes.some((h) => h[0] === 'A');
  const hasB = haplotypes.some((h) => h[1] === 'B');
  return hasA ? (hasB ? 'A_B_' : 'A_bb') : (hasB ? 'aaB_' : 'aabb');
}

export function makeIndividual(id, haplotypes) {
  const pair = [cloneHaplotype(haplotypes[0]), cloneHaplotype(haplotypes[1])];
  return { id, haplotypes: pair, phenotype: phenotypeFromHaplotypes(pair) };
}

export function validateN(value) {
  if (![20, 60, 200].includes(Number(value))) throw new RangeError('개체군 크기는 20, 60, 200 중 하나여야 합니다.');
  return Number(value);
}

export function validateRecombinationRate(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    throw new RangeError('재조합률을 입력해 주세요');
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 0.5) {
    throw new RangeError('재조합률 r은 0 이상 0.5 이하이어야 합니다.');
  }
  return number;
}

export function validateSeed(value) {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    throw new RangeError('시드를 입력해 주세요');
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new RangeError('시드는 0 이상의 안전한 정수여야 합니다.');
  return number;
}
