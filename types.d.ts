/** 特徵值 */
export type FeatureValue = string | number;

/** 位置 */
export type Position = number;

/** 特徵 */
export interface Feature {
  /** 特徵類別名稱 */
  name: string;
  /** 特徵值陣列 */
  values: FeatureValue[];
}

/** 網格單元格 */
export interface GridCell {
  /** 特徵值 */
  value: FeatureValue;
  /** 對應 ReasoningItem 的 id */
  reasoningId: number | null;
}

/** 網格結構：[featureIndex][position] => GridCell */
export type Grid = Record<number, Record<number, GridCell>>;

/** 規則輸入類型 */
export type RuleInputType =
  | "VALUE_SELECT"
  | "POS_SELECT"
  | "DIR_SELECT"
  | "NUM_SELECT"
  | "CUSTOM_SELECT";

/** 規則ID */
export type RuleId = string | number;

/** 規則 */
export interface Rule {
  id: RuleId;
  /** 規則類型 */
  type: string;
  /** 規則參數 */
  params: Record<string, FeatureValue>;
  /** 規則描述 */
  desc: string;
  /** 啟用/停用 */
  enabled: boolean;
}

/** 規則略述 */
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
  /** 自動推理 / 手動推理 */
  isAuto: boolean;
}

/** 可行解映射表 */
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

/** 應用程式狀態 */
export interface State {
  entityCount: number;
  features: Feature[];
  rules: Rule[];
  userGrid: Grid;
  reasoningHistory: ReasoningItem[];
  nextReasoningId: number;
}
