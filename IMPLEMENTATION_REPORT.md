# 진화하는 섬 — 구현·검증 보고

작성일: 2026-09-11

## 확인 링크

- [Open Design Studio](http://127.0.0.1:64527/projects/project-50b0/conversations/e0cc4735-f741-48b8-8c22-6abc8390772c/files/index.html)
- [실행 가능한 Preview](http://127.0.0.1:64519/api/projects/project-50b0/raw/index.html)
- [공개 배포본 · GitHub Pages](https://wbmaker2.github.io/evolving-island/)
- [GitHub 저장소](https://github.com/WBmaker2/evolving-island)
- [Pages 배포 workflow](https://github.com/WBmaker2/evolving-island/actions/workflows/pages.yml)
- 이전 공개 확인본: [Vercel production](https://app-green-two-32.vercel.app/)

앞의 두 링크는 현재 컴퓨터의 Open Design 실행에 연결된 로컬 주소라 Open Design 재시작 후 포트가 달라질 수 있다. 공개 확인에는 GitHub Pages 주소를 사용한다.

## 구현 범위

- 두 좌위·이배체, 고정 N=20/60/200, 0~20세대, 재조합률 0~0.5, 돌연변이 0.
- 부모 가중 선택과 감수분열로 2N 배우자를 직접 생성한다. 같은 초기 상태와 seed+i 반복을 사용한다.
- 두 좌위 빈도, 9가지 유전자형, 표현형, haplotype 표. 평균·중앙값·10~90백분위와 시드별 선·수치표.
- 선택/중립 비교, 자녀 11세대부터 환경 B 적용, 크기별 중립 변산과 재조합별 haplotype 비교.
- 생성 풍경과 실제 Three.js 개체 표시, 두 시점, WebGL 실패 시 2D 대체.
- 관찰·예측·설명 초안 보존, 조건과 결과의 세션 스냅샷, 저장된 비교 결과 재조회, 기록 설명 편집.
- 밝은 테마, 필수 버튼 하나의 gi-pulse, 모션 감소, 업데이트 내역.

## 제작 경로

사용자가 Local Codex + gpt-5.6-luna를 승인했다. Open Design에 해당 모델을 지정하여 첫 구현을 생성했다. 첫 생성은 성공 상태였으나 브라우저 검증이 남아 있었고, 후속 실행 요청은 기존 제작 흐름의 충돌 오류로 거절됐다. 새로운 프로젝트나 유료 실행 방식으로 전환하지 않고 Luna 작업들이 동일 프로젝트 파일을 직접 수정했다. 최종 기능 검증은 수정된 파일을 실제로 제공하는 Preview에서 별도로 수행했다.

## 엔진 검증

`npm run test:engine` 통과. 복제성, N/2N 보존, r=0/.5, 0/1 경계, 중립 평균·분산, 선택 경향, 환경 전환의 실제 자녀 계산, 잘못된 입력, 모든 가중치 0, 유전자형 phase 합산, 선택 강제 비교를 확인했다.

| 100개 시드 검증 | 관측값 |
|---|---:|
| 중립 1세대 평균 p(A) | 0.4918 |
| 중립 20세대 N=20 분산 | 0.09848 |
| 중립 20세대 N=200 분산 | 0.01099 |
| 고정 환경 A 20세대 평균 p(A) | 0.8797 |
| A→B 전환 20세대 평균 p(A) | 0.4181 |

이 값은 구현된 교육용 가상 상수와 테스트 시드의 결과이며 자연계 실측치가 아니다.

## 실제 브라우저 검증

ego-browser에서 수행했다. 생성 작업의 내부 샌드박스 연결 실패는 별도로 구분하고, 루트 작업에서 허용된 브라우저 연결로 다음을 확인했다.

- 예측 입력 → 한 세대 → 20세대 → 10회 반복 → 설명 저장.
- 선택/중립 분포 4패널, 크기·재조합 비교, 저장된 반복 차트 재조회.
- 조건 초안 변경 시 6개 실행 버튼 차단과 초기화 강조, 기존 기록 조건 보존.
- 빈 시드 오류 및 실제 시드 0의 정상 실행.
- 버튼 초점 유지, 업데이트 모달 Tab/Shift+Tab과 Esc 후 초점 복귀.
- 320/360px에서 scrollWidth=clientWidth. 1280px 요청에서 실제 clientWidth=1265, scrollWidth=1265.
- 모션 감소 시 한 번의 0.01ms 강조와 정적 테두리, OS dark 요청에서도 밝은 배경 유지.
- 실제 WebGL 시작, 200개체와 두 시점, context loss 시 2D 전환 및 기록 보존.
- `?force2d=1` 시작에서도 20세대와 10회 반복 완료.
- 공개 배포본에서 이미지 자산 200 응답, Three.js 시작, 타원 레이어 소스 부재, 한 세대·20세대·seed+i 10회 반복, NaN/Infinity 부재와 브라우저 오류 0건을 확인했다.

[브라우저 측정 기록](output/qa/browser-validation.json)에는 빈 시드 오류 발견 당시 값과 수정 후 재검증 값을 함께 남겼다. GitHub Pages 공개 검증 캡처는 [데스크톱 화면](output/qa/github-pages-desktop.png)과 [모바일 화면](output/qa/github-pages-mobile.png)으로 저장했다. 이전 Vercel 검증 결과는 QA JSON의 `previousDeployment`에 보존했다.

## 자산 및 파일

생성 이미지는 내장 image_gen 도구로 제작했다. 세부 이미지 모델은 도구에서 확인되지 않아 특정 모델 사용을 주장하지 않는다. 프롬프트·캡션·검수 기록은 [이미지 메타데이터](output/assets/island-context.metadata.json)에 있다. 풍경은 계산 근거로 사용하지 않는다.

최종 자작 코드의 최대 파일도 500줄 미만이다. Three.js는 로컬 min 배포본과 라이선스를 포함한다.

공유 프로젝트에 [소스 사본](app/README.md)을 저장했다. 원본과 복제 파일의 SHA-256 일치를 확인하고 복제본에서도 엔진 테스트를 통과했다.

최종 캡처 검토에서 창 크기 변경 후 캔버스가 비는 문제를 찾아 `resize()` 직후 재렌더를 추가했다. 원본과 사본을 함께 수정했다. 이 마지막 수정은 구문 검사·엔진 검사·320/1280 너비의 재렌더 회귀 검사로 확인했으며 수정 후 브라우저 캡처는 다시 수행하지 않았다. 모바일 캡처는 이 수정 전의 기록이다.

후속 화면 검토에서 섬 풍경을 가리던 장식용 `CircleGeometry` 타원 두 개를 발견해 원본과 export에서 제거했다. 수정 후 로컬 Preview와 공개 배포본의 화면 캡처에서 섬 이미지가 온전히 보이고 개체 표식만 남는 것을 확인했다.

## 검증 한계

공개 배포는 GitHub Pages로 구성했고 실제 교실 사용 및 생물학 전문가 검수는 수행하지 않았다. VoiceOver 구현·검증, 로그인·영구 저장·점수·음성·런타임 AI는 범위에 포함하지 않았다. HVC 등록·갤러리 동기화는 별도 요청 범위가 아니다.
