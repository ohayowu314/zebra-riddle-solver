export default {
  buildDescription(params) {
    return `${params.val1} 在 ${params.val2} 的 ${params.dir === "left" ? "左側隔壁" : "右側隔壁"}`;
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
    const leftVal = params.dir === "left" ? params.val1 : params.val2;
    const rightVal = params.dir === "left" ? params.val2 : params.val1;

    return [evalAdj(leftVal, rightVal)];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);

    return patterns[0].feasMap;
  },
};
