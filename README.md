# 진화하는 섬

두 좌위 이배체 개체군에서 선택과 유전적 부동을 비교하는 한국어 교육용 탐구 웹앱입니다.

- 실행 앱: [`app/`](app/)
- 설계·검증 문서: [`PLAN.md`](PLAN.md), [`IMPLEMENTATION_REPORT.md`](IMPLEMENTATION_REPORT.md), [`VALIDATION_PLAN.md`](VALIDATION_PLAN.md)
- QA 증거: [`output/qa/browser-validation.json`](output/qa/browser-validation.json)
- 배포 전 네 폭 완주 기록: [`output/qa/four-width-device-flow.json`](output/qa/four-width-device-flow.json)
- 이미지 자산 메타데이터: [`output/assets/island-assets.metadata.json`](output/assets/island-assets.metadata.json)
- 공개 앱: <https://wbmaker2.github.io/evolving-island/>

현재 작업 트리에는 `04-evolving-island.md` §8의 기준 장면 1장과 신규 생성 이미지 8장이 앱 갤러리·개체 카드에 연결되어 있습니다. 생성 이미지는 가상 맥락 참고이며 계산된 빈도나 실측값의 근거가 아닙니다. 이 변경은 아직 커밋·푸시·Pages 재배포 전입니다.

GitHub Pages는 `main`에 push될 때 [`pages.yml`](.github/workflows/pages.yml)이 `app/` 디렉터리를 정적 artifact로 배포합니다. 로컬에서 엔진 테스트를 실행하려면 다음 명령을 사용합니다.

```sh
cd app
npm run test:engine
```
