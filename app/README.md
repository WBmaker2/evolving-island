# 진화하는 섬 export

이 폴더는 OpenDesign 원본 프로젝트를 공유 workspace에서 확인할 수 있도록 복제한 export입니다.

- OpenDesign 원본: `/Users/kimhongnyeon/Library/Application Support/Open Design/namespaces/release-stable/data/projects/project-50b0`
- 공유 workspace export: `/Volumes/ External Drive 256G/Dev2/codex/evolving-island/app`
- OpenDesign Studio/Preview 원본 링크: [Studio](http://127.0.0.1:64527/projects/project-50b0/conversations/e0cc4735-f741-48b8-8c22-6abc8390772c/files/index.html), [Preview](http://127.0.0.1:64519/api/projects/project-50b0/raw/index.html)
- 공개 배포본: [GitHub Pages](https://wbmaker2.github.io/evolving-island/)
- 이전 공개 확인본: [Vercel production](https://app-green-two-32.vercel.app/)

## 검증

엔진 테스트는 다음 명령으로 실행합니다.

```sh
npm run test:engine
```

정적 서버가 필요하면 export 디렉터리에서 다음을 실행합니다. 이 export 보고 시점에는 서버를 실행하지 않았습니다.

```sh
python3 -m http.server 4173
```

실행 후 확인 주소: [http://localhost:4173](http://localhost:4173)

정적 export는 GitHub Pages에 배포되어 공개 주소에서 확인할 수 있습니다. GitHub Actions workflow는 저장소의 `main` push마다 이 `app/` 디렉터리를 Pages artifact로 배포합니다.

OpenDesign 전용 숨김 메타데이터, artifact sidecar, `node_modules`는 export에서 제외했습니다. 원본과 export의 복제 파일은 export 후 SHA-256 해시로 일치 여부를 확인합니다.
