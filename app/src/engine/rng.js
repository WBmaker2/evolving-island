export function createRng(seed) {
  if (!Number.isInteger(seed) || seed < 0) throw new RangeError('seed must be a non-negative integer');
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    next() {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    snapshot() { return state >>> 0; },
  };
}

export function deriveSeed(seed, generation) {
  if (!Number.isInteger(seed) || seed < 0) throw new RangeError('seed must be a non-negative integer');
  if (!Number.isInteger(generation) || generation < 0) throw new RangeError('generation must be a non-negative integer');
  let value = (seed >>> 0) ^ Math.imul(generation + 0x9e3779b9, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}

export function weightedIndex(weights, rng) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error('부모 선택 가중치의 합이 0입니다. 실행할 수 없습니다.');
  let threshold = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    threshold -= weights[i];
    if (threshold < 0) return i;
  }
  return weights.length - 1;
}
