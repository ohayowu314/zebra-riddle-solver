// importExport.ts — 匯入與匯出功能

import { ruleEngine } from "./ruleEngine.js";
import { state, initUserGrid } from "./state.js";
import type { Feature, Rule, Grid, ReasoningItem } from "./types.js";
import { renderFeatureConfig } from "./featureConfig.js";
import { renderRulesTable, renderRuleFormInputs } from "./ruleConfig.js";
import { updateSolveWorkspace } from "./solveWorkspace.js";

/** 匯入時是否包含解答 */
let importIncludeAnswers = false;

// ==========================================
// 匯出
// ==========================================

/**
 * 匯出題目（或含解答）為 JSON 檔案
 */
export function exportData(includeAnswers: boolean): void {
  const dataToExport: {
    entityCount: number;
    features: Feature[];
    rules: Rule[];
    userGrid?: Grid;
    reasoningHistory?: ReasoningItem[];
    nextReasoningId?: number;
  } = {
    entityCount: state.entityCount,
    features: state.features,
    rules: state.rules,
  };

  if (includeAnswers) {
    dataToExport.userGrid = state.userGrid;
    dataToExport.reasoningHistory = state.reasoningHistory;
    dataToExport.nextReasoningId = state.nextReasoningId;
  }

  const jsonStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = includeAnswers
    ? "zebra_puzzle_with_answers.json"
    : "zebra_puzzle_question.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 匯入
// ==========================================

/**
 * 觸發檔案選擇器以進行匯入
 */
export function triggerImport(includeAnswers: boolean): void {
  importIncludeAnswers = includeAnswers;
  const fileInput = document.getElementById(
    "import-file-input",
  ) as HTMLInputElement;
  fileInput.value = "";
  fileInput.click();
}

/**
 * 處理檔案匯入事件
 */
export function handleFileImport(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e: ProgressEvent<FileReader>) {
    try {
      const importedData = JSON.parse(e.target!.result as string);

      if (
        !importedData.entityCount ||
        !importedData.features ||
        !importedData.rules
      ) {
        throw new Error("無效的 JSON 結構！");
      }

      state.entityCount = importedData.entityCount;
      (document.getElementById("entity-count") as HTMLInputElement).value =
        String(state.entityCount);
      state.features = importedData.features;

      // 兼容舊版：確保每條規則都有 enabled 與 params 欄位
      state.rules = importedData.rules.map(
        ({
          id,
          type,
          params,
          desc,
          enabled,
          ...legacyArgs
        }: Rule & Record<string, unknown>) => {
          const sourceParams = (params ?? legacyArgs) as Record<
            string,
            unknown
          >;
          const { desc: paramDesc, ...normalizedParams } = sourceParams as {
            desc?: string;
            [key: string]: unknown;
          };
          return {
            id,
            type,
            desc:
              desc ??
              paramDesc ??
              ruleEngine.buildDescription(
                type,
                normalizedParams as Record<string, string | number>,
              ),
            params: normalizedParams as Record<string, string | number>,
            enabled: enabled ?? true,
          };
        },
      );

      initUserGrid();

      if (importIncludeAnswers && importedData.userGrid) {
        _restoreUserGrid(importedData);
      }

      renderFeatureConfig();
      renderRulesTable();
      renderRuleFormInputs();
      updateSolveWorkspace();

      alert(importIncludeAnswers ? "題目與解答匯入成功！" : "題目匯入成功！");
    } catch (err) {
      alert(`匯入失敗：檔案格式不正確！${(err as Error).message}`);
    }
  };
  reader.readAsText(file);
}

/**
 * 從匯入資料中還原 userGrid 與推理歷史（內部輔助函式）
 */
function _restoreUserGrid(importedData: {
  userGrid?: Grid;
  reasoningHistory?: ReasoningItem[];
  nextReasoningId?: number;
}): void {
  const importedGrid = importedData.userGrid;
  state.userGrid = {};

  state.features.forEach((_, fIdx) => {
    state.userGrid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      const item = importedGrid?.[fIdx]?.[p];
      if (item) {
        state.userGrid[fIdx][p] =
          typeof item === "object"
            ? {
                value: item.value || "",
                reasoningId: item.reasoningId || null,
              }
            : { value: item as string | number, reasoningId: null };
      } else {
        state.userGrid[fIdx][p] = { value: "", reasoningId: null };
      }
    }
  });

  state.reasoningHistory = importedData.reasoningHistory ?? [];
  state.nextReasoningId = importedData.nextReasoningId ?? 1;
}
