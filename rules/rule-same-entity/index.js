export default {
  buildDescription(params) {
    return `${params.val1} 與 ${params.val2} 是同一個體`;
  },

  getInvolvedValues(params) {
    return [params.val1, params.val2];
  },

  getPatterns(params, remMap, N) {
    const evalSameEntity = (valA, valB) => {
      const remA = remMap[valA] || [];
      const remB = remMap[valB] || [];
      const common = remA.filter((p) => remB.includes(p));

      return {
        expr: `${valA} = ${valB}`,
        feasMap: { [valA]: common, [valB]: common },
      };
    };

    return [evalSameEntity(params.val1, params.val2)];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);

    return patterns[0].feasMap;
  },
};
