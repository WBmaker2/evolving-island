# 진화하는 섬

두 좌위 이배체 개체군에서 선택과 유전적 부동을 비교하는 한국어 교육용 탐구 웹앱입니다.

- 실행 앱: [`app/`](app/)
- 설계·검증 문서: [`PLAN.md`](PLAN.md), [`IMPLEMENTATION_REPORT.md`](IMPLEMENTATION_REPORT.md), [`VALIDATION_PLAN.md`](VALIDATION_PLAN.md)
- QA 증거: [`output/qa/browser-validation.json`](output/qa/browser-validation.json)
- 공개 앱: <https://wbmaker2.github.io/evolving-island/>

GitHub Pages는 `main`에 push될 때 [`pages.yml`](.github/workflows/pages.yml)이 `app/` 디렉터리를 정적 artifact로 배포합니다. 로컬에서 엔진 테스트를 실행하려면 다음 명령을 사용합니다.

```sh
cd app
npm run test:engine
```
