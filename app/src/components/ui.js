import { HAPLOTYPES, PHENOTYPES } from '../domain/geneticsTypes.js';

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const percent = (value) => `${(value * 100).toFixed(1)}%`;

export function fitnessTable(rows) {
  return rows.map((row) => `<tr><th scope="row"><span class="pattern-label">${row.pattern}</span>${row.label}</th><td>${row.loci}</td><td><strong>${row.weight.toFixed(2)}</strong></td></tr>`).join('');
}

export function frequencyRows(summary) {
  return HAPLOTYPES.map((haplotype) => `<tr><th scope="row"><code>${haplotype}</code></th><td>${summary.haplotypeCount[haplotype]}개</td><td>${percent(summary.haplotypeFrequency[haplotype])}</td></tr>`).join('');
}

export function phenotypeRows(summary) {
  return PHENOTYPES.map((phenotype) => `<tr><th scope="row"><span class="pattern-label">${phenotype.pattern}</span>${phenotype.label}</th><td>${summary.phenotypeCount[phenotype.id]}마리</td><td>${percent(summary.phenotypeFrequency[phenotype.id])}</td></tr>`).join('');
}

export function genotypeRows(summary) {
  const entries = Object.entries(summary.genotypeCount).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([key, count]) => `<tr><th scope="row"><code>${key}</code></th><td>${count}마리</td><td>${percent(summary.genotypeFrequency[key])}</td></tr>`).join('') || '<tr><td colspan="3">아직 자녀 세대가 없습니다.</td></tr>';
}

export function individualCards(population, selectedIndex = null, organismAssetByPhenotype = {}) {
  return population.slice(0, 6).map((individual, index) => {
    const asset = organismAssetByPhenotype[individual.phenotype];
    const image = asset ? `<img class="individual-art" src="${escapeHtml(asset)}" alt="가상 개체 표현형 참고 이미지 · 실제 생물이나 유전 결과를 뜻하지 않음" loading="lazy" decoding="async">` : '';
    return `<button class="individual-card ${selectedIndex === index ? 'selected' : ''}" data-individual-index="${index}" data-od-id="individual-${index + 1}" aria-pressed="${selectedIndex === index}" aria-label="${index + 1}번 개체 ${individual.haplotypes.join('와')} 관찰">${image}<span class="individual-index">${String(index + 1).padStart(2, '0')}</span><strong>${individual.haplotypes[0]}</strong><span class="chromosome-slash">/</span><strong>${individual.haplotypes[1]}</strong><small>${individual.phenotype}</small></button>`;
  }).join('');
}
