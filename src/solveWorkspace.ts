// solveWorkspace.ts — 推理互動工作區

import { ruleEngine } from "./ruleEngine.js";
import { state, initUserGrid, escapeHtml, findHistoryItem, findRule } from "./state.js";
import { GENERAL_RULES, AUTO_SOLVE_MAX_LOOPS } from "./constants.js";
import type {
  FeatureValue,
  Position,
  FeasibleMap,
  RuleAnalysisResult,
  RuleDescription,
  ReasoningItem,
  RuleId,
  Grid,
} from "./types.js";

// ==========================================
// 主控：更新整個解題工作區
// ==========================================

/**
 * 更新整個解題工作區（計算 + 渲染）
 */
export function updateSolveWorkspace(): {
  finalFeasibleMap: FeasibleMap;
  remainingPosMap: FeasibleMap;
  ruleAnalysisResults: RuleAnalysisResult[];
} {
  renderAnswerGrid();

  const remainingPosMap = computeRemainingPositions();
  const ruleAnalysisResults = computeRuleAnalysis(remainingPosMap);
  const finalFeasibleMap = computeFinalFeasiblePositions(
    remainingPosMap,
    ruleAnalysisResults,
  );

  renderRuleAnalysisTable(ruleAnalysisResults, finalFeasibleMap);
  renderTwoRowPositionGrid("feasible-pos-grid", finalFeasibleMap, "dynamic");
  renderReasoningHistory();

  return { finalFeasibleMap, remainingPosMap, ruleAnalysisResults };
}

// ==========================================
// 自動推理
// ==========================================

/** 自動逐步推理（數獨式推導） */
export function autoSolveStepByStep(): void {
  state.future = []; // 自動推理是新操作，清空之後的步驟
  let totalSteps = 0;

  for (let loop = 0; loop < AUTO_SOLVE_MAX_LOOPS; loop++) {
    const { finalFeasibleMap, remainingPosMap, ruleAnalysisResults } =
      updateSolveWorkspace();
    let stepChanged = false;

    state.features.forEach((feat, fIdx) => {
      feat.values.forEach((val) => {
        const feasiblePositions = finalFeasibleMap[val] ?? [];
        if (feasiblePositions.length !== 1) return;

        const targetPos = feasiblePositions[0];
        if (state.userGrid[fIdx][targetPos].value === val) return;

        const recordRules = _buildAutoReasoningRules(
          val,
          remainingPosMap,
          ruleAnalysisResults,
        );

        const oldItem = state.userGrid[fIdx][targetPos];
        if (oldItem?.reasoningId) {
          state.past = state.past.filter(
            (h) => h.id !== oldItem.reasoningId,
          );
        }

        const rid = state.nextReasoningId++;
        state.past.push({
          id: rid,
          featureIndex: fIdx,
          feature: feat.name,
          value: val,
          position: targetPos,
          desc: `${val} 位於 第 ${targetPos} 個位置`,
          rules: recordRules,
          isAuto: true,
        });

        state.userGrid[fIdx][targetPos] = { value: val, reasoningId: rid };
        stepChanged = true;
      });
    });

    if (!stepChanged) break;
    totalSteps++;
  }

  updateSolveWorkspace();

  alert(
    totalSteps > 0
      ? `自動推理完成！共進行了 ${totalSteps} 輪數獨推導填入。`
      : "無法繼續推理：目前資訊不足以產生確定項，或解答已完全填滿。",
  );
}

/**
 * 為自動推理建立推理依據規則列表（內部輔助函式）
 */
function _buildAutoReasoningRules(
  val: FeatureValue,
  remainingPosMap: FeasibleMap,
  ruleAnalysisResults: RuleAnalysisResult[],
): RuleDescription[] {
  const S0 = remainingPosMap[val] ?? [];

  if (S0.length === 1) {
    return [{ id: "G1", desc: GENERAL_RULES.G1(val) }];
  }

  const recordRules: RuleDescription[] = [];
  let currentS = new Set(S0);

  ruleAnalysisResults.forEach((res) => {
    const ruleFeasible = res.feasibleMap[val];
    if (!ruleFeasible) return;

    const ruleSet = new Set(ruleFeasible);
    const nextS = new Set([...currentS].filter((x) => ruleSet.has(x)));
    if (nextS.size < currentS.size) {
      recordRules.push({ id: res.ruleId, desc: res.ruleDesc });
      currentS = nextS;
    }
  });

  return recordRules;
}

// ==========================================
// 解答格渲染
// ==========================================

/** 渲染解答區表格 */
function renderAnswerGrid(): void {
  const grid = document.getElementById("answer-grid") as HTMLElement;
  let html = `<thead><tr class="table-light"><th style="width:80px;">特徵類別</th>`;
  for (let p = 1; p <= state.entityCount; p++) {
    html += `<th class="text-center">位置 ${p}</th>`;
  }
  html += `</tr></thead><tbody>`;

  state.features.forEach((feat, fIdx) => {
    const usedValuesInFeature = new Set<FeatureValue>();
    for (let p = 1; p <= state.entityCount; p++) {
      const v = state.userGrid[fIdx][p]?.value;
      if (v) usedValuesInFeature.add(v);
    }

    html += `<tr><td class="fw-bold bg-light">${escapeHtml(feat.name)}</td>`;

    for (let p = 1; p <= state.entityCount; p++) {
      const selectedVal = state.userGrid[fIdx][p]?.value ?? "";
      const optionsHtml = feat.values
        .map((v) => {
          const isSelectedHere = selectedVal === v;
          const isDisabled = !isSelectedHere && usedValuesInFeature.has(v);
          return `<option value="${escapeHtml(v)}"
                          ${isSelectedHere ? "selected" : ""}
                          ${isDisabled ? "disabled" : ""}>${escapeHtml(v)}</option>`;
        })
        .join("");

      html += `<td>
        <select class="form-select form-select-sm ${selectedVal ? "bg-warning-subtle fw-bold" : ""}"
                onchange="onUserSelectChange(${fIdx}, ${p}, this.value)">
          <option value="">-- 未定 --</option>
          ${optionsHtml}
        </select>
      </td>`;
    }
    html += `</tr>`;
  });

  html += `</tbody>`;
  grid.innerHTML = html;
}

/**
 * 使用者手動選擇解答格的值
 */
export function onUserSelectChange(
  fIdx: number,
  pos: number,
  value: string,
): void {
  state.future = []; // 手動操作是新操作，清空之後的步驟

  const oldItem = state.userGrid[fIdx][pos];
  if (oldItem?.reasoningId) {
    const idx = state.past.findIndex((h) => h.id === oldItem.reasoningId);
    if (idx !== -1) {
      // 截斷該步驟及其之後的所有步驟
      state.past = state.past.slice(0, idx);
    }
  }

  if (value) {
    const rid = state.nextReasoningId++;
    state.past.push({
      id: rid,
      featureIndex: fIdx,
      feature: state.features[fIdx].name,
      value,
      position: Number(pos),
      desc: `${value} 位於 第 ${pos} 個位置`,
      rules: [],
      isAuto: false,
    });
  }

  // 根據 past 重新生成解答格狀態
  state.userGrid = rebuildGridFromPast(state.past);
  updateSolveWorkspace();
}

/** 重置所有使用者填答與歷史 */
export function resetUserChoices(): void {
  initUserGrid();
  updateSolveWorkspace();
}

// ==========================================
// 計算函式
// ==========================================

/**
 * 計算每個特徵值的剩餘可能位置
 */
function computeRemainingPositions(): FeasibleMap {
  const remMap: FeasibleMap = {};
  const N = state.entityCount;

  state.features.forEach((feat, fIdx) => {
    const selectedValues: Record<FeatureValue, Position> = {};
    const occupiedPositions = new Set<Position>();

    for (let p = 1; p <= N; p++) {
      const val = state.userGrid[fIdx][p]?.value;
      if (val) {
        selectedValues[val] = p;
        occupiedPositions.add(p);
      }
    }

    feat.values.forEach((v) => {
      if (selectedValues[v] !== undefined) {
        remMap[v] = [selectedValues[v]];
      } else {
        remMap[v] = Array.from({ length: N }, (_, i) => i + 1).filter(
          (p) => !occupiedPositions.has(p),
        );
      }
    });
  });

  return remMap;
}

/**
 * 對所有已啟用規則執行推理分析
 */
function computeRuleAnalysis(remMap: FeasibleMap): RuleAnalysisResult[] {
  const N = state.entityCount;

  return state.rules
    .filter((r) => r.enabled)
    .map((rule) => ({
      ruleId: rule.id,
      ruleDesc: rule.desc,
      patterns: ruleEngine.getPatterns(rule.type, rule.params, remMap, N),
      involvedValues: ruleEngine.getInvolvedValues(rule.type, rule.params),
      feasibleMap: ruleEngine.calculateFeasiblePositions(
        rule.type,
        rule.params,
        remMap,
        N,
      ),
    }));
}

/**
 * 整合所有規則分析結果，計算每個特徵值的最終可行位置
 */
function computeFinalFeasiblePositions(
  remMap: FeasibleMap,
  analysisResults: RuleAnalysisResult[],
): FeasibleMap {
  const finalMap = Object.fromEntries(
    Object.entries(remMap).map(([v, positions]) => [v, new Set(positions)]),
  ) as Record<FeatureValue, Set<Position>>;

  analysisResults.forEach((res) => {
    res.involvedValues.forEach((v) => {
      if (finalMap[v] && res.feasibleMap[v]) {
        const ruleFeasibleSet = new Set(res.feasibleMap[v]);
        finalMap[v] = new Set(
          [...finalMap[v]].filter((x) => ruleFeasibleSet.has(x)),
        );
      }
    });
  });

  return Object.fromEntries(
    Object.entries(finalMap).map(([v, set]) => [
      v,
      Array.from(set as Set<Position>).sort((a, b) => a - b),
    ]),
  );
}

/**
 * 判斷某特徵值是否已填入解答格
 */
function isValueSelectedInAnswerGrid(val: FeatureValue): boolean {
  for (const fIdx in state.userGrid) {
    for (const pos in state.userGrid[fIdx]) {
      if (state.userGrid[fIdx][pos]?.value === val) return true;
    }
  }
  return false;
}

// ==========================================
// 渲染函式
// ==========================================

/**
 * 渲染雙列位置可行性表格
 */
function renderTwoRowPositionGrid(
  tableId: string,
  posMap: FeasibleMap,
  badgeType: "dynamic" | "static",
): void {
  const table = document.getElementById(tableId);
  if (!table) return;

  let html = "<tbody>";
  state.features.forEach((feat) => {
    html += `<tr>`;
    html += `<td rowspan="2" class="feature-label">${escapeHtml(feat.name)}</td>`;
    feat.values.forEach((v) => {
      html += `<td class="val-header">${escapeHtml(v)}</td>`;
    });
    html += `</tr>`;

    html += `<tr class="pos-row mb-2">`;
    feat.values.forEach((v) => {
      const posList = posMap[v] ?? [];
      const posStr = posList.length > 0 ? posList.join(",") : "無解";

      let badgeClass = "bg-secondary";
      if (badgeType === "dynamic") {
        if (posList.length === 1) badgeClass = "bg-success";
        else if (posList.length === 0) badgeClass = "bg-danger";
        else badgeClass = "bg-primary";
      }

      html += `<td><span class="badge ${badgeClass} pos-badge">${posStr}</span></td>`;
    });
    html += `</tr>`;
  });
  html += "</tbody>";
  table.innerHTML = html;
}

/**
 * 渲染規則分析表格（含三階段狀態排序）
 * - Stage 1 READY      - 已推出唯一解但尚未填入
 * - Stage 2 UNRESOLVED - 尚未推出唯一解
 * - Stage 3 COMPLETED  - 已推出唯一解且已填入
 */
function renderRuleAnalysisTable(
  analysisResults: RuleAnalysisResult[],
  finalFeasibleMap: FeasibleMap,
): void {
  const tbody = document.getElementById("rule-analysis-tbody") as HTMLElement;

  if (analysisResults.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">目前無啟用的限制條件規則。</td></tr>`;
    return;
  }

  const getRuleStage = (res: RuleAnalysisResult): 1 | 2 | 3 => {
    const allUnique = res.involvedValues.every(
      (v) => finalFeasibleMap[v]?.length === 1,
    );
    if (!allUnique) return 2;
    return res.involvedValues.every((v) => isValueSelectedInAnswerGrid(v))
      ? 3
      : 1;
  };

  const sortedResults = analysisResults
    .map((res, originalIndex) => ({
      res,
      stage: getRuleStage(res),
      originalIndex,
    }))
    .sort((a, b) =>
      a.stage !== b.stage
        ? a.stage - b.stage
        : a.originalIndex - b.originalIndex,
    );

  const fragment = document.createDocumentFragment();

  sortedResults.forEach(({ res, stage }) => {
    const tr = document.createElement("tr");

    const stageBadge =
      stage === 1
        ? '<span class="badge bg-warning text-dark ms-1"><i class="bi bi-arrow-right-circle-fill me-1"></i>可填入解答區</span>'
        : stage === 3
          ? '<span class="badge bg-secondary ms-1">已反映</span>'
          : "";

    if (stage === 1) tr.className = "rule-stage-ready";
    else if (stage === 3) tr.className = "rule-stage-completed";

    let patternSubTable = `<table class="table table-sm table-borderless mb-0">`;
    res.patterns.forEach((p) => {
      const keys = p.keys || Object.keys(p.feasMap);
      const details = keys.map(
        (v) => `${escapeHtml(v)}: [${p.feasMap[v].join(",") || "無"}]`,
      );
      const badgeClass =
        stage === 3
          ? "bg-secondary"
          : stage === 1
            ? "bg-warning text-dark"
            : "bg-primary-subtle text-primary";
      patternSubTable += `
        <tr>
          <td style="width:40%;"><span class="badge ${badgeClass} border">${escapeHtml(p.expr)}</span></td>
          <td style="width:60%;" class="mono text-muted small">${details.join(" | ")}</td>
        </tr>`;
    });
    patternSubTable += `</table>`;

    const involvedHTML = res.involvedValues
      .map((v) => `<div class="fw-bold">${escapeHtml(v)}</div>`)
      .join("");

    const feasibleHTML = res.involvedValues
      .map((v) => {
        const posStr =
          res.feasibleMap[v].length > 0
            ? res.feasibleMap[v].join(",")
            : "無可行解";
        const badgeClass =
          stage === 1
            ? "bg-warning text-dark fw-bold"
            : stage === 3
              ? "bg-secondary"
              : "bg-success";
        return `<div><span class="badge ${badgeClass} pos-badge">${posStr}</span></div>`;
      })
      .join("");

    tr.innerHTML = `
      <td class="fw-bold text-dark">${escapeHtml(res.ruleDesc)}${stageBadge}</td>
      <td class="p-1">${patternSubTable}</td>
      <td class="cell-center bg-light">${involvedHTML}</td>
      <td class="cell-center ${stage === 1 ? "bg-warning-subtle" : stage === 3 ? "bg-light" : "bg-possibility"}">${feasibleHTML}</td>`;

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

// ==========================================
// 推理歷史與回顧的核心函式
// ==========================================

/**
 * 從 past 陣列重建整個 userGrid
 */
export function rebuildGridFromPast(past: ReasoningItem[]): Grid {
  const grid: Grid = {};
  state.features.forEach((_, fIdx) => {
    grid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      grid[fIdx][p] = { value: "", reasoningId: null };
    }
  });

  for (const item of past) {
    grid[item.featureIndex][item.position] = {
      value: item.value,
      reasoningId: item.id,
    };
  }
  return grid;
}

/**
 * 撤銷：回退到 past 中某個步驟之前（點擊編號 id 按鈕）
 */
export function rollbackToBefore(itemId: number): void {
  const idx = state.past.findIndex((h) => h.id === itemId);
  if (idx === -1) return;

  // 移出此步驟以及之後的所有步驟
  const undone = state.past.splice(idx);
  // 前置推入 future
  state.future = [...undone, ...state.future];

  // 重新建立 userGrid 並渲染
  state.userGrid = rebuildGridFromPast(state.past);
  updateSolveWorkspace();
}

/**
 * 重做：前進到 future 中某個步驟之後（點擊編號 id 按鈕）
 */
export function fastForwardToAfter(itemId: number): void {
  const idx = state.future.findIndex((h) => h.id === itemId);
  if (idx === -1) return;

  // 從 future 移除 0~idx 項
  const redone = state.future.splice(0, idx + 1);
  // 後置推入 past
  state.past = [...state.past, ...redone];

  // 重新建立 userGrid 並渲染
  state.userGrid = rebuildGridFromPast(state.past);
  updateSolveWorkspace();
}

/**
 * 取得推理歷史項目可用的規則列表
 */
function getAvailableRulesForHistory(item: ReasoningItem): RuleDescription[] {
  const { value, position, isAuto } = item;

  const generalRules: RuleDescription[] = isAuto
    ? [{ id: "G1", desc: GENERAL_RULES.G1(value) }]
    : [
        { id: "G1", desc: GENERAL_RULES.G1(value) },
        { id: "G2", desc: GENERAL_RULES.G2(value, position) },
        { id: "G3", desc: GENERAL_RULES.G3(value) },
      ];

  const dbRules = state.rules.filter((rule) => {
    if (!rule.enabled) return false;
    if (isAuto) {
      return ruleEngine
        .getInvolvedValues(rule.type, rule.params)
        .includes(value);
    }
    return true;
  });

  return [...generalRules, ...dbRules];
}

/** 渲染整個推理過程紀錄區（上表與下表） */
function renderReasoningHistory(): void {
  renderPastHistory();
  renderFutureHistory();
}

/** 渲染已完成步驟（上表） */
function renderPastHistory(): void {
  const tbody = document.getElementById("reasoning-past-tbody");
  if (!tbody) return;

  if (state.past.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-3">目前尚無已完成步驟。</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.past.forEach((item) => {
    const tr = document.createElement("tr");

    // 1. 編號（回退按鈕）
    const idTd = document.createElement("td");
    idTd.className = "text-center p-1";
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-primary py-0 px-2 fw-bold";
    btn.style.fontSize = "0.8rem";
    btn.textContent = String(item.id);
    btn.title = `點擊回退到步驟 ${item.id} 之前`;
    btn.onclick = () => rollbackToBefore(item.id);
    idTd.appendChild(btn);
    tr.appendChild(idTd);

    // 2. 推理結果描述
    const descTd = document.createElement("td");
    descTd.className = "fw-bold text-dark";
    descTd.textContent = item.desc;
    tr.appendChild(descTd);

    // 3. 推理依據規則（可編輯）
    tr.appendChild(_buildRulesTd(item, true));

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

/** 渲染已撤回步驟（下表） */
function renderFutureHistory(): void {
  const tbody = document.getElementById("reasoning-future-tbody");
  if (!tbody) return;

  if (state.future.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted p-3">目前尚無已撤回步驟。</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.future.forEach((item) => {
    const tr = document.createElement("tr");
    tr.className = "table-light text-muted opacity-75";

    // 1. 編號（重做按鈕）
    const idTd = document.createElement("td");
    idTd.className = "text-center p-1";
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-secondary py-0 px-2 fw-bold";
    btn.style.fontSize = "0.8rem";
    btn.textContent = String(item.id);
    btn.title = `點擊重做到步驟 ${item.id} 之後`;
    btn.onclick = () => fastForwardToAfter(item.id);
    idTd.appendChild(btn);
    tr.appendChild(idTd);

    // 2. 推理結果描述
    const descTd = document.createElement("td");
    descTd.className = "fw-bold";
    descTd.textContent = item.desc;
    tr.appendChild(descTd);

    // 3. 推理依據規則（唯讀）
    tr.appendChild(_buildRulesTd(item, false));

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

/**
 * 建立推理依據欄的 DOM
 */
function _buildRulesTd(item: ReasoningItem, editable: boolean): HTMLTableCellElement {
  const rulesTd = document.createElement("td");
  rulesTd.className = "p-1";

  const availableRules = getAvailableRulesForHistory(item);
  const innerTable = document.createElement("table");
  innerTable.className = "table table-sm table-borderless mb-0";
  const innerTbody = document.createElement("tbody");

  item.rules.forEach((r, rIdx) => {
    const innerTr = document.createElement("tr");
    const contentTd = document.createElement("td");

    if (item.isAuto || !editable) {
      contentTd.innerHTML = `
        <span class="text-muted" style="font-size:0.85rem;">
          <i class="bi bi-info-circle me-1"></i>${escapeHtml(r.desc)}
        </span>`;
      innerTr.appendChild(contentTd);
    } else {
      const select = document.createElement("select");
      select.className = "form-select form-select-sm p-1";
      select.style.cssText = "font-size:0.8rem;max-width:220px;";
      select.onchange = (e) =>
        onHistoryRuleChange(
          item.id,
          rIdx,
          (e.target as HTMLSelectElement).value,
        );

      availableRules.forEach((rule) => {
        const option = document.createElement("option");
        option.value = String(rule.id);
        option.textContent = rule.desc;
        if (String(rule.id) === String(r.id)) option.selected = true;
        select.appendChild(option);
      });

      const isStillInList = availableRules.some(
        (rule) => String(rule.id) === String(r.id),
      );
      if (!isStillInList) {
        const option = document.createElement("option");
        option.value = String(r.id);
        option.textContent = `${r.desc} (已停用)`;
        option.selected = true;
        select.appendChild(option);
      }

      contentTd.appendChild(select);
      innerTr.appendChild(contentTd);

      const deleteRuleTd = document.createElement("td");
      deleteRuleTd.className = "text-end";
      const deleteRuleBtn = document.createElement("button");
      deleteRuleBtn.className = "btn btn-sm btn-link text-danger p-0";
      deleteRuleBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
      deleteRuleBtn.onclick = () => deleteHistoryRule(item.id, rIdx);
      deleteRuleTd.appendChild(deleteRuleBtn);
      innerTr.appendChild(deleteRuleTd);
    }

    innerTbody.appendChild(innerTr);
  });

  innerTable.appendChild(innerTbody);
  rulesTd.appendChild(innerTable);

  if (editable && !item.isAuto) {
    const addRuleBtn = document.createElement("button");
    addRuleBtn.className =
      "btn btn-sm btn-outline-primary py-0 px-1 mt-1 d-block";
    addRuleBtn.style.fontSize = "0.75rem";
    addRuleBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i>新增依據';
    addRuleBtn.onclick = () => addHistoryRule(item.id);
    rulesTd.appendChild(addRuleBtn);
  }

  return rulesTd;
}

/**
 * 修改推理歷史中某條依據規則
 */
export function onHistoryRuleChange(
  itemId: number,
  ruleIndex: number,
  newRuleId: RuleId,
): void {
  const item = findHistoryItem(itemId);
  if (!item || item.isAuto) return;

  const generalRuleDesc: Record<string, string> = {
    G1: GENERAL_RULES.G1(item.value),
    G2: GENERAL_RULES.G2(item.value, item.position),
    G3: GENERAL_RULES.G3(item.value),
  };

  if (generalRuleDesc[String(newRuleId)] !== undefined) {
    item.rules[ruleIndex] = {
      id: newRuleId,
      desc: generalRuleDesc[String(newRuleId)],
    };
    updateSolveWorkspace();
    return;
  }

  const rule = findRule(newRuleId);
  if (rule) {
    item.rules[ruleIndex] = { id: rule.id, desc: rule.desc };
    updateSolveWorkspace();
  }
}

/**
 * 刪除推理歷史中某條依據規則
 */
export function deleteHistoryRule(itemId: number, ruleIndex: number): void {
  const item = findHistoryItem(itemId);
  if (!item || item.isAuto) return;
  item.rules.splice(ruleIndex, 1);
  updateSolveWorkspace();
}

/**
 * 在推理歷史項目中新增一條依據規則
 */
export function addHistoryRule(itemId: number): void {
  const item = findHistoryItem(itemId);
  if (!item || item.isAuto) return;

  const availableRules = getAvailableRulesForHistory(item);
  if (availableRules.length === 0) {
    alert("沒有可用的限制規則。");
    return;
  }

  const firstRule = availableRules[0];
  item.rules.push({ id: firstRule.id, desc: firstRule.desc });
  updateSolveWorkspace();
}
