// constants.ts — 常數定義

import type { FeatureValue, Position } from "./types.js";

export const ENTITY_COUNT_MIN = 2;
export const ENTITY_COUNT_MAX = 8;
export const AUTO_SOLVE_MAX_LOOPS = 50;

/**
 * 通用推理規則描述產生器
 */
export const GENERAL_RULES: Readonly<{
  G1: (value: FeatureValue) => string;
  G2: (value: FeatureValue, pos: Position | null | undefined) => string;
  G3: (value: FeatureValue) => string;
}> = Object.freeze({
  G1: (value: FeatureValue) => `${value} 僅剩一個位置`,
  G2: (value: FeatureValue, pos: Position | null | undefined) =>
    `第 ${pos ?? "i"} 個位置僅能填入 ${value}`,
  G3: (value: FeatureValue) => `數獨規則 ${value} 刪去部分可能位置`,
});
