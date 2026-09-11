import { PHENOTYPES } from './domain/geneticsTypes.js';
import { environmentForGeneration, fitnessRows } from './engine/selection.js';
import { compareNeutral, compareSizeAndRecombination, createState, runGenerations, runRepeat, stepState } from './engine/simulation.js';
import { summarizePopulation } from './engine/stats.js';
import { frequencyChart, repeatChart, comparisonChart, sizeRecombinationChart } from './components/charts.js';
import { escapeHtml, fitnessTable, frequencyRows, genotypeRows, individualCards, percent, phenotypeRows } from './components/ui.js';
import { IslandScene } from './renderers/IslandScene.js';

const root = document.querySelector('#app');
const initialSettings = { N: 60, seed: 7, recombinationRate: 0, selectionOn: true, environmentMode: 'A', mutationRate: 0 };
let draft = { ...initialSettings, observation: '', prediction: '', explanation: '' };
let state = createState(initialSettings);
let currentResults = null;
let records = [];
let selectedIndex = null;
let lastError = '';
let scene;
let modalReturnFocus = null;

const activeSettings = () => state.settings;
const settingsSnapshot = (settings) => structuredClone({ N: settings.N, seed: settings.seed, recombinationRate: settings.recombinationRate, selectionOn: settings.selectionOn, environmentMode: settings.environmentMode, mutationRate: 0 });
const settingsChangedSinceReset = () => JSON.stringify(settingsSnapshot(draft)) !== JSON.stringify(settingsSnapshot(activeSettings()));
const environmentLabel = (mode, generation = state.generation) => mode === 'transition' ? `A → B · ${generation < 11 ? '현재 A' : '현재 B'}` : `환경 ${mode}`;
const modeLabel = (mode) => mode === 'transition' ? 'A→B' : mode;

function selectedDetail() {
  const individual = state.population[selectedIndex];
  if (!individual) return '선택이 해제되었습니다.';
  const phenotype = PHENOTYPES.find((item) => item.id === individual.phenotype);
  return `${individual.id} · 염색체 1 <code>${individual.haplotypes[0]}</code> / 염색체 2 <code>${individual.haplotypes[1]}</code> · ${phenotype.pattern} ${phenotype.label}`;
}

function phase() {
  if (currentResults && draft.explanation.trim()) return 'explain';
  if (currentResults) return 'compare';
  if (state.generation >= 20) return 'compare';
  if (state.generation > 0) return 'run';
  return 'predict';
}

function pulseAction() {
  if (settingsChangedSinceReset()) return 'reset';
  if (state.generation >= 20) return currentResults ? 'save-record' : 'repeat';
  return 'run-one';
}

function flowSteps() {
  const current = phase();
  return [['observe', '01 관찰'], ['predict', '02 예측'], ['run', '03 실행'], ['compare', '04 비교'], ['explain', '05 설명 수정']].map(([key, label]) => `<span class="flow-step ${key === current ? 'current' : ''} ${['compare', 'explain'].includes(key) && ['compare', 'explain'].includes(current) ? 'available' : ''}">${label}</span>`).join('');
}

function renderControls() {
  const active = activeSettings();
  const environment = environmentForGeneration(active.environmentMode, state.generation);
  const rows = fitnessRows(environment, active.selectionOn);
  const pulse = pulseAction();
  const pulseClass = (action) => pulse === action ? ' gi-pulse' : '';
  return `<div class="panel-head"><div><h3 data-od-id="genetics-panel-title">유전 실험실</h3><p>현재 조건은 실행된 상태이고, 입력 중인 조건은 초안으로 표시됩니다.</p></div><span class="status-chip"><strong>${state.generation}</strong> / 20세대</span></div>
    <section class="panel-section" data-od-id="conditions-section"><h4 class="section-title">조건 설정 <span class="draft-badge">${settingsChangedSinceReset() ? '초안' : '적용됨'}</span></h4><p class="section-copy">표·풍경·결과 헤더는 적용된 조건을 가리킵니다. 조건을 바꾼 뒤 초기화해야 실행할 수 있습니다.</p>
      <div class="settings-grid"><div class="field"><label for="population-size">개체군 N <span>초안</span></label><select id="population-size"><option value="20" ${draft.N === 20 ? 'selected' : ''}>20</option><option value="60" ${draft.N === 60 ? 'selected' : ''}>60 · 기본</option><option value="200" ${draft.N === 200 ? 'selected' : ''}>200</option></select></div>
      <div class="field"><label for="seed-input">시드 <span>초안</span></label><input id="seed-input" type="number" min="0" step="1" value="${draft.seed}"></div>
      <div class="field"><label for="environment-mode">환경 모드 <span>${environmentLabel(active.environmentMode)}</span></label><select id="environment-mode"><option value="A" ${draft.environmentMode === 'A' ? 'selected' : ''}>A · A 우성 표현형 유리</option><option value="B" ${draft.environmentMode === 'B' ? 'selected' : ''}>B · 역방향</option><option value="transition" ${draft.environmentMode === 'transition' ? 'selected' : ''}>A → B · 11세대부터 B</option></select></div>
      <div class="field"><label for="recombination-rate">재조합률 r <span id="r-value">${Number(draft.recombinationRate).toFixed(2)}</span></label><input id="recombination-rate" type="range" min="0" max="0.5" step="0.05" value="${draft.recombinationRate}"><p class="help-text">r=0은 부모 haplotype 조합을 보존하고, r=0.5는 두 좌위가 섞일 기회를 높입니다.</p></div></div>
      <div class="choice-row"><button class="choice-button ${draft.selectionOn ? 'active' : ''}" data-action="selection-on">선택 켜기<br><small>환경별 w 적용</small></button><button class="choice-button ${!draft.selectionOn ? 'active' : ''}" data-action="selection-off">중립<br><small>모든 w=1</small></button></div>
      <div id="input-error" class="error-box ${lastError || settingsChangedSinceReset() ? 'show' : ''}" role="alert">${escapeHtml(lastError || '조건 초안이 있습니다. 실험 초기화로 적용하세요.')}</div>
      <div class="button-row" style="margin-top:12px"><button class="outline-button${pulseClass('reset')}" data-action="reset" data-od-id="reset-experiment">실험 초기화</button><button class="text-button" data-action="updates" data-od-id="updates-button">업데이트 내역</button></div>
    </section>
    <section class="panel-section" data-od-id="fitness-section"><h4 class="section-title">${environmentLabel(active.environmentMode)}</h4><p class="section-copy">아래 수치는 특정 종의 실측치가 아니라, 방향을 비교하기 위한 교육용 가상 상수입니다.</p><div class="table-scroll"><table><thead><tr><th>표현형</th><th>기호</th><th>상대 번식 w</th></tr></thead><tbody>${fitnessTable(rows)}</tbody></table></div></section>
    <section class="panel-section"><h4 class="section-title">haplotype 빈도 · 분모 2N</h4><div class="table-scroll"><table><thead><tr><th>조합</th><th>복사본</th><th>빈도</th></tr></thead><tbody>${frequencyRows(state.history.at(-1).summary)}</tbody></table></div></section>
    <section class="panel-section" data-od-id="run-controls"><h4 class="section-title">실행</h4><p class="section-copy">적용된 조건에서 배우자 2N개를 표본 추출합니다.</p><div class="button-row" style="margin-top:12px"><button class="primary-button${pulseClass('run-one')}" data-action="run-one" data-od-id="run-one-generation" ${state.generation >= 20 || settingsChangedSinceReset() ? 'disabled' : ''}>한 세대 실행</button><button class="outline-button" data-action="run-20" data-od-id="run-twenty-generations" ${settingsChangedSinceReset() ? 'disabled' : ''}>20세대 실행</button></div><div class="button-row" style="margin-top:8px"><button class="outline-button${pulseClass('repeat')}" data-action="repeat" data-od-id="repeat-seeds" ${settingsChangedSinceReset() ? 'disabled' : ''}>seed+i 10회 반복</button><button class="outline-button" data-action="neutral" data-od-id="neutral-compare" ${settingsChangedSinceReset() ? 'disabled' : ''}>동일 초기·선택/중립 비교</button><button class="outline-button" data-action="transition" data-od-id="transition-run" ${settingsChangedSinceReset() ? 'disabled' : ''}>환경 전환 실행</button><button class="outline-button" data-action="size-recomb" data-od-id="size-recomb-compare" ${settingsChangedSinceReset() ? 'disabled' : ''}>크기·재조합 비교</button></div></section>`;
}

function resultExtra() {
  if (currentResults?.type === 'repeat') return repeatChart(currentResults.data);
  if (currentResults?.type === 'neutral') return comparisonChart(currentResults.data);
  if (currentResults?.type === 'transition') return frequencyChart(currentResults.state.history, '환경 전환 · p(A), p(B)');
  if (currentResults?.type === 'size-recomb') return sizeRecombinationChart(currentResults.data);
  return '';
}

function recordSnapshotView(record) {
  const snapshot = record.snapshot;
  if (!snapshot) return '<p class="section-copy">현재 세대 결과 스냅샷입니다.</p>';
  if (snapshot.type === 'repeat') return `<h5>저장된 반복 비교 결과</h5>${repeatChart(snapshot.data)}`;
  if (snapshot.type === 'neutral') return `<h5>저장된 선택·중립 비교 결과</h5>${comparisonChart(snapshot.data)}`;
  if (snapshot.type === 'size-recomb') return `<h5>저장된 크기·재조합 비교 결과</h5>${sizeRecombinationChart(snapshot.data)}`;
  if (snapshot.type === 'transition') return `<h5>저장된 환경 전환 결과</h5>${frequencyChart(snapshot.state.history, '환경 전환 · 저장된 p(A), p(B)')}`;
  return '<p class="section-copy">저장된 단일 실행 결과</p>';
}

function renderRecords() {
  if (!records.length) return '<p class="section-copy">아직 기록이 없습니다. 실행 전 예측과 실행 후 설명을 남겨 보세요.</p>';
  return records.map((record, index) => { const summary = record.result?.alleleFrequency || {}; const repeatCount = record.repeatCount || (record.kind.includes('반복') || record.kind.includes('비교') ? 10 : 0); return `<article class="record" data-record-index="${index}"><small>${record.kind} · N=${record.settings.N}, seed=${record.settings.seed}, r=${record.settings.recombinationRate}, ${record.settings.selectionOn ? '선택' : '중립'}, 환경 ${modeLabel(record.settings.environmentMode)}, 세대 ${record.generation}, 반복 ${repeatCount}회</small><div class="record-stats"><span>p(A) <strong>${percent(summary.pA ?? 0)}</strong></span><span>p(B) <strong>${percent(summary.pB ?? 0)}</strong></span><span>N <strong>${record.settings.N}</strong></span><span>세대 <strong>${record.generation}</strong></span></div>${record.observation ? `<p><strong>관찰</strong> ${escapeHtml(record.observation)}</p>` : ''}${record.prediction ? `<p><strong>예측</strong> ${escapeHtml(record.prediction)}</p>` : ''}<div class="field record-edit"><label for="record-explanation-${index}">설명 수정</label><textarea id="record-explanation-${index}">${escapeHtml(record.explanation || '')}</textarea><button class="outline-button" data-action="save-record-edit" data-record-index="${index}">설명 저장</button></div><details><summary>실행 데이터 보기</summary><div class="table-scroll"><table class="record-data"><tbody><tr><th>p(A), p(B)</th><td>${percent(summary.pA ?? 0)}, ${percent(summary.pB ?? 0)}</td></tr><tr><th>N · seed · r</th><td>${record.settings.N} · ${record.settings.seed} · ${record.settings.recombinationRate}</td></tr><tr><th>선택 · 환경 · 세대 · 반복</th><td>${record.settings.selectionOn ? '선택' : '중립'} · ${modeLabel(record.settings.environmentMode)} · ${record.generation} · ${repeatCount}회</td></tr></tbody></table></div>${recordSnapshotView(record)}</details></article>`; }).join('');
}

function renderResults() {
  const summary = state.history.at(-1).summary;
  return `<section class="results" data-od-id="results-section"><div class="panel-head" style="padding-left:0;padding-right:0;border:0"><div><h3>결과 읽기</h3><p>현재 적용 조건의 표와 그래프입니다. 반복 결과에는 seed별 선과 수치 분포가 함께 표시됩니다.</p></div><span class="status-chip">${state.lastRun}</span></div><div class="results-grid"><article class="result-card wide" data-od-id="frequency-result"><h4 class="section-title">현재 세대 요약 · ${state.generation}세대 · ${environmentLabel(activeSettings().environmentMode)}</h4><div class="summary-strip"><div class="metric"><small>p(A) · 분모 2N</small><strong>${percent(summary.alleleFrequency.pA)}</strong></div><div class="metric"><small>p(B) · 분모 2N</small><strong>${percent(summary.alleleFrequency.pB)}</strong></div><div class="metric"><small>개체군 N · 분모 N</small><strong>${summary.N}마리</strong></div></div>${frequencyChart(state.history)}</article>${resultExtra() ? `<article class="result-card wide" data-od-id="repeat-result">${resultExtra()}</article>` : ''}<article class="result-card"><h4 class="section-title">유전자형 비율 · 9가지 두 좌위 조합</h4><div class="table-scroll"><table><thead><tr><th>유전자형</th><th>개체 수</th><th>비율</th></tr></thead><tbody>${genotypeRows(summary)}</tbody></table></div></article><article class="result-card"><h4 class="section-title">표현형 비율 · 분모 N</h4><div class="table-scroll"><table><thead><tr><th>패턴과 표현형</th><th>개체 수</th><th>비율</th></tr></thead><tbody>${phenotypeRows(summary)}</tbody></table></div></article><article class="result-card wide record-form" data-od-id="learning-record"><h4 class="section-title">관찰 → 예측 → 설명 수정</h4><p class="section-copy">입력 중인 메모는 실행·조건 변경·Esc 뒤에도 보존되며, 저장 시 실제 적용 조건과 결과 스냅샷에 묶입니다.</p><div class="settings-grid"><div class="field"><label for="observation-input">관찰</label><textarea id="observation-input" placeholder="예: 현재 개체의 두 염색체는…">${escapeHtml(draft.observation)}</textarea></div><div class="field"><label for="prediction-input">실행 전 예측</label><textarea id="prediction-input" placeholder="예: 환경 A에서 …할 것 같습니다.">${escapeHtml(draft.prediction)}</textarea></div></div><div class="field" style="margin-top:12px"><label for="explanation-input">실행 후 설명 수정</label><textarea id="explanation-input" placeholder="그래프의 평균·변동·조건을 근거로 설명을 고쳐 보세요.">${escapeHtml(draft.explanation)}</textarea></div><div class="button-row" style="margin-top:12px"><button class="outline-button${pulseAction() === 'save-record' ? ' gi-pulse' : ''}" data-action="save-record" data-od-id="save-learning-record">현재 기록 저장</button></div><div class="record-list">${renderRecords()}</div></article></div><p class="footer-note">모델 한계: 한 종·두 좌위·고정 N·돌연변이율 0인 교육용 확률 모형입니다. 실제 생물의 적응이나 섬의 미래를 예측하는 도구가 아닙니다.</p></section>`;
}

function focusSnapshot() {
  const element = document.activeElement;
  if (!element || !root.contains(element)) return null;
  return { id: element.id || '', action: element.dataset.action || '', individual: element.dataset.individualIndex ?? '', odId: element.dataset.odId || '', start: typeof element.selectionStart === 'number' ? element.selectionStart : null, end: typeof element.selectionEnd === 'number' ? element.selectionEnd : null };
}

function render() {
  const focus = focusSnapshot();
  scene?.dispose?.();
  const active = activeSettings();
  root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="brand"><span class="brand-mark">A·B</span><div><p class="eyebrow">GENETICS INQUIRY LAB</p><h1>진화하는 섬</h1></div></div><div class="top-actions"><span class="status-chip">세대 <strong>${state.generation}/20</strong></span><span class="status-chip">적용 환경 <strong>${modeLabel(active.environmentMode)}</strong></span><span class="status-chip">적용 seed <strong>${active.seed}</strong></span></div></header><main><section class="hero" data-od-id="hero"><div><h2>섬의 변화에서<br>선택과 우연을 읽습니다</h2><p>같은 시작 개체군을 여러 시드로 반복하면서 환경별 번식 가중치와 유한 표본 추출의 흔적을 비교합니다.</p></div><aside class="hero-note"><strong>현재 적용 조건</strong><span>초기 p(A)=p(B)=0.5 · 이배체 N=${active.N} · 현재 세대 ${state.generation} · r=${active.recombinationRate.toFixed(2)}</span></aside></section><nav class="flow-row" aria-label="탐구 단계">${flowSteps()}</nav><section class="workspace"><section class="island-panel" data-od-id="island-panel"><div class="panel-head"><div><h3>가상의 섬 공간</h3><p>풍경은 맥락용입니다. 수치는 표와 그래프에서 확인합니다.</p></div><span id="scene-mode" class="status-chip">2D 대체 화면</span></div><div class="scene-shell"><div id="island-scene" aria-label="건조 해안과 습윤 숲으로 나뉜 가상의 섬"></div><span class="scene-tag">${environmentLabel(active.environmentMode)}</span></div><div class="scene-legend"><span><i class="legend-dot"></i>건조 해안 · 환경 A</span><span><i class="legend-dot sand"></i>습윤 숲 · 환경 B</span></div><div class="button-row scene-views"><button class="text-button" data-action="view-top">위에서 보기</button><button class="text-button" data-action="view-oblique">비스듬히 보기</button></div><section class="initial-observation"><h4 class="section-title">현재 개체 6마리의 두 염색체 읽기</h4><p class="section-copy">개체를 고르면 두 haplotype과 표현형 기호를 확인합니다. Esc는 선택만 취소합니다.</p><div class="individual-grid">${individualCards(state.population, selectedIndex)}</div><p id="individual-detail" class="help-text" aria-live="polite">${selectedIndex === null ? '개체 카드를 선택해 관찰 기록의 단서를 확인하세요.' : selectedDetail()}</p></section></section><section class="panel control-panel" data-od-id="control-panel">${renderControls()}</section></section>${renderResults()}</main><div id="updates-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="updates-title"><section class="modal"><h3 id="updates-title">업데이트 내역</h3><p>2026-09-11 · 첫 구현: 두 좌위 이배체 엔진, 선택·중립·환경 전환, 반복·분포 그래프, haplotype·유전자형·표현형 표를 연결했습니다.</p><p>2026-09-11 · 개선: 초안 메모리, active/draft 조건 분리, 실행 결과 스냅샷, 9가지 유전자형 표, seed별 반복 수치표를 추가했습니다.</p><p>2026-09-11 · 수정: 섬 풍경을 가리던 장식 타원 레이어를 제거하고 원본 이미지가 온전히 보이도록 정리했습니다.</p><div class="button-row"><button class="outline-button" data-action="close-updates">닫기</button></div></section></div></div>`;
  scene = new IslandScene(document.querySelector('#island-scene'), './assets/island-context.png');
  scene.render?.(state.population);
  document.querySelector('#island-scene').addEventListener('scene-ready', (event) => { document.querySelector('#scene-mode').textContent = event.detail.mode; });
  if (focus) { const selector = focus.id ? `#${CSS.escape(focus.id)}` : focus.individual !== '' ? `[data-individual-index="${focus.individual}"]` : focus.action ? `[data-action="${focus.action}"]` : focus.odId ? `[data-od-id="${focus.odId}"]` : ''; const next = selector ? document.querySelector(selector) : null; next?.focus(); if (focus.start !== null && typeof next?.setSelectionRange === 'function') next.setSelectionRange(focus.start, focus.end); }
}

function safeRun(task) { try { lastError = ''; task(); } catch (error) { lastError = error.message; } render(); }

function handleAction(action, payload = {}) {
  if (settingsChangedSinceReset() && ['repeat', 'neutral', 'transition', 'size-recomb'].includes(action)) { lastError = '조건 초안이 있습니다. 먼저 실험 초기화로 적용하세요.'; render(); return; }
  if (action === 'selection-on' || action === 'selection-off') { draft = { ...draft, selectionOn: action === 'selection-on' }; render(); return; }
  if (action === 'reset') { safeRun(() => { state = createState(settingsSnapshot(draft)); currentResults = null; selectedIndex = null; }); return; }
  if (action === 'run-one') { safeRun(() => { if (settingsChangedSinceReset()) throw new Error('조건 초안이 있습니다. 먼저 실험 초기화로 적용하세요.'); state = stepState(state); currentResults = null; }); return; }
  if (action === 'run-20') { safeRun(() => { if (settingsChangedSinceReset()) throw new Error('조건 초안이 있습니다. 먼저 실험 초기화로 적용하세요.'); state = runGenerations(state, 20); currentResults = null; }); return; }
  if (action === 'repeat') { safeRun(() => { currentResults = { type: 'repeat', data: runRepeat(settingsSnapshot(activeSettings()), 10) }; }); return; }
  if (action === 'neutral') { safeRun(() => { currentResults = { type: 'neutral', data: compareNeutral(settingsSnapshot(activeSettings())) }; }); return; }
  if (action === 'transition') { safeRun(() => { const transitionSettings = { ...settingsSnapshot(activeSettings()), environmentMode: 'transition' }; state = runGenerations(createState(transitionSettings), 20); draft = { ...draft, ...transitionSettings }; currentResults = { type: 'transition', state: structuredClone(state) }; }); return; }
  if (action === 'size-recomb') { safeRun(() => { currentResults = { type: 'size-recomb', data: compareSizeAndRecombination(settingsSnapshot(activeSettings())) }; }); return; }
  if (action === 'view-top' || action === 'view-oblique') { scene?.setView?.(action === 'view-top' ? 'top' : 'oblique'); return; }
  if (action === 'save-record-edit') { const index = Number(payload.recordIndex); const input = document.querySelector(`#record-explanation-${index}`); if (records[index] && input) { records[index] = { ...records[index], explanation: input.value }; draft = { ...draft, explanation: input.value }; render(); } return; }
  if (action === 'save-record') { const values = { observation: draft.observation.trim(), prediction: draft.prediction.trim(), explanation: draft.explanation.trim() }; if (!values.observation && !values.prediction && !values.explanation) { lastError = '관찰, 예측, 설명 중 하나 이상을 적어 주세요.'; render(); return; } records = [...records, { kind: currentResults?.type === 'repeat' ? '반복 기록' : currentResults?.type === 'neutral' || currentResults?.type === 'size-recomb' ? '비교 기록' : state.generation ? '실행 후 기록' : '실행 전 기록', generation: state.generation, repeatCount: currentResults?.type === 'repeat' || currentResults?.type === 'neutral' || currentResults?.type === 'size-recomb' ? 10 : 0, settings: structuredClone(activeSettings()), observation: values.observation, prediction: values.prediction, explanation: values.explanation, result: structuredClone(summarizePopulation(state.population)), snapshot: structuredClone(currentResults) }]; lastError = ''; render(); return; }
  if (action === 'updates') { modalReturnFocus = document.activeElement; const modal = document.querySelector('#updates-modal'); modal?.classList.add('open'); modal?.querySelector('button')?.focus(); return; }
  if (action === 'close-updates') { document.querySelector('#updates-modal')?.classList.remove('open'); modalReturnFocus?.focus?.(); }
}

root.addEventListener('click', (event) => { const actionButton = event.target.closest('[data-action]'); if (actionButton && !actionButton.disabled) handleAction(actionButton.dataset.action, actionButton.dataset); const card = event.target.closest('[data-individual-index]'); if (card) { selectedIndex = Number(card.dataset.individualIndex); render(); } });
root.addEventListener('input', (event) => { const map = { 'observation-input': 'observation', 'prediction-input': 'prediction', 'explanation-input': 'explanation' }; if (map[event.target.id]) draft = { ...draft, [map[event.target.id]]: event.target.value }; });
root.addEventListener('change', (event) => { const values = { 'population-size': ['N', Number], 'seed-input': ['seed', (value) => value === '' ? '' : Number(value)], 'environment-mode': ['environmentMode', String], 'recombination-rate': ['recombinationRate', Number] }; const item = values[event.target.id]; if (item) { draft = { ...draft, [item[0]]: item[1](event.target.value) }; render(); } });
document.addEventListener('keydown', (event) => { const modal = document.querySelector('#updates-modal'); if (event.key === 'Escape' && modal?.classList.contains('open')) { event.preventDefault(); modal.classList.remove('open'); modalReturnFocus?.focus?.(); return; } if (event.key === 'Escape') { selectedIndex = null; render(); return; } if (event.key === 'Tab' && modal?.classList.contains('open')) { const focusables = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]; const first = focusables[0]; const last = focusables.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } });

render();
