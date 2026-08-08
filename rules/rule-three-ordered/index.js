export default {
  buildDescription(params) {
    return `${params.val1}, ${params.val2}, ${params.val3} 按此順序排列`;
  },

  getInvolvedValues(params) {
    return [params.val1, params.val2, params.val3];
  },

  getPatterns(params, remMap, N) {
    const evalThreeDotOrder = (valA, valB, valC) => {
      const remA = remMap[valA] || [];
      const remB = remMap[valB] || [];
      const remC = remMap[valC] || [];
      const feasA = [],
        feasB = [],
        feasC = [];

      for (const posA of remA) {
        for (const posB of remB) {
          if (posA < posB) {
            for (const posC of remC) {
              if (posB < posC) {
                if (!feasA.includes(posA)) feasA.push(posA);
                if (!feasB.includes(posB)) feasB.push(posB);
                if (!feasC.includes(posC)) feasC.push(posC);
              }
            }
          }
        }
      }

      return {
        expr: `${valA} . ${valB} . ${valC}`,
        keys: [valA, valB, valC],
        feasMap: { [valA]: feasA, [valB]: feasB, [valC]: feasC },
      };
    };

    return [evalThreeDotOrder(params.val1, params.val2, params.val3)];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);

    return patterns[0].feasMap;
  },
};
