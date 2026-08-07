// app.js
import { ruleEngine } from "./ruleEngine.js";

// ==========================================
// 全局資料結構與預設範例
// ==========================================
const state = {
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
      params: {
        val: "挪威人",
        pos: 1,
      },
      desc: "挪威人 住 第一間房子",
      enabled: true,
    },
    {
      id: 2,
      type: "EXACT_POS",
      params: {
        val: "牛奶",
        pos: 3,
      },
      desc: "住在 中間(第3間) 的人喝 牛奶",
      enabled: true,
    },
    {
      id: 3,
      type: "SAME_ENTITY",
      params: {
        val1: "英國人",
        val2: "紅房子",
      },
      desc: "英國人 住 紅房子",
      enabled: true,
    },
    {
      id: 4,
      type: "ORDERED_ADJ",
      params: {
        dir: "left",
        val1: "綠房子",
        val2: "白房子",
      },
      desc: "綠房子 在 白房子 的 左側隔壁",
      enabled: true,
    },
    {
      id: 5,
      type: "SAME_ENTITY",
      params: {
        val1: "丹麥人",
        val2: "茶",
      },
      desc: "丹麥人 喝 茶",
      enabled: true,
    },
    {
      id: 6,
      type: "ADJACENT",
      params: {
        val1: "挪威人",
        val2: "藍房子",
      },
      desc: "挪威人 和 住藍房子 的人 相鄰",
      enabled: true,
    },
    {
      id: 7,
      type: "SAME_ENTITY",
      params: {
        val1: "瑞典人",
        val2: "狗",
      },
      desc: "瑞典人 養 狗",
      enabled: true,
    },
    {
      id: 8,
      type: "SAME_ENTITY",
      params: {
        val1: "綠房子",
        val2: "咖啡",
      },
      desc: "住綠房子 的人 喝 咖啡",
      enabled: true,
    },
    {
      id: 9,
      type: "SAME_ENTITY",
      params: {
        val1: "Pall Mall",
        val2: "鳥",
      },
      desc: "抽 Pall Mall 的人 養 鳥",
      enabled: true,
    },
    {
      id: 10,
      type: "SAME_ENTITY",
      params: {
        val1: "黃房子",
        val2: "Dunhill",
      },
      desc: "住黃房子 的人 抽 Dunhill",
      enabled: true,
    },
    {
      id: 11,
      type: "ADJACENT",
      params: {
        val1: "Blends",
        val2: "貓",
      },
      desc: "抽 Blends 的人與 養 貓 的人相鄰",
      enabled: true,
    },
    {
      id: 12,
      type: "ADJACENT",
      params: {
        val1: "馬",
        val2: "Dunhill",
      },
      desc: "養 馬 的人與 抽 Dunhill 的人相鄰",
      enabled: true,
    },
    {
      id: 13,
      type: "SAME_ENTITY",
      params: {
        val1: "Blue Master",
        val2: "啤酒",
      },
      desc: "抽 Blue Master 的人 喝 啤酒",
      enabled: true,
    },
    {
      id: 14,
      type: "SAME_ENTITY",
      params: {
        val1: "德意志",
        val2: "Prince",
      },
      desc: "德意志人 抽 Prince",
      enabled: true,
    },
    {
      id: 15,
      type: "ADJACENT",
      params: {
        val1: "Blends",
        val2: "水",
      },
      desc: "抽 Blends 的人與 喝 水 的人相鄰",
      enabled: true,
    },
  ],
  userGrid: {},
};

let importIncludeAnswers = false;

// 初始化頁面
async function initApp() {
  await ruleEngine.init();
  populateRuleTypeSelect();
  initUserGrid();
  renderFeatureConfig();
  renderRulesTable();
  renderRuleFormInputs();

  document.getElementById("solve-tab").addEventListener("shown.bs.tab", () => {
    updateSolveWorkspace();
  });
}

/**
 * 1. 填入「規則類型」下拉選單
 */
function populateRuleTypeSelect() {
  const select = document.getElementById("rule-type-select");
  select.innerHTML = '<option value="">-- 請選擇規則類型 --</option>';

  ruleEngine.getRegisteredRules().forEach((meta) => {
    const option = document.createElement("option");
    option.value = meta.type;
    option.textContent = meta.name;
    select.appendChild(option);
  });
}

function initUserGrid() {
  state.userGrid = {};
  state.features.forEach((_, fIdx) => {
    state.userGrid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      state.userGrid[fIdx][p] = "";
    }
  });
}

// ==========================================
// 匯入與匯出功能
// ==========================================
window.exportData = function (includeAnswers) {
  const dataToExport = {
    entityCount: state.entityCount,
    features: state.features,
    rules: state.rules,
  };
  if (includeAnswers) dataToExport.userGrid = state.userGrid;

  const jsonStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = includeAnswers
    ? `zebra_puzzle_with_answers.json`
    : `zebra_puzzle_question.json`;
  a.click();
  URL.revokeObjectURL(url);
};

window.triggerImport = function (includeAnswers) {
  importIncludeAnswers = includeAnswers;
  const fileInput = document.getElementById("import-file-input");
  fileInput.value = "";
  fileInput.click();
};

window.handleFileImport = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (
        !importedData.entityCount ||
        !importedData.features ||
        !importedData.rules
      ) {
        throw new Error("無效的 JSON 結構！");
      }

      state.entityCount = importedData.entityCount;
      document.getElementById("entity-count").value = state.entityCount;
      state.features = importedData.features;

      // 確保舊版匯入的規則有 enabled 屬性
      state.rules = importedData.rules.map((r) => ({
        ...r,
        enabled: r.enabled !== undefined ? r.enabled : true,
      }));

      initUserGrid();
      if (importIncludeAnswers && importedData.userGrid) {
        state.userGrid = importedData.userGrid;
      }

      renderFeatureConfig();
      renderRulesTable();
      renderRuleFormInputs();
      updateSolveWorkspace();

      alert(importIncludeAnswers ? "題目與解答匯入成功！" : "題目匯入成功！");
    } catch (err) {
      alert("匯入失敗：檔案格式不正確！" + err.message);
    }
  };
  reader.readAsText(file);
};

// ==========================================
// 個體與特徵設定
// ==========================================
window.changeEntityCount = function (delta) {
  const newCount = state.entityCount + delta;
  if (newCount < 2 || newCount > 8) return;
  state.entityCount = newCount;
  document.getElementById("entity-count").value = newCount;

  state.features.forEach((f) => {
    while (f.values.length < newCount)
      f.values.push(`${f.name}_${f.values.length + 1}`);
    while (f.values.length > newCount) f.values.pop();
  });

  initUserGrid();
  renderFeatureConfig();
};

window.addFeature = function () {
  const fIndex = state.features.length + 1;
  const fName = `特徵${fIndex}`;
  const values = [];
  for (let i = 1; i <= state.entityCount; i++) values.push(`${fName}_值${i}`);
  state.features.push({ name: fName, values: values });
  initUserGrid();
  renderFeatureConfig();
};

window.removeFeature = function (fIdx) {
  if (state.features.length <= 1) {
    alert("至少需要保留一個特徵類別！");
    return;
  }
  state.features.splice(fIdx, 1);
  initUserGrid();
  renderFeatureConfig();
};

function renderFeatureConfig() {
  const container = document.getElementById("feature-list-container");
  container.innerHTML = "";

  state.features.forEach((feat, fIdx) => {
    const card = document.createElement("div");
    card.className = "card mb-3 border";
    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-2 align-items-center mb-2">
          <div class="col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light fw-bold">特徵類別</span>
              <input type="text" class="form-control" value="${feat.name}" onchange="updateFeatureName(${fIdx}, this.value)">
            </div>
          </div>
          <div class="col-md-8 text-end">
            <button class="btn btn-outline-danger btn-sm" onclick="removeFeature(${fIdx})">
              <i class="bi bi-trash"></i> 刪除此類別
            </button>
          </div>
        </div>
        <div>
          <label class="form-label small text-muted mb-1">可能值列表 (需為 ${state.entityCount} 個不重複值)：</label>
          <div class="d-flex flex-wrap gap-2">
            ${feat.values
              .map(
                (v, vIdx) => `
              <input type="text" class="form-control form-control-sm" style="width: 110px;" 
                     value="${v}" onchange="updateFeatureValue(${fIdx}, ${vIdx}, this.value)">
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.updateFeatureName = function (fIdx, name) {
  state.features[fIdx].name = name;
};
window.updateFeatureValue = function (fIdx, vIdx, val) {
  state.features[fIdx].values[vIdx] = val;
};
function getAllValues() {
  const list = [];
  state.features.forEach((f) => list.push(...f.values));
  return list;
}

// ==========================================
// 規則選擇與設定 (包含勾選啟用與批次操作)
// ==========================================

/**
 * 2. 當選擇規則類型時，依據 meta.json 繪製輸入表單
 */
window.renderRuleFormInputs = function () {
  const select = document.getElementById("rule-type-select");
  const container = document.getElementById("rule-inputs-container");
  const selectedType = select.value;

  container.innerHTML = "";
  if (!selectedType) {
    container.innerHTML =
      '<p class="placeholder-text">請先選擇規則類型以顯示輸入表單</p>';
    return;
  }

  const meta = ruleEngine.getRuleMeta(selectedType);
  if (!meta || !meta.inputs) return;

  // 取得現有所有特徵值 (用於 VALUE_SELECT)
  const allValues = state.features.flatMap((c) => c.values);

  meta.inputs.forEach((input) => {
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "form-group mb-2";

    const label = document.createElement("label");
    label.textContent = `${input.label}:`;
    label.htmlFor = input.key;
    label.className = "form-label small fw-bold mb-1";
    fieldGroup.appendChild(label);

    const inputElem = document.createElement("select");
    inputElem.className = "form-select form-select-sm";
    inputElem.id = input.key;
    inputElem.name = input.key;
    inputElem.dataset.key = input.key;

    if (input.type === "VALUE_SELECT") {
      allValues.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        inputElem.appendChild(opt);
      });
    } else if (input.type === "POS_SELECT") {
      for (let i = 1; i <= state.entityCount; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `第 ${i} 個位置`;
        inputElem.appendChild(opt);
      }
    } else if (input.type === "DIR_SELECT") {
      inputElem.innerHTML = `
        <option value="left">左側</option>
        <option value="right">右側</option>
      `;
    }

    if (["VALUE_SELECT", "POS_SELECT", "DIR_SELECT"].includes(input.type)) {
      fieldGroup.appendChild(inputElem);
    }

    container.appendChild(fieldGroup);
  });
};

/**
 * 3. 處理「新增規則」點擊事件
 */
window.handleAddRule = function () {
  const select = document.getElementById("rule-type-select");
  const type = select.value;
  if (!type) return alert("請先選擇規則類型");

  const container = document.getElementById("rule-inputs-container");
  const inputs = container.querySelectorAll("[data-key]");
  const params = {};

  inputs.forEach((elem) => {
    const key = elem.dataset.key;
    // 若為數字類型轉成 Number，其餘保持原值
    const val = elem.value;
    params[key] = !isNaN(val) && elem.type !== "text" ? Number(val) : val;
  });

  const desc = ruleEngine.buildDescription(type, params);

  // 推入 state.rules
  const newRule = {
    id: `rule-${Date.now()}`,
    type: type,
    params: params,
    desc: desc,
    enabled: true,
  };

  state.rules.push(newRule);
  renderRulesTable();
};

/**
 * 4. 渲染已新增的規則清單 (搭配 ruleEngine.buildDescription)
 */
function renderRulesTable() {
  const container = document.getElementById("rules-table-body");

  if (state.rules.length === 0) {
    container.innerHTML =
      "<tr><td></td><td></td><td>目前尚無任何規則，請於左方新增。</td></tr>";
    return;
  }

  const activeCount = state.rules.filter((r) => r.enabled).length;
  document.getElementById("rule-count-badge").innerText =
    `已啟用 ${activeCount} / 共 ${state.rules.length} 條`;

  container.innerHTML = "";
  state.rules.forEach((rule, index) => {
    const tr = document.createElement("tr");
    if (rule.enabled) tr.className = "rule-item";
    else tr.className = "rule-item rule-disabled";
    tr.innerHTML = `
      <td class="text-center">
        <input type="checkbox" class="form-check-input" ${rule.enabled ? "checked" : ""} onchange="toggleRuleEnabled(${rule.id}, this.checked)">
      </td>
      <td><span class="badge ${rule.enabled ? "bg-outline-dark text-dark border" : "bg-secondary"}">${rule.type}</span></td>
      <td class="rule-text fw-bold">${rule.desc}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-danger" onclick="removeRule(${rule.id})">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>
    `;
    container.appendChild(tr);
  });
}

window.removeRule = function (ruleId) {
  state.rules = state.rules.filter((r) => r.id !== ruleId);
  renderRulesTable();
};

window.toggleRuleEnabled = function (id, enabled) {
  const rule = state.rules.find((r) => r.id === id);
  if (rule) rule.enabled = enabled;
  renderRulesTable();
};
window.toggleAllRules = function (status) {
  state.rules.forEach((r) => (r.enabled = status));
  renderRulesTable();
};
window.removeAllRules = function () {
  if (confirm("確定要刪除全部限制條件嗎？")) {
    state.rules = [];
    renderRulesTable();
  }
};

// ==========================================
// 推理互動工作區與自動推導核心邏輯
// ==========================================

function updateSolveWorkspace() {
  renderAnswerGrid();

  const remainingPosMap = computeRemainingPositions();
  renderTwoRowPositionGrid("remaining-pos-grid", remainingPosMap, "secondary");

  const ruleAnalysisResults = computeRuleAnalysis(remainingPosMap);
  console.log(ruleAnalysisResults);
  const finalFeasibleMap = computeFinalFeasiblePositions(
    remainingPosMap,
    ruleAnalysisResults,
  );

  renderRuleAnalysisTable(ruleAnalysisResults, finalFeasibleMap);
  renderTwoRowPositionGrid("feasible-pos-grid", finalFeasibleMap, "dynamic");

  return finalFeasibleMap;
}

// 🤖 數獨自動推理功能
window.autoSolveStepByStep = function () {
  let changedInLoop = false;
  let totalSteps = 0;
  const maxLoops = 50;

  for (let loop = 0; loop < maxLoops; loop++) {
    const currentFeasibleMap = updateSolveWorkspace();
    let stepChanged = false;

    state.features.forEach((feat, fIdx) => {
      feat.values.forEach((val) => {
        const feasiblePositions = currentFeasibleMap[val] || [];
        if (feasiblePositions.length === 1) {
          const targetPos = feasiblePositions[0];
          if (state.userGrid[fIdx][targetPos] !== val) {
            state.userGrid[fIdx][targetPos] = val;
            stepChanged = true;
            changedInLoop = true;
          }
        }
      });
    });

    if (!stepChanged) break;
    totalSteps++;
  }

  updateSolveWorkspace();

  if (totalSteps > 0) {
    alert(`自動推理完成！共進行了 ${totalSteps} 輪數獨推導填入。`);
  } else {
    alert("無法繼續推理：目前資訊不足以產生確定項，或解答已完全填滿。");
  }
};

// 渲染「解答區」表格
function renderAnswerGrid() {
  const grid = document.getElementById("answer-grid");
  let html = `<thead><tr class="table-light"><th style="width:100px;">特徵類別</th>`;
  for (let p = 1; p <= state.entityCount; p++) {
    html += `<th class="text-center">位置 ${p}</th>`;
  }
  html += `</tr></thead><tbody>`;

  state.features.forEach((feat, fIdx) => {
    const usedValuesInFeature = new Set();
    for (let p = 1; p <= state.entityCount; p++) {
      const v = state.userGrid[fIdx][p];
      if (v) usedValuesInFeature.add(v);
    }

    html += `<tr><td class="fw-bold bg-light">${feat.name}</td>`;
    for (let p = 1; p <= state.entityCount; p++) {
      const selectedVal = state.userGrid[fIdx][p] || "";

      html += `<td>
        <select class="form-select form-select-sm ${selectedVal ? "bg-warning-subtle fw-bold" : ""}" 
                onchange="onUserSelectChange(${fIdx}, ${p}, this.value)">
          <option value="">-- 未定 --</option>
          ${feat.values
            .map((v) => {
              const isSelectedHere = selectedVal === v;
              const isDisabled = !isSelectedHere && usedValuesInFeature.has(v);
              return `<option value="${v}" ${isSelectedHere ? "selected" : ""} ${isDisabled ? "disabled" : ""}>${v}</option>`;
            })
            .join("")}
        </select>
      </td>`;
    }
    html += `</tr>`;
  });
  html += `</tbody>`;
  grid.innerHTML = html;
}

window.onUserSelectChange = function (fIdx, pos, value) {
  state.userGrid[fIdx][pos] = value;
  updateSolveWorkspace();
};

window.resetUserChoices = function () {
  initUserGrid();
  updateSolveWorkspace();
};

function computeRemainingPositions() {
  const remMap = {};
  const N = state.entityCount;

  state.features.forEach((feat, fIdx) => {
    const selectedValues = {};
    const occupiedPositions = new Set();

    for (let p = 1; p <= N; p++) {
      const val = state.userGrid[fIdx][p];
      if (val) {
        selectedValues[val] = p;
        occupiedPositions.add(p);
      }
    }

    feat.values.forEach((v) => {
      if (selectedValues[v]) {
        remMap[v] = [selectedValues[v]];
      } else {
        const possible = [];
        for (let p = 1; p <= N; p++) {
          if (!occupiedPositions.has(p)) {
            possible.push(p);
          }
        }
        remMap[v] = possible;
      }
    });
  });

  return remMap;
}

function renderTwoRowPositionGrid(tableId, posMap, badgeType) {
  const table = document.getElementById(tableId);
  let html = "<tbody>";

  state.features.forEach((feat) => {
    html += `<tr>`;
    html += `<td rowspan="2" class="feature-label">${feat.name}</td>`;
    feat.values.forEach((v) => {
      html += `<td class="val-header">${v}</td>`;
    });
    html += `</tr>`;

    html += `<tr class="pos-row mb-2">`;
    feat.values.forEach((v) => {
      const posList = posMap[v] || [];
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

// 僅針對 enabled: true 的規則進行推理運算
function computeRuleAnalysis(remMap) {
  const N = state.entityCount;

  return state.rules
    .filter((r) => r.enabled)
    .map((rule) => {
      const patterns = ruleEngine.getPatterns(
        rule.type,
        rule.params,
        remMap,
        N,
      );
      const involvedValues = ruleEngine.getInvolvedValues(
        rule.type,
        rule.params,
      );

      const finalFeasibleMap = ruleEngine.calculateFeasiblePositions(
        rule.type,
        rule.params,
        remMap,
        N,
      );

      return {
        ruleDesc: rule.desc,
        patterns: patterns,
        involvedValues: involvedValues,
        feasibleMap: finalFeasibleMap,
      };
    });
}

function computeFinalFeasiblePositions(remMap, analysisResults) {
  const finalMap = {};

  Object.keys(remMap).forEach((v) => {
    finalMap[v] = new Set(remMap[v]);
  });

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

  const resultMap = {};
  Object.keys(finalMap).forEach((v) => {
    resultMap[v] = Array.from(finalMap[v]).sort((a, b) => a - b);
  });

  return resultMap;
}

// 判斷解答區是否已填入該特徵值
function isValueSelectedInAnswerGrid(val) {
  for (const fIdx in state.userGrid) {
    for (const pos in state.userGrid[fIdx]) {
      if (state.userGrid[fIdx][pos] === val) return true;
    }
  }
  return false;
}

// 渲染「規則展示與特徵可行位置區」表格（三階段判定與排序）
function renderRuleAnalysisTable(analysisResults, finalFeasibleMap) {
  const tbody = document.getElementById("rule-analysis-tbody");
  tbody.innerHTML = "";

  if (analysisResults.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">目前無啟用的限制條件規則。</td></tr>`;
    return;
  }

  // 判定規則的三種階段狀態：
  // 1: READY      - 分析出唯一可行解，但尚未反映至解答區 (頂部)
  // 2: UNRESOLVED - 尚未分析出唯一可行解 (中部)
  // 3: COMPLETED  - 分析出唯一可行解，且已反映至解答區 (底部)
  const getRuleStage = (res) => {
    const allUnique = res.involvedValues.every(
      (v) => finalFeasibleMap[v] && finalFeasibleMap[v].length === 1,
    );

    if (!allUnique) {
      return 2; // 第二種：尚未分析出唯一可行解
    } else {
      const allReflected = res.involvedValues.every((v) =>
        isValueSelectedInAnswerGrid(v),
      );
      if (allReflected) {
        return 3; // 第三種：已分析出唯一解且已反映至解答區
      } else {
        return 1; // 第一種：已分析出唯一解，但還沒反映至解答區
      }
    }
  };

  const sortedResults = analysisResults
    .map((res, originalIndex) => {
      return { res, stage: getRuleStage(res), originalIndex };
    })
    .sort((a, b) => {
      if (a.stage === b.stage) return a.originalIndex - b.originalIndex;
      return a.stage - b.stage; // Stage 1 -> 2 -> 3 排序
    });

  sortedResults.forEach(({ res, stage }) => {
    const tr = document.createElement("tr");

    let stageBadge = "";
    if (stage === 1) {
      tr.className = "rule-stage-ready";
      stageBadge =
        '<span class="badge bg-warning text-dark ms-1"><i class="bi bi-arrow-right-circle-fill me-1"></i>可填入解答區</span>';
    } else if (stage === 3) {
      tr.className = "rule-stage-completed";
      stageBadge = '<span class="badge bg-secondary ms-1">已反映</span>';
    }

    let patternSubTable = `<table class="table table-sm table-borderless mb-0">`;
    res.patterns.forEach((p) => {
      const details = [];
      Object.keys(p.feasMap).forEach((v) => {
        details.push(`${v}: [${p.feasMap[v].join(",") || "無"}]`);
      });
      patternSubTable += `
        <tr>
          <td style="width:40%;"><span class="badge ${stage === 3 ? "bg-secondary" : stage === 1 ? "bg-warning text-dark" : "bg-primary-subtle text-primary"} border">${p.expr}</span></td>
          <td style="width:60%;" class="mono text-muted small">${details.join(" | ")}</td>
        </tr>
      `;
    });
    patternSubTable += `</table>`;

    const involvedHTML = res.involvedValues
      .map((v) => `<div class="fw-bold">${v}</div>`)
      .join("");

    const feasibleHTML = res.involvedValues
      .map((v) => {
        const posStr =
          res.feasibleMap[v].length > 0
            ? res.feasibleMap[v].join(",")
            : "無可行解";
        let badgeClass = "bg-success";
        if (stage === 1) badgeClass = "bg-warning text-dark fw-bold";
        else if (stage === 3) badgeClass = "bg-secondary";

        return `<div><span class="badge ${badgeClass} pos-badge">${posStr}</span></div>`;
      })
      .join("");

    tr.innerHTML = `
      <td class="fw-bold text-dark">
        ${res.ruleDesc}
        ${stageBadge}
      </td>
      <td class="p-1">${patternSubTable}</td>
      <td class="cell-center bg-light">${involvedHTML}</td>
      <td class="cell-center ${stage === 1 ? "bg-warning-subtle" : stage === 3 ? "bg-light" : "bg-possibility"}">${feasibleHTML}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 啟動應用程式
document.addEventListener("DOMContentLoaded", initApp);
