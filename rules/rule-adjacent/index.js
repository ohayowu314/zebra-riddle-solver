export default {
  buildDescription(params) {
    return `${params.val1} 與 ${params.val2} 相鄰`;
  },

  getInvolvedValues(params) {
    return [params.val1, params.val2];
  },

  getPatterns(params, remMap, N) {
    const evalAdj = (valA, valB) => {
      const remA = remMap[valA] || [];
      const remB = remMap[valB] || [];
      const feasA = [],
        feasB = [];

      for (const posA of remA) {
        const posB = posA + 1;
        if (posB <= N && remB.includes(posB)) {
          if (!feasA.includes(posA)) feasA.push(posA);
          if (!feasB.includes(posB)) feasB.push(posB);
        }
      }
      return {
        expr: `${valA} | ${valB}`,
        feasMap: { [valA]: feasA, [valB]: feasB },
      };
    };

    return [
      evalAdj(params.val1, params.val2),
      evalAdj(params.val2, params.val1),
    ];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);
    const result = { [params.val1]: new Set(), [params.val2]: new Set() };

    patterns.forEach((p) => {
      Object.keys(p.feasMap).forEach((v) => {
        p.feasMap[v].forEach((pos) => result[v].add(pos));
      });
    });

    return {
      [params.val1]: Array.from(result[params.val1]).sort((a, b) => a - b),
      [params.val2]: Array.from(result[params.val2]).sort((a, b) => a - b),
    };
  },
};
