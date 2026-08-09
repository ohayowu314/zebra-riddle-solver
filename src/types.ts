// types.ts — 共用型別定義

/** 特徵類別 */
export interface Feature {
  /** 特徵類別名稱 */
  name: string;
  /** 特徵值陣列 */
  values: FeatureValue[];
}

/** 特徵值 */
export type FeatureValue = string | number;

/** 規則 ID */
export type RuleId = string | number;

/** 位置（1-based 整數） */
export type Position = number;

/** 解答格單元 */
export interface GridCell {
  /** 特徵值 */
  value: FeatureValue;
  /** 對應 ReasoningItem 的 id；null 表示尚未關聯 */
  reasoningId: number | null;
}

/**
 * 解答格
 * 外層 key 為特徵索引（featIdx），內層 key 為位置（pos）
 */
export type Grid = Record<number, Record<number, GridCell>>;

/** 規則輸入類型 */
export type RuleInputType =
  | "VALUE_SELECT"
  | "POS_SELECT"
  | "DIR_SELECT"
  | "NUM_SELECT"
  | "CUSTOM_SELECT";

/** 規則參數 */
export type RuleParams = Record<string, FeatureValue>;

/** 規則 */
export interface Rule {
  id: RuleId;
  /** 規則類型字串，對應 ruleEngine 中已註冊的類型 */
  type: string;
  /** 規則參數 */
  params: RuleParams;
  /** 規則描述 */
  desc: string;
  /** 啟用 / 停用 */
  enabled: boolean;
}

/** 規則略述（用於推理依據參照） */
export interface RuleDescription {
  /** 對應 Rule 的 id */
  id: RuleId;
  /** 對應 Rule 的 desc */
  desc: string;
}

/** 推理項目 */
export interface ReasoningItem {
  id: number;
  /** 對應 Feature 的 name */
  feature: string;
  /** 特徵值 */
  value: FeatureValue;
  /** 位置 */
  position: Position;
  /** 推理結果描述 */
  desc: string;
  /** 推理依據 */
  rules: RuleDescription[];
  /** true = 自動推理；false = 手動推理 */
  isAuto: boolean;
}

/**
 * 可行解映射
 * key 為特徵值，value 為可行位置陣列
 */
export type FeasibleMap = Record<FeatureValue, Position[]>;

/** 規則可能排列 */
export interface RulePattern {
  /** 排列表達式 */
  expr: string;
  /** 排列相關特徵值 */
  keys: FeatureValue[];
  /** 對應可行解 */
  feasMap: FeasibleMap;
}

/** 規則分析結果 */
export interface RuleAnalysisResult {
  /** 對應 Rule 的 id */
  ruleId: RuleId;
  /** 對應 Rule 的 desc */
  ruleDesc: string;
  /** 規則可能排列組合 */
  patterns: RulePattern[];
  /** 規則相關特徵值 */
  involvedValues: FeatureValue[];
  /** 規則最終可行解 */
  feasibleMap: FeasibleMap;
}

/** 應用程式全域狀態 */
export interface State {
  entityCount: number;
  features: Feature[];
  rules: Rule[];
  userGrid: Grid;
  reasoningHistory: ReasoningItem[];
  nextReasoningId: number;
}

// ── 規則表單渲染相關型別 ────────────────────────────────────────────

/** 選項項目（用於 CUSTOM_SELECT） */
export interface RenderOptionItem {
  value: FeatureValue;
  label?: string | number;
  text?: string | number;
  disabled?: boolean;
}

/** 規則輸入欄位組態 */
export interface RenderStrategyInput {
  /** 輸入欄位的 key（對應 params 的欄位名稱） */
  key: string;
  /** 顯示標籤 */
  label: string;
  /** 輸入類型 */
  type: RuleInputType;
  /** NUM_SELECT：最小值（預設 1） */
  min?: number;
  /** NUM_SELECT：最大值（預設 5） */
  max?: number;
  /** NUM_SELECT：文字樣式模板，例如 "第 ${i} 格" */
  pattern?: string;
  /** NUM_SELECT：靜態顯示文字陣列 */
  texts?: string[];
  /** CUSTOM_SELECT：自訂渲染函式 */
  render?: (
    selectElem: HTMLSelectElement,
    context: RenderStrategyContext,
  ) => void;
  /** CUSTOM_SELECT：靜態或動態選項 */
  options?:
  | Array<RenderOptionItem | string | number>
  | ((context: {
    state: State;
    allValues: FeatureValue[];
  }) => Array<RenderOptionItem | string | number>);
}

/** 規則輸入欄位渲染上下文 */
export interface RenderStrategyContext {
  allValues: FeatureValue[];
  state: State;
  input: RenderStrategyInput;
}

/** 規則輸入欄位渲染函式型別 */
export type RuleInputRenderFn = (
  selectElem: HTMLSelectElement,
  context: RenderStrategyContext,
) => void;

/** 規則模組實例 */
export interface RuleModuleInstance {
  buildDescription: (params: RuleParams) => string;
  getInvolvedValues: (params: RuleParams) => FeatureValue[];
  getPatterns: (params: RuleParams, remMap: FeasibleMap, N: number) => RulePattern[];
  calculateFeasiblePositions: (
    params: RuleParams,
    remMap: FeasibleMap,
    N: number
  ) => FeasibleMap;
}

/** 規則模組 */
export interface RuleModule {
  meta: {
    type: string;
    name: string;
    description: string;
    inputs: RenderStrategyInput[];
  };
  instance: RuleModuleInstance;
}