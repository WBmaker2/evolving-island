# 구현 중간 리뷰

2026-09-11. 생성 실행 중의 스냅샷에 대한 잠정 검토이며 완료 후 재확인한다.

- stats.summarizeRepeats는 `alleleFrequency.pA` 문자열을 객체의 직접 키로 읽어 undefined/NaN을 만들 수 있다. 중첩 필드 접근과 유한값 검증 필요.
- compareNeutral의 selectedInput이 selectionOn=false를 그대로 받으면 중립 대 중립 비교가 된다. 비교의 선택쪽은 true를 강제해야 한다.
- 같은 genotype AaBb인 AB/ab와 Ab/aB를 유전자형 표에서 별도 genotype처럼 표현한다. 위상별 두 haplotype과 9가지 두 좌위 genotype을 구별해야 한다.
- IslandScene은 2D context 획득 후 같은 canvas의 WebGL을 요청하며, 실제 THREE.Scene/WebGLRenderer가 없다. 진짜 3D 경로와 실패 대체가 필요하다. app에서 population을 scene에 넘기는지도 확인한다.
- 전체 render가 textarea 초안과 초점을 날리며, Esc도 전체 렌더한다. 예측→실행→설명 수정 흐름과 키보드 연속 사용 검증 필요.
- 현재 필수 버튼 강조가 한 세대 실행에 고정되어 20세대 후 비활성 버튼에 남는다. 조건 변경시 초기화, 완료시 비교/기록으로 옮겨야 한다.
- pending settings와 active state.settings가 섞여 현재 결과/환경표/기록을 잘못 표기할 수 있다. 결과 기록은 실제 실행조건에 묶고 draft settings를 분리한다.
- 반복 결과의 두 좌위, 평균·중앙값·10~90백분위, seed별 수치표·범례·세대축을 실제 화면에서 확인한다. 선택-중립 비교도 평균 선만으로 끝내지 않는다.
- 크기·재조합 비교는 N과 r의 효과를 각각 통제한 쌍으로 비교하고 haplotype 유지/혼합을 표시한다. 현재 세 조건은 기본 N에서 r0 대 r0.5 쌍이 빠질 수 있다.
- 모바일 유전표→조건→실행→그래프 순서, 업데이트 모달의 초점 이동/반환, 데이터 결과 스냅샷의 사용자 조회 가능성 확인.
