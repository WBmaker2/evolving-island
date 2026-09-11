const COLORS = { pA: '#0c7c83', pB: '#1f6b4f', selected: '#0c7c83', neutral: '#a86d32' };
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const clamp = (value) => Math.max(0, Math.min(1, finite(value)));
const percent = (value) => `${(clamp(value) * 100).toFixed(1)}%`;
const x = (generation) => 36 + (generation / 20) * 328;
const y = (value) => 126 - clamp(value) * 98;
const pathFor = (points) => points.map((point, index) => `${index ? 'L' : 'M'} ${x(point.generation).toFixed(1)} ${y(point.value).toFixed(1)}`).join(' ');
const axis = () => '<line class="axis" x1="36" y1="28" x2="36" y2="126"/><line class="axis" x1="36" y1="126" x2="364" y2="126"/><line class="grid" x1="36" y1="77" x2="364" y2="77"/><text class="tick" x="8" y="32">1.0</text><text class="tick" x="14" y="81">0.5</text><text class="tick" x="22" y="130">0</text><text class="tick" x="34" y="144">0세대</text><text class="tick" x="338" y="144">20세대</text>';
const table = (aggregate, label) => `<div class="table-scroll"><table class="stats-table"><caption>${label} 평균 분포</caption><thead><tr><th>세대</th><th>평균</th><th>중앙값</th><th>p10</th><th>p90</th></tr></thead><tbody>${aggregate.map((entry) => `<tr><th scope="row">${entry.generation}</th><td>${(entry.mean * 100).toFixed(1)}%</td><td>${(entry.median * 100).toFixed(1)}%</td><td>${(entry.p10 * 100).toFixed(1)}%</td><td>${(entry.p90 * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table></div>`;

export function frequencyChart(history, title = '대립유전자 빈도') {
  const paths = ['pA', 'pB'].map((key, index) => `<path class="chart-line" stroke="${COLORS[key]}" ${index ? 'stroke-dasharray="7 4"' : ''} d="${pathFor(history.map((entry) => ({ generation: entry.generation, value: entry.summary.alleleFrequency[key] })))}"/><text class="chart-legend" x="${42 + index * 58}" y="18" fill="${COLORS[key]}">${key === 'pA' ? 'p(A) · 실선' : 'p(B) · 점선'}</text>`).join('');
  return `<div class="chart-wrap" data-od-id="allele-frequency-chart"><div class="chart-heading"><strong>${title}</strong><span>비율 · 세대 0~20 · y축 0~1</span></div><svg viewBox="0 0 390 150" role="img" aria-label="세대에 따른 p(A), p(B) 대립유전자 빈도 그래프">${axis()}${paths}</svg></div>`;
}

function repeatSvg(aggregate, key, title) {
  if (!aggregate?.length) return '';
  const dashes = ['', '7 4', '3 3', '10 3 2 3', '5 2 1 2', '12 4 2 4', '2 5', '9 2 2 2', '4 4 1 4', '14 3'];
  const lines = aggregate[0].values.map((_, runIndex) => `<path class="repeat-line" stroke-dasharray="${dashes[runIndex] || ''}" data-seed-index="${runIndex}" d="${pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.values[runIndex] })))}"><title>seed 반복 ${runIndex + 1}</title></path>`).join('');
  const band = aggregate.map((entry) => `${x(entry.generation)},${y(entry.p90)}`).join(' ');
  const lower = [...aggregate].reverse().map((entry) => `${x(entry.generation)},${y(entry.p10)}`).join(' ');
  const median = pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.median })));
  const mean = pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.mean })));
  return `<div class="chart-wrap repeat-wrap"><div class="chart-heading"><strong>${title}</strong><span>seed별 선 · 평균 점선 · 중앙값 실선 · p10~p90</span></div><svg viewBox="0 0 390 150" role="img" aria-label="seed별 반복과 평균 분포 그래프">${axis()}<polygon class="range-band" points="${band} ${lower}"/>${lines}<path class="mean-line" stroke-dasharray="6 4" d="${mean}"><title>평균</title></path><path class="median-line" d="${median}"><title>중앙값</title></path><text class="chart-legend" x="42" y="18">평균 점선 · 중앙값 실선 · seed dash</text></svg>${table(aggregate, key)}</div>`;
}

export function repeatChart(data) {
  if (!data?.aggregates) return '';
  const seedRows = data.runs.map((run) => `<tr><th scope="row">${run.settings.seed}</th><td>${(run.history.at(-1).summary.alleleFrequency.pA * 100).toFixed(1)}%</td><td>${(run.history.at(-1).summary.alleleFrequency.pB * 100).toFixed(1)}%</td></tr>`).join('');
  const settings = data.runs[0]?.settings;
  return `<div class="repeat-results"><div class="chart-heading"><strong>seed+i ${data.seeds.length}회 반복</strong><span>seed 범위 ${Math.min(...data.seeds)}~${Math.max(...data.seeds)} · N=${settings?.N ?? '—'} · r=${settings?.recombinationRate ?? '—'} · env=${settings?.environmentMode ?? '—'} · 세대 0~20 · y축 0~1</span></div>${repeatSvg(data.aggregates.pA, 'p(A)', 'p(A) 반복 분포')}${repeatSvg(data.aggregates.pB, 'p(B)', 'p(B) 반복 분포')}<div class="table-scroll"><table class="stats-table"><caption>seed별 최종 수치 · 각 선의 data-seed-index/title로 식별</caption><thead><tr><th>seed</th><th>p(A)</th><th>p(B)</th></tr></thead><tbody>${seedRows}</tbody></table></div></div>`;
}

export function comparisonChart(comparison) {
  if (!comparison) return '';
  const dashes = ['', '7 4', '3 3', '10 3 2 3', '5 2 1 2', '12 4 2 4', '2 5', '9 2 2 2', '4 4 1 4', '14 3'];
  const panel = (condition, key, color, label) => {
    const aggregate = condition.aggregates[key];
    const lines = aggregate[0].values.map((_, index) => `<path class="comparison-line" stroke="${color}" stroke-dasharray="${dashes[index] || ''}" data-seed-index="${index}" d="${pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.values[index] })))}"><title>${label} seed 반복 ${index + 1}</title></path>`).join('');
    const upper = aggregate.map((entry) => `${x(entry.generation)},${y(entry.p90)}`).join(' ');
    const lower = [...aggregate].reverse().map((entry) => `${x(entry.generation)},${y(entry.p10)}`).join(' ');
    const mean = pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.mean })));
    const median = pathFor(aggregate.map((entry) => ({ generation: entry.generation, value: entry.median })));
    const rows = aggregate.map((entry) => `<tr><th scope="row">${entry.generation}</th><td>${percent(entry.mean)}</td><td>${percent(entry.median)}</td><td>${percent(entry.p10)}~${percent(entry.p90)}</td></tr>`).join('');
    return `<section class="comparison-panel"><div class="chart-heading"><strong>${label} · ${key === 'pA' ? 'p(A)' : 'p(B)'}</strong><span>N=${condition.runs[0]?.settings.N} · r=${condition.runs[0]?.settings.recombinationRate} · env=${condition.runs[0]?.settings.environmentMode} · seed ${Math.min(...condition.seeds)}~${Math.max(...condition.seeds)}</span></div><svg viewBox="0 0 390 150" role="img" aria-label="${label} ${key} seed별 분포 그래프">${axis()}<polygon class="range-band" points="${upper} ${lower}"/>${lines}<path class="comparison-line" stroke="${color}" stroke-dasharray="6 4" d="${mean}"><title>평균</title></path><path class="median-line" stroke="${color}" d="${median}"><title>중앙값</title></path><text class="chart-legend" x="42" y="18" fill="${color}">${label} · seed dash · 평균 점선 · 중앙값 실선</text></svg><div class="table-scroll"><table class="stats-table"><caption>${label} ${key} 세대별 수치</caption><thead><tr><th>세대</th><th>평균</th><th>중앙값</th><th>p10~p90</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  };
  const endRows = ['pA', 'pB'].map((key) => `<tr><th scope="row">${key === 'pA' ? 'p(A)' : 'p(B)'}</th><td>${percent(comparison.selected.aggregates[key].at(-1).mean)}</td><td>${percent(comparison.neutral.aggregates[key].at(-1).mean)}</td></tr>`).join('');
  return `<div class="comparison-results"><div class="chart-heading"><strong>선택·중립 두 좌위 분포 비교</strong><span>p(A)/p(B) 패널 · 각 조건 seed별 10선 · 평균/중앙값/p10~p90 band · 세대 0~20 · 비율 0~1</span></div><div class="comparison-grid">${panel(comparison.selected, 'pA', COLORS.selected, '선택')}${panel(comparison.neutral, 'pA', COLORS.neutral, '중립')}${panel(comparison.selected, 'pB', COLORS.selected, '선택')}${panel(comparison.neutral, 'pB', COLORS.neutral, '중립')}</div><div class="chart-legend">선택 청록 · 중립 갈색 · seed별 dash와 title로 식별 · 평균 점선 · 중앙값 실선</div><div class="table-scroll"><table class="stats-table"><caption>최종 평균 비교</caption><thead><tr><th>좌위</th><th>선택</th><th>중립</th></tr></thead><tbody>${endRows}</tbody></table></div></div>`;
}

const summaryField = (run, path) => path.split('.').reduce((value, key) => value?.[key], run.history.at(-1).summary);
const summarizeValues = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (q) => {
    if (!sorted.length) return 0;
    const position = (sorted.length - 1) * q;
    const low = Math.floor(position); const high = Math.ceil(position);
    return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
  };
  const mean = values.reduce((sum, value) => sum + finite(value), 0) / (values.length || 1);
  return { mean, variance: values.reduce((sum, value) => sum + (finite(value) - mean) ** 2, 0) / (values.length || 1), p10: quantile(0.1), p90: quantile(0.9) };
};

export function sizeRecombinationChart(cases) {
  if (!Array.isArray(cases) || !cases.length) return '';
  const sizeCases = cases.filter(({ settings }) => settings.recombinationRate === 0);
  const haplotypes = ['AB', 'Ab', 'aB', 'ab'];
  const sizeRows = sizeCases.map(({ settings, result }) => {
    const pA = summarizeValues(result.runs.map((run) => summaryField(run, 'alleleFrequency.pA')));
    const pB = summarizeValues(result.runs.map((run) => summaryField(run, 'alleleFrequency.pB')));
    return `<tr><th scope="row">N=${settings.N}</th><td>${percent(pA.mean)}</td><td>${pA.variance.toFixed(4)}</td><td>${percent(pA.p10)}~${percent(pA.p90)}</td><td>${percent(pB.mean)}</td><td>${pB.variance.toFixed(4)}</td><td>${percent(pB.p10)}~${percent(pB.p90)}</td></tr>`;
  }).join('');
  const baseCase = cases.find(({ settings }) => settings.recombinationRate === 0.5);
  const baseN = baseCase?.settings.N;
  const recombinationCases = cases.filter(({ settings }) => settings.N === baseN && (settings.recombinationRate === 0 || settings.recombinationRate === 0.5));
  const recombinationRows = recombinationCases.map(({ settings, result }) => `<tr><th scope="row">N=${settings.N}, r=${settings.recombinationRate}</th>${haplotypes.map((haplotype) => `<td>${percent(summarizeValues(result.runs.map((run) => summaryField(run, `haplotypeFrequency.${haplotype}`))).mean)}</td>`).join('')}</tr>`).join('');
  return `<div class="size-recombination-results"><div class="chart-heading"><strong>개체군 크기·재조합 비교</strong><span>중립 조건 · 10회 seed 반복 · 최종 20세대</span></div><div class="table-scroll"><table class="stats-table"><caption>N별 중립 r=0 최종 p(A)/p(B) 분포</caption><thead><tr><th>N</th><th>p(A) 평균</th><th>p(A) 분산</th><th>p(A) p10~p90</th><th>p(B) 평균</th><th>p(B) 분산</th><th>p(B) p10~p90</th></tr></thead><tbody>${sizeRows}</tbody></table></div><div class="table-scroll"><table class="stats-table"><caption>기본 N의 r별 최종 haplotype 평균 빈도</caption><thead><tr><th>조건</th>${haplotypes.map((haplotype) => `<th>${haplotype}</th>`).join('')}</tr></thead><tbody>${recombinationRows}</tbody></table></div><p class="chart-note">작은 N은 반복 결과의 변동 폭이 커지고, 재조합률이 높으면 네 haplotype 조합의 분포가 달라집니다. 평균은 10개 seed의 최종 빈도입니다.</p></div>`;
}
