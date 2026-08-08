export default {
  buildDescription(params) {
    return `${params.val} 位於 第 ${params.pos1} 或 第 ${params.pos2} 位置`;
  },

  getInvolvedValues(params) {
    return [params.val];
  },

  getPatterns(params, remMap, N) {
    return [
      {
        expr: `${params.val} [在 ${params.pos1} v ${params.pos2}]`,
        keys: [params.val],
        feasMap: { [params.val]: [params.pos1, params.pos2] },
      },
    ];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);

    return patterns[0].feasMap;
  },
};
