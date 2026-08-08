export default {
  buildDescription(params) {
    return `${params.val} 位於 第 ${params.pos} 個位置`;
  },

  getInvolvedValues(params) {
    return [params.val];
  },

  getPatterns(params, remMap, N) {
    return [
      {
        expr: `${params.val} [在 ${params.pos}]`,
        keys: [params.val],
        feasMap: { [params.val]: [params.pos] },
      },
    ];
  },

  calculateFeasiblePositions(params, remMap, N) {
    return { [params.val]: [params.pos] };
  },
};
