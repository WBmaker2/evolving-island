# UI bounded QA 기록

공개 배포 workflow는 저장소의 `.github/workflows/pages.yml`에서 `app/` 정적 export를 GitHub Pages artifact로 올립니다. 공개 확인 주소: https://wbmaker2.github.io/evolving-island/

2026-09-11 · 이번 변경은 `src/app.js`, `src/components/ui.js`, `src/components/charts.js`, `src/styles.css` 범위에서 수행했습니다.

- 정적 검사: `node --check src/app.js`, `node --check src/components/ui.js`, `node --check src/components/charts.js` 통과.
- 메모 입력 이벤트가 초안 상태에 기록되고 렌더·실행·조건 변경·Esc 뒤 textarea 값과 caret을 복원하도록 확인했습니다.
- 적용 조건과 초안 조건을 분리하고, 기록에 N·seed·r·선택·환경·세대·반복수 및 structuredClone 결과 스냅샷을 남기도록 확인했습니다.
- 반복 결과에 p(A)·p(B) seed별 선, 평균·중앙값·p10·p90 표, seed별 최종 수치표를 표시하도록 확인했습니다.
- 업데이트 모달의 초점 진입·닫기 후 복귀·Tab 순환과 조건 변경 시 초기화 pulse 이동을 코드로 확인했습니다.
- 브라우저·모바일 실제 렌더 검증은 루트 에이전트가 space32에서 보완합니다. VoiceOver 및 음성 기능은 범위에서 제외했습니다.
- 후속 bounded 보완: 기록 상세에 실제 pA/pB·N·seed·r·선택·환경·세대·반복수와 스냅샷 상태를 표시하고 설명 편집 저장을 연결했습니다. 섬 생성 직후 population 렌더 호출, top/oblique 시점 버튼, data-action/data-individual-index/data-od-id 초점 복구, 모달 양방향 Tab trap과 Esc 닫기, 빈 seed의 자동 0 변환 방지를 추가했습니다. charts.js는 수정하지 않았습니다.
- 최종 bounded 보완: draft 조건 변경 시 반복·선택/중립·환경 전환·크기/재조합 비교 버튼을 모두 비활성화하고 공통 실행 가드를 추가했습니다. 기록 details 안에 snapshot type별 저장 차트(반복·선택/중립·크기/재조합·환경 전환)를 직접 렌더하도록 연결했습니다.
- 화면 수정 검증: 배경 이미지를 가리던 `CircleGeometry` 타원 레이어 두 개를 제거하고, 로컬 Preview와 공개 배포본에서 섬 풍경 전체·개체 표식·20세대·seed+i 10회 반복을 확인했습니다.
