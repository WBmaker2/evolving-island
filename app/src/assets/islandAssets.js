export const ISLAND_BASE_ASSET = {
  id: 'island-base',
  src: './assets/island-context.png',
  title: '섬 기준 맥락',
  alt: '건조 해안과 습윤 숲이 나뉜 가상의 섬 항공 풍경',
  caption: '가상의 섬 기준 맥락 · 수치나 실측 자료가 아닌 장면 참고'
};

export const ORGANISM_ASSETS = [
  { id: 'organism-card-a-b', src: './assets/organism-card-a-b.png', title: '청록 몸 · 넓은 부리', alt: '청록색 몸과 넓고 둥근 부리를 가진 가상 섬 개체의 표현형 참고 이미지', caption: '표현형 참고 · 청록 몸 · 넓은 부리' },
  { id: 'organism-card-a-bb', src: './assets/organism-card-a-bb.png', title: '청록 몸 · 좁은 부리', alt: '청록색 몸과 좁고 뾰족한 부리를 가진 가상 섬 개체의 표현형 참고 이미지', caption: '표현형 참고 · 청록 몸 · 좁은 부리' },
  { id: 'organism-card-aa-b', src: './assets/organism-card-aa-b.png', title: '갈색 몸 · 넓은 부리', alt: '황갈색 몸과 넓고 둥근 부리를 가진 가상 섬 개체의 표현형 참고 이미지', caption: '표현형 참고 · 갈색 몸 · 넓은 부리' },
  { id: 'organism-card-aa-bb', src: './assets/organism-card-aa-bb.png', title: '갈색 몸 · 좁은 부리', alt: '황갈색 몸과 좁고 뾰족한 부리를 가진 가상 섬 개체의 표현형 참고 이미지', caption: '표현형 참고 · 갈색 몸 · 좁은 부리' }
];

export const HABITAT_ASSETS = [
  { id: 'habitat-patch-dry', src: './assets/habitat-patch-dry.png', title: '건조 해안 패치', alt: '맑은 바다를 바라보는 바위와 낮은 관목의 건조 해안 패치', caption: '환경 맥락 참고 · 건조 해안' },
  { id: 'habitat-patch-wet', src: './assets/habitat-patch-wet.png', title: '습윤 숲 패치', alt: '개울과 연못이 있는 울창한 습윤 숲 패치', caption: '환경 맥락 참고 · 습윤 숲' }
];

export const SEASON_ASSETS = [
  { id: 'season-context-dry', src: './assets/season-context-dry.png', title: '건기 풍경', alt: '황금빛 풀이 드러난 건기의 가상 섬 능선과 해안', caption: '계절 맥락 참고 · 건기' },
  { id: 'season-context-wet', src: './assets/season-context-wet.png', title: '우기 풍경', alt: '비 뒤에 초록빛으로 무성해진 우기의 가상 섬 능선과 해안', caption: '계절 맥락 참고 · 우기' }
];

export const ISLAND_ASSETS = [ISLAND_BASE_ASSET, ...ORGANISM_ASSETS, ...HABITAT_ASSETS, ...SEASON_ASSETS];

export const ORGANISM_ASSET_BY_PHENOTYPE = {
  'A_B_': './assets/organism-card-a-b.png',
  'A_bb': './assets/organism-card-a-bb.png',
  'aaB_': './assets/organism-card-aa-b.png',
  'aabb': './assets/organism-card-aa-bb.png'
};
