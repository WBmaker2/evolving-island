import assert from 'node:assert/strict';
import { makeIndividual } from '../src/domain/geneticsTypes.js';
import { reproduce, sampleGametes } from '../src/engine/reproduction.js';
import { deriveSeed } from '../src/engine/rng.js';
import { assertUsableWeights } from '../src/engine/selection.js';
import { compareNeutral, compareSizeAndRecombination, createState, createStateFromPopulation, runGenerations, runRepeat, stepState } from '../src/engine/simulation.js';
import { summarizePopulation } from '../src/engine/stats.js';

const base = { N: 60, seed: 7, recombinationRate: 0, selectionOn: true, environmentMode: 'A', mutationRate: 0 };
const initial = createState(base);

const phasePopulation = [
  makeIndividual('phase-1', ['AB', 'ab']),
  makeIndividual('phase-2', ['Ab', 'aB']),
  ...Array.from({ length: 18 }, (_, index) => makeIndividual(`phase-${index + 3}`, ['AB', 'AB'])),
];
const phaseSummary = summarizePopulation(phasePopulation);
assert.equal(phaseSummary.genotypeCount.AaBb, 2, '두 상이한 haplotype phase는 AaBb 하나의 유전자형으로 합산됩니다.');
assert.deepEqual(Object.keys(phaseSummary.genotypeCount), ['AABB', 'AABb', 'AAbb', 'AaBB', 'AaBb', 'Aabb', 'aaBB', 'aaBb', 'aabb'], '유전자형 표는 9개 조합을 고정 순서로 제공합니다.');
assert.equal(phaseSummary.haplotypeCount.AB, 37, 'haplotype 표는 phase와 별도로 유지됩니다.');

function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function variance(values) { const center = mean(values); return mean(values.map((value) => (value - center) ** 2)); }
function finalPA(input) { return runRepeat(input, 100).aggregates.pA.at(-1).mean; }

assert.deepEqual(runGenerations(createState(base), 20), runGenerations(createState(base), 20), '같은 seed는 같은 결과를 내야 합니다.');
for (const N of [20, 60, 200]) {
  const result = runGenerations(createState({ ...base, N }), 20);
  result.history.forEach((entry) => {
    assert.equal(entry.summary.alleleCount.A + entry.summary.alleleCount.a, 2 * N, 'A/a 분모는 2N이어야 합니다.');
    assert.equal(entry.summary.alleleCount.B + entry.summary.alleleCount.b, 2 * N, 'B/b 분모는 2N이어야 합니다.');
    assert.equal(Object.values(entry.summary.phenotypeCount).reduce((sum, value) => sum + value, 0), N, '표현형 분모는 N이어야 합니다.');
  });
}

const noRecombination = sampleGametes(initial.population, 'A', false, 0, 12);
assert.equal(noRecombination.some((haplotype) => haplotype === 'Ab' || haplotype === 'aB'), false, 'r=0에서는 초기 AB/ab 조합이 보존되어야 합니다.');
const recombinedCounts = { AB: 0, Ab: 0, aB: 0, ab: 0 };
for (let seed = 0; seed < 1000; seed += 1) sampleGametes(initial.population, 'A', false, 0.5, seed).forEach((haplotype) => { recombinedCounts[haplotype] += 1; });
const recombinedTotal = Object.values(recombinedCounts).reduce((sum, value) => sum + value, 0);
Object.values(recombinedCounts).forEach((count) => assert.ok(Math.abs(count / recombinedTotal - 0.25) < 0.035, 'r=0.5 배우자 비율은 표본 오차 안에서 네 조합에 가깝습니다.'));

const neutral = runRepeat({ ...base, selectionOn: false }, 100);
assert.ok(Math.abs(neutral.aggregates.pA[1].mean - 0.5) < 0.04, '중립 100시드의 세대 1 평균 pA는 초기값에 가깝습니다.');
assert.ok(Math.abs(neutral.aggregates.pB[1].mean - 0.5) < 0.04, '중립 100시드의 세대 1 평균 pB는 초기값에 가깝습니다.');
const small = runRepeat({ ...base, N: 20, selectionOn: false }, 100).aggregates.pA.at(-1).values;
const large = runRepeat({ ...base, N: 200, selectionOn: false }, 100).aggregates.pA.at(-1).values;
assert.ok(variance(small) > variance(large) * 1.8, 'N=20의 반복 분산은 N=200보다 커야 합니다.');
assert.ok(finalPA({ ...base, selectionOn: true }) > 0.56, '환경 A 선택에서 pA는 100시드 평균으로 증가하는 경향을 보여야 합니다.');

const transition = runGenerations(createState({ ...base, environmentMode: 'transition' }), 20);
assert.equal(transition.history[10].environment, 'A', '환경 전환 전 10세대까지는 A입니다.');
assert.equal(transition.history[11].environment, 'B', '환경 B는 자녀 11세대부터 적용됩니다.');
const transitionAt10 = runGenerations(createState({ ...base, environmentMode: 'transition' }), 10);
const transitionAt11 = stepState(transitionAt10);
const expectedBChildren = reproduce(
  transitionAt10.population,
  'B',
  transitionAt10.settings.selectionOn,
  transitionAt10.settings.recombinationRate,
  deriveSeed(transitionAt10.settings.seed, transitionAt10.generation),
);
assert.deepEqual(transitionAt11.population, expectedBChildren, '11세대 자녀는 B 환경의 실제 선택 가중치로 생성됩니다.');
const transitionFinalPA = runRepeat({ ...base, environmentMode: 'transition' }, 100).aggregates.pA.at(-1).mean;
const fixedAFinalPA = runRepeat({ ...base, environmentMode: 'A' }, 100).aggregates.pA.at(-1).mean;
assert.ok(transitionFinalPA < fixedAFinalPA - 0.2, '10세대 이후 B 전환은 20세대 pA를 고정 A보다 낮춥니다.');

const allAb = Array.from({ length: 20 }, (_, index) => makeIndividual(`edge-ab-${index}`, ['ab', 'ab']));
const allAB = Array.from({ length: 20 }, (_, index) => makeIndividual(`edge-AB-${index}`, ['AB', 'AB']));
for (const population of [allAb, allAB]) {
  const edgeRun = runGenerations(createStateFromPopulation({ ...base, N: 20, selectionOn: false }, population), 20);
  edgeRun.history.forEach((entry) => { assert.equal(entry.summary.alleleFrequency.pA, population[0].haplotypes[0] === 'AB' ? 1 : 0, '돌연변이율 0이면 pA 경계가 보존됩니다.'); });
}

assert.throws(() => createState({ ...base, recombinationRate: 0.8 }), /재조합률/);
assert.throws(() => createState({ ...base, N: 0 }), /개체군 크기/);
for (const seed of ['', '   ', null, undefined]) assert.throws(() => createState({ ...base, seed }), /시드를 입력해 주세요/);
assert.doesNotThrow(() => createState({ ...base, seed: 0, recombinationRate: 0 }));
for (const recombinationRate of ['', '   ', null, undefined]) assert.throws(() => createState({ ...base, recombinationRate }), /재조합률/);
assert.doesNotThrow(() => createState({ ...base, recombinationRate: 0 }));
assert.throws(() => assertUsableWeights([0, 0]), /모든 개체/);
const comparison = compareNeutral(base);
assert.equal(comparison.selected.runs.length, 10, '선택 비교는 10회 반복을 갖습니다.');
assert.equal(comparison.neutral.runs.length, 10, '중립 비교는 10회 반복을 갖습니다.');
const neutralComparisonFromFalse = compareNeutral({ ...base, selectionOn: false });
assert.equal(neutralComparisonFromFalse.selected.runs[0].settings.selectionOn, true, '중립 비교의 selected 조건은 입력과 무관하게 선택을 켭니다.');
assert.equal(neutralComparisonFromFalse.neutral.runs[0].settings.selectionOn, false, '중립 비교의 neutral 조건은 선택을 끕니다.');
assert.equal(comparison.selected.runs[0].settings.selectionOn, true, '선택 입력에서도 selected 조건은 선택을 유지합니다.');
assert.equal(comparison.neutral.runs[0].settings.selectionOn, false, '중립 비교의 neutral 조건은 선택을 끕니다.');
assert.deepEqual(comparison.selected.seeds, comparison.neutral.seeds, '두 비교 조건은 같은 반복 seed를 사용합니다.');

const sizeCases = compareSizeAndRecombination({ ...base, N: 60 });
assert.deepEqual(sizeCases.map(({ settings }) => [settings.N, settings.recombinationRate]), [[20, 0], [60, 0], [200, 0], [60, 0.5]], '크기와 재조합 비교 조건을 모두 반환합니다.');
assert.ok(sizeCases.every(({ settings }) => settings.selectionOn === false), '크기와 재조합 비교는 중립 조건입니다.');
assert.notEqual(deriveSeed(base.seed, 0), deriveSeed(base.seed, 1), '세대별 실행 seed는 독립 스트림으로 분리됩니다.');
console.log(JSON.stringify({
  passed: true,
  note: '엔진 테스트 스위트 통과. 계산 모델과 입력 경계만 확인하며 교실 수용성을 의미하지 않습니다.',
  neutralGeneration1Mean: Number(neutral.aggregates.pA[1].mean.toFixed(4)),
  varianceN20: Number(variance(small).toFixed(5)),
  varianceN200: Number(variance(large).toFixed(5)),
  selectionFinalMeanPA: Number(finalPA({ ...base, selectionOn: true }).toFixed(4)),
  transitionFinalMeanPA: Number(transitionFinalPA.toFixed(4)),
  fixedAFinalMeanPA: Number(fixedAFinalPA.toFixed(4)),
}));
