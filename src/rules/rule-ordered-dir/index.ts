import { FeatureValue, Position, RuleModuleInstance } from "../../types.js";

export default {
  buildDescription(params) {
    return `${params.val1} 在 ${params.val2} 的 ${params.dir === "left" ? "左側" : "右側"}`;
  },

  getInvolvedValues(params) {
    return [params.val1, params.val2];
  },

  getPatterns(params, remMap, N) {
    const evalDotOrder = (valA: FeatureValue, valB: FeatureValue) => {
      const remA = remMap[valA] || [];
      const remB = remMap[valB] || [];
      const feasA: Position[] = [],
        feasB: Position[] = [];

      for (const posA of remA) {
        for (const posB of remB) {
          if (posA < posB) {
            if (!feasA.includes(posA)) feasA.push(posA);
            if (!feasB.includes(posB)) feasB.push(posB);
          }
        }
      }
      return {
        expr: `${valA} . ${valB}`,
        keys: [valA, valB],
        feasMap: { [valA]: feasA, [valB]: feasB },
      };
    };
    const leftVal = params.dir === "left" ? params.val1 : params.val2;
    const rightVal = params.dir === "left" ? params.val2 : params.val1;

    return [evalDotOrder(leftVal, rightVal)];
  },

  calculateFeasiblePositions(params, remMap, N) {
    const patterns = this.getPatterns(params, remMap, N);

    return patterns[0].feasMap;
  },
} satisfies RuleModuleInstance;
