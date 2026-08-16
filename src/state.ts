// state.ts — 全域狀態、初始化與工具函式

import type {
  State,
  FeatureValue,
  RuleId,
  Rule,
  ReasoningItem,
} from "./types.js";

// ==========================================
// 全域狀態（含預設範例資料）
// ==========================================

export const state: State = {
  entityCount: 5,
  features: [
    {
      name: "國籍",
      values: ["英國人", "瑞典人", "丹麥人", "挪威人", "德意志"],
    },
    {
      name: "顏色",
      values: ["紅房子", "綠房子", "白房子", "黃房子", "藍房子"],
    },
    { name: "飲料", values: ["茶", "咖啡", "牛奶", "啤酒", "水"] },
    { name: "寵物", values: ["狗", "鳥", "貓", "馬", "斑馬"] },
    {
      name: "抽菸",
      values: ["Blends", "Blue Master", "Dunhill", "Pall Mall", "Prince"],
    },
  ],
  rules: [
    {
      id: 1,
      type: "EXACT_POS",
      params: { val: "挪威人", pos: 1 },
      desc: "挪威人 住 第一間房子",
      enabled: true,
    },
    {
      id: 2,
      type: "EXACT_POS",
      params: { val: "牛奶", pos: 3 },
      desc: "住在 中間(第3間) 的人喝 牛奶",
      enabled: true,
    },
    {
      id: 3,
      type: "SAME_ENTITY",
      params: { val1: "英國人", val2: "紅房子" },
      desc: "英國人 住 紅房子",
      enabled: true,
    },
    {
      id: 4,
      type: "ORDERED_ADJ",
      params: { dir: "left", val1: "綠房子", val2: "白房子" },
      desc: "綠房子 在 白房子 的 左側隔壁",
      enabled: true,
    },
    {
      id: 5,
      type: "SAME_ENTITY",
      params: { val1: "丹麥人", val2: "茶" },
      desc: "丹麥人 喝 茶",
      enabled: true,
    },
    {
      id: 6,
      type: "ADJACENT",
      params: { val1: "挪威人", val2: "藍房子" },
      desc: "挪威人 和 住藍房子 的人 相鄰",
      enabled: true,
    },
    {
      id: 7,
      type: "SAME_ENTITY",
      params: { val1: "瑞典人", val2: "狗" },
      desc: "瑞典人 養 狗",
      enabled: true,
    },
    {
      id: 8,
      type: "SAME_ENTITY",
      params: { val1: "綠房子", val2: "咖啡" },
      desc: "住綠房子 的人 喝 咖啡",
      enabled: true,
    },
    {
      id: 9,
      type: "SAME_ENTITY",
      params: { val1: "Pall Mall", val2: "鳥" },
      desc: "抽 Pall Mall 的人 養 鳥",
      enabled: true,
    },
    {
      id: 10,
      type: "SAME_ENTITY",
      params: { val1: "黃房子", val2: "Dunhill" },
      desc: "住黃房子 的人 抽 Dunhill",
      enabled: true,
    },
    {
      id: 11,
      type: "ADJACENT",
      params: { val1: "Blends", val2: "貓" },
      desc: "抽 Blends 的人與 養 貓 的人相鄰",
      enabled: true,
    },
    {
      id: 12,
      type: "ADJACENT",
      params: { val1: "馬", val2: "Dunhill" },
      desc: "養 馬 的人與 抽 Dunhill 的人相鄰",
      enabled: true,
    },
    {
      id: 13,
      type: "SAME_ENTITY",
      params: { val1: "Blue Master", val2: "啤酒" },
      desc: "抽 Blue Master 的人 喝 啤酒",
      enabled: true,
    },
    {
      id: 14,
      type: "SAME_ENTITY",
      params: { val1: "德意志", val2: "Prince" },
      desc: "德意志人 抽 Prince",
      enabled: true,
    },
    {
      id: 15,
      type: "ADJACENT",
      params: { val1: "Blends", val2: "水" },
      desc: "抽 Blends 的人與 喝 水 的人相鄰",
      enabled: true,
    },
  ],
  userGrid: {},
  past: [],
  future: [],
  nextReasoningId: 1,
};

// ==========================================
// 初始化
// ==========================================

/** 重置使用者填答格與推理歷史 */
export function initUserGrid(): void {
  state.userGrid = {};
  state.features.forEach((_, fIdx) => {
    state.userGrid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      state.userGrid[fIdx][p] = { value: "", reasoningId: null };
    }
  });
  state.past = [];
  state.future = [];
  state.nextReasoningId = 1;
}

// ==========================================
// 工具函式
// ==========================================

/**
 * 安全地跳脫 HTML 特殊字元，防止 XSS 注入
 */
export function escapeHtml(str: string | number): string {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 以 id 從 state.past 查找項目
 */
export function findHistoryItem(itemId: number): ReasoningItem | undefined {
  return state.past.find((h) => h.id === itemId);
}

/**
 * 以 id 從 state.rules 查找規則
 */
export function findRule(ruleId: RuleId): Rule | undefined {
  return state.rules.find((r) => String(r.id) === String(ruleId));
}

/**
 * 取得所有特徵值的扁平陣列
 */
export function getAllValues(): FeatureValue[] {
  return state.features.flatMap((f) => f.values);
}
