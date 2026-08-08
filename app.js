// app.js

/**
 *
 * @typedef Feature - 特徵
 * @property {string} name - 特徵類別名稱
 * @property {FeatureValue[]} values - 特徵值陣列
 *
 * @typedef {string|number} FeatureValue - 特徵值
 * @typedef {number} Position - 位置
 *
 * @typedef GridCell
 * @property {FeatureValue} value - 特徵值
 * @property {number|null} reasoningId - 對應 ReasoningItem 的 id
 *
 * @typedef {"VALUE_SELECT"|"POS_SELECT"|"DIR_SELECT"|"NUM_SELECT"|"CUSTOM_SELECT"} RuleType - 規則類型
 *
 * @typedef Rule - 規則
 * @property {string|number} id
 * @property {RuleType} type - 規則類型
 * @property {Record<string, FeatureValue>} params - 規則參數
 * @property {string} desc - 規則描述
 * @property {boolean} enabled - 啟用/停用
 *
 * @typedef RuleDescription - 規則略述
 * @property {string|number} id - 對應 Rule 的 id
 * @property {string} desc - 對應 Rule 的 desc
 *
 * @typedef ReasoningItem 推理項目
 * @property {number} id
 * @property {string} feature - 對應 Feature 的 name
 * @property {FeatureValue} value - 特徵值
 * @property {Position} position - 位置
 * @property {string} desc - 推理結果描述
 * @property {RuleDescription[]} rules - 推理依據
 * @property {boolean} isAuto - 自動推理/手動推理
 *
 * @typedef {Record<FeatureValue, Position[]>} FeasibleMap - 可行解
 *
 * @typedef RulePattern 規則可能排列
 * @property {string} expr - 排列表達式
 * @property {FeatureValue[]} keys - 排列相關特徵值
 * @property {FeasibleMap} feasMap - 對應可行解
 *
 * @typedef RuleAnalysisResult - 規則分析結果
 * @property {string|number} ruleId - 對應 Rule 的 id
 * @property {string} ruleDesc - 對應 Rule 的 desc
 * @property {RulePattern[]} patterns - 規則可能排列組合
 * @property {FeatureValue[]} involvedValues - 規則相關特徵值
 * @property {FeasibleMap} feasibleMap - 規則最終可行解
 *
 * @typedef State
 * @property {number} entityCount
 * @property {Feature[]} features
 * @property {Rule[]} rules
 * @property {{[featIdx: number]: {[pos: number]: GridCell}}} userGrid
 * @property {ReasoningItem[]} reasoningHistory
 * @property {number} nextReasoningId
 */

import { ruleEngine } from "./ruleEngine.js";

// ==========================================
// 常數定義
// ==========================================
const ENTITY_COUNT_MIN = 2;
const ENTITY_COUNT_MAX = 8;
const AUTO_SOLVE_MAX_LOOPS = 50;
const GENERAL_RULES = Object.freeze({
  G1: (value) => `${value} 僅剩一個位置`,
  G2: (value, pos) => `第 ${pos ?? "i"} 個位置僅能填入 ${value}`,
  G3: (value) => `數獨規則 ${value} 刪去部分可能位置`,
});

// ==========================================
// 全局資料結構與預設範例
// ==========================================
/** @type {State} */
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
  reasoningHistory: [],
  nextReasoningId: 1,
};

// 匯入時是否包含解答
let importIncludeAnswers = false;

// ==========================================
// 工具函式
// ==========================================

/**
 * 安全地跳脫 HTML 特殊字元，防止 XSS 注入
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 以 id 從 state.reasoningHistory 查找項目
 * @param {number} itemId
 * @returns {ReasoningItem|undefined}
 */
function findHistoryItem(itemId) {
  return state.reasoningHistory.find((h) => h.id === itemId);
}

/**
 * 以 id 從 state.rules 查找規則
 * @param {string|number} ruleId
 * @returns {Rule|undefined}
 */
function findRule(ruleId) {
  return state.rules.find((r) => String(r.id) === String(ruleId));
}

// ==========================================
// 初始化
// ==========================================

/** 初始化頁面 */
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

/** 填入「規則類型」下拉選單 */
function populateRuleTypeSelect() {
  const select = document.getElementById("rule-type-select");
  // 保留預設佔位選項
  select.innerHTML = '<option value="">-- 請選擇規則類型 --</option>';

  ruleEngine.getRegisteredRules().forEach((meta) => {
    const option = document.createElement("option");
    option.value = meta.type;
    option.textContent = meta.name;
    select.appendChild(option);
  });
}

/** 重置使用者填答格與推理歷史 */
function initUserGrid() {
  state.userGrid = {};
  state.features.forEach((_, fIdx) => {
    state.userGrid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      state.userGrid[fIdx][p] = { value: "", reasoningId: null };
    }
  });
  state.reasoningHistory = [];
  state.nextReasoningId = 1;
}

// ==========================================
// 匯入與匯出功能
// ==========================================

/**
 * 匯出題目（或含解答）為 JSON 檔案
 * @param {boolean} includeAnswers
 */
window.exportData = function (includeAnswers) {
  const dataToExport = {
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
};

/**
 * 觸發檔案選擇器以進行匯入
 * @param {boolean} includeAnswers
 */
window.triggerImport = function (includeAnswers) {
  importIncludeAnswers = includeAnswers;
  const fileInput = document.getElementById("import-file-input");
  fileInput.value = "";
  fileInput.click();
};

/**
 * 處理檔案匯入事件
 * @param {Event} event
 */
window.handleFileImport = function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // 驗證必要欄位
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

      // 兼容舊版：確保每條規則都有 enabled 與 params 欄位
      state.rules = importedData.rules.map(
        ({ id, type, params, desc, enabled, ...legacyArgs }) => {
          const sourceParams = params ?? legacyArgs;
          const { desc: paramDesc, ...normalizedParams } = sourceParams;
          return {
            id,
            type,
            desc:
              desc ??
              paramDesc ??
              ruleEngine.buildDescription(type, normalizedParams),
            params: normalizedParams,
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
      alert(`匯入失敗：檔案格式不正確！${err.message}`);
    }
  };
  reader.readAsText(file);
};

/**
 * 從匯入資料中還原 userGrid 與推理歷史（內部輔助函式）
 * @param {object} importedData
 */
function _restoreUserGrid(importedData) {
  const importedGrid = importedData.userGrid;
  state.userGrid = {};

  state.features.forEach((_, fIdx) => {
    state.userGrid[fIdx] = {};
    for (let p = 1; p <= state.entityCount; p++) {
      const item = importedGrid?.[fIdx]?.[p];
      if (item) {
        state.userGrid[fIdx][p] =
          typeof item === "object"
            ? { value: item.value || "", reasoningId: item.reasoningId || null }
            : { value: item, reasoningId: null };
      } else {
        state.userGrid[fIdx][p] = { value: "", reasoningId: null };
      }
    }
  });

  state.reasoningHistory = importedData.reasoningHistory || [];
  state.nextReasoningId = importedData.nextReasoningId || 1;
}

// ==========================================
// 個體與特徵設定
// ==========================================

/**
 * 調整個體數量
 * @param {number} delta  +1 或 -1
 */
window.changeEntityCount = function (delta) {
  const newCount = state.entityCount + delta;
  if (newCount < ENTITY_COUNT_MIN || newCount > ENTITY_COUNT_MAX) return;

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

/** 新增特徵類別 */
window.addFeature = function () {
  const fName = `特徵${state.features.length + 1}`;
  const values = Array.from(
    { length: state.entityCount },
    (_, i) => `${fName}_值${i + 1}`,
  );
  state.features.push({ name: fName, values });
  initUserGrid();
  renderFeatureConfig();
};

/**
 * 刪除特徵類別
 * @param {number} fIdx
 */
window.removeFeature = function (fIdx) {
  if (state.features.length <= 1) {
    alert("至少需要保留一個特徵類別！");
    return;
  }
  state.features.splice(fIdx, 1);
  initUserGrid();
  renderFeatureConfig();
};

/** 渲染特徵設定面板 */
function renderFeatureConfig() {
  const container = document.getElementById("feature-list-container");
  // 使用 DocumentFragment 批次操作，減少 reflow
  const fragment = document.createDocumentFragment();

  state.features.forEach((feat, fIdx) => {
    const card = document.createElement("div");
    card.className = "card mb-3 border";

    const valuesHtml = feat.values
      .map(
        (v, vIdx) =>
          `<input type="text" class="form-control form-control-sm" style="width:110px;"
               value="${escapeHtml(v)}"
               onchange="updateFeatureValue(${fIdx}, ${vIdx}, this.value)">`,
      )
      .join("");

    card.innerHTML = `
      <div class="card-body p-3">
        <div class="row g-2 align-items-center mb-2">
          <div class="col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light fw-bold">特徵類別</span>
              <input type="text" class="form-control" value="${escapeHtml(feat.name)}"
                     onchange="updateFeatureName(${fIdx}, this.value)">
            </div>
          </div>
          <div class="col-md-8 text-end">
            <button class="btn btn-outline-danger btn-sm" onclick="removeFeature(${fIdx})">
              <i class="bi bi-trash"></i> 刪除此類別
            </button>
          </div>
        </div>
        <div>
          <label class="form-label small text-muted mb-1">
            可能值列表 (需為 ${state.entityCount} 個不重複值)：
          </label>
          <div class="d-flex flex-wrap gap-2">${valuesHtml}</div>
        </div>
      </div>`;

    fragment.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

/**
 * 更新特徵類別名稱
 * @param {number} fIdx
 * @param {string} name
 */
window.updateFeatureName = function (fIdx, name) {
  state.features[fIdx].name = name;
};

/**
 * 更新特徵值
 * @param {number} fIdx
 * @param {number} vIdx
 * @param {string} val
 */
window.updateFeatureValue = function (fIdx, vIdx, val) {
  state.features[fIdx].values[vIdx] = val;
};

/**
 * 取得所有特徵值的扁平陣列
 * @returns {string[]}
 */
function getAllValues() {
  return state.features.flatMap((f) => f.values);
}

// ==========================================
// 規則設定（含啟用勾選與批次操作）
// ==========================================

/**
 * 規則表單輸入欄位的渲染策略（Strategy Pattern）
 * 每個策略函式接收 (selectElem, context)，負責填充 <select> 的 <option>
 */
const RULE_INPUT_RENDER_STRATEGIES = {
  VALUE_SELECT(selectElem, { allValues }) {
    allValues.forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      selectElem.appendChild(opt);
    });
  },

  POS_SELECT(selectElem, { state }) {
    for (let i = 1; i <= state.entityCount; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `第 ${i} 個位置`;
      selectElem.appendChild(opt);
    }
  },

  DIR_SELECT(selectElem) {
    selectElem.innerHTML = `
      <option value="left">左側</option>
      <option value="right">右側</option>`;
  },

  NUM_SELECT(selectElem, { input }) {
    const { min = 1, max = 5, pattern, texts } = input;
    for (let i = min; i <= max; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      if (Array.isArray(texts) && texts[i - min] !== undefined) {
        opt.textContent = texts[i - min];
      } else if (pattern) {
        opt.textContent = pattern.replace("${i}", i);
      } else {
        opt.textContent = i;
      }
      selectElem.appendChild(opt);
    }
  },

  CUSTOM_SELECT(selectElem, { input, state, allValues }) {
    // 優先使用 input 中自訂的 render 函式
    if (typeof input.render === "function") {
      input.render(selectElem, { input, state, allValues });
      return;
    }
    // 支援靜態或動態 options 陣列
    const rawOptions = input.options || [];
    const items =
      typeof rawOptions === "function"
        ? rawOptions({ state, allValues })
        : rawOptions;

    items.forEach((item) => {
      const opt = document.createElement("option");
      if (typeof item === "object" && item !== null) {
        opt.value = item.value;
        opt.textContent = item.label ?? item.text ?? item.value;
        if (item.disabled) opt.disabled = true;
      } else {
        opt.value = item;
        opt.textContent = item;
      }
      selectElem.appendChild(opt);
    });
  },
};

/** 依據選擇的規則類型動態渲染輸入表單 */
window.renderRuleFormInputs = function () {
  const select = document.getElementById("rule-type-select");
  const container = document.getElementById("rule-inputs-container");
  const selectedType = select.value;

  container.innerHTML = "";

  if (!selectedType) {
    container.className =
      "mb-3 p-4 bg-light rounded border border-dashed text-center text-muted";
    container.innerHTML = `
      <i class="bi bi-sliders fs-2 mb-2 d-block opacity-50"></i>
      <p class="mb-0 small fw-bold">待設定輸入參數</p>
      <span class="small opacity-75">請從上方下拉選單選擇規則類型</span>`;
    return;
  }

  container.className = "mb-3 p-3 bg-light rounded border text-start";

  const meta = ruleEngine.getRuleMeta(selectedType);
  if (!meta?.inputs) return;

  const allValues = getAllValues();
  const VISIBLE_TYPES = new Set(["VALUE_SELECT", "POS_SELECT", "DIR_SELECT"]);

  meta.inputs.forEach((input) => {
    const fieldGroup = document.createElement("div");
    fieldGroup.className = "form-group mb-2";

    const label = document.createElement("label");
    label.textContent = `${input.label}:`;
    label.htmlFor = input.key;
    label.className = "form-label small fw-bold mb-1";
    fieldGroup.appendChild(label);

    const selectElem = document.createElement("select");
    selectElem.className = "form-select form-select-sm";
    selectElem.id = input.key;
    selectElem.name = input.key;
    selectElem.dataset.key = input.key;

    const renderFn = RULE_INPUT_RENDER_STRATEGIES[input.type];
    if (renderFn) {
      renderFn(selectElem, { allValues, state, input });
    } else {
      console.warn(`未知的輸入型態: ${input.type}`);
    }

    if (VISIBLE_TYPES.has(input.type)) {
      fieldGroup.appendChild(selectElem);
    }

    container.appendChild(fieldGroup);
  });
};

/** 處理「新增規則」點擊事件 */
window.handleAddRule = function () {
  const select = document.getElementById("rule-type-select");
  const type = select.value;
  if (!type) {
    alert("請先選擇規則類型");
    return;
  }

  const inputs = document
    .getElementById("rule-inputs-container")
    .querySelectorAll("[data-key]");
  const params = {};

  inputs.forEach((elem) => {
    const key = elem.dataset.key;
    const val = elem.value;
    // 數字型別轉換（排除 text 輸入）
    params[key] = !isNaN(val) && elem.type !== "text" ? Number(val) : val;
  });

  state.rules.push({
    id: `rule-${Date.now()}`,
    type,
    params,
    desc: ruleEngine.buildDescription(type, params),
    enabled: true,
  });

  renderRulesTable();
};

/** 渲染規則清單表格 */
function renderRulesTable() {
  const container = document.getElementById("rules-table-body");

  if (state.rules.length === 0) {
    container.innerHTML =
      "<tr><td></td><td></td><td>目前尚無任何規則，請於左方新增。</td><td></td></tr>";
    return;
  }

  const activeCount = state.rules.filter((r) => r.enabled).length;
  document.getElementById("rule-count-badge").innerText =
    `已啟用 ${activeCount} / 共 ${state.rules.length} 條`;

  const fragment = document.createDocumentFragment();

  state.rules.forEach((rule) => {
    const tr = document.createElement("tr");
    tr.className = rule.enabled ? "rule-item" : "rule-item rule-disabled";
    tr.innerHTML = `
      <td class="text-center">
        <input type="checkbox" class="form-check-input"
               ${rule.enabled ? "checked" : ""}
               onchange="toggleRuleEnabled(${rule.id}, this.checked)">
      </td>
      <td>
        <span class="badge ${rule.enabled ? "bg-outline-dark text-dark border" : "bg-secondary"}">
          ${escapeHtml(rule.type)}
        </span>
      </td>
      <td class="rule-text fw-bold">${escapeHtml(rule.desc)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-danger" onclick="removeRule(${rule.id})">
          <i class="bi bi-x-lg"></i>
        </button>
      </td>`;
    fragment.appendChild(tr);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

/**
 * 刪除指定規則
 * @param {string|number} ruleId
 */
window.removeRule = function (ruleId) {
  state.rules = state.rules.filter((r) => r.id !== ruleId);
  renderRulesTable();
};

/**
 * 切換規則啟用狀態
 * @param {string|number} id
 * @param {boolean} enabled
 */
window.toggleRuleEnabled = function (id, enabled) {
  const rule = findRule(id);
  if (rule) rule.enabled = enabled;
  renderRulesTable();
};

/**
 * 批次啟用或停用所有規則
 * @param {boolean} status
 */
window.toggleAllRules = function (status) {
  state.rules.forEach((r) => (r.enabled = status));
  renderRulesTable();
};

/** 刪除所有規則（需確認） */
window.removeAllRules = function () {
  if (confirm("確定要刪除全部限制條件嗎？")) {
    state.rules = [];
    renderRulesTable();
  }
};

// ==========================================
// 推理互動工作區
// ==========================================

/**
 * 更新整個解題工作區（計算 + 渲染）
 * @returns {{ finalFeasibleMap:FeasibleMap, remainingPosMap:FeasibleMap, ruleAnalysisResults:RuleAnalysisResult[] }}
 */
function updateSolveWorkspace() {
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

/** 🤖 自動逐步推理（數獨式推導） */
window.autoSolveStepByStep = function () {
  let totalSteps = 0;

  for (let loop = 0; loop < AUTO_SOLVE_MAX_LOOPS; loop++) {
    const { finalFeasibleMap, remainingPosMap, ruleAnalysisResults } =
      updateSolveWorkspace();
    let stepChanged = false;

    state.features.forEach((feat, fIdx) => {
      feat.values.forEach((val) => {
        const feasiblePositions = finalFeasibleMap[val] || [];
        if (feasiblePositions.length !== 1) return;

        const targetPos = feasiblePositions[0];
        if (state.userGrid[fIdx][targetPos].value === val) return;

        // 計算推理依據
        const recordRules = _buildAutoReasoningRules(
          val,
          remainingPosMap,
          ruleAnalysisResults,
        );

        // 清除舊的推理紀錄
        const oldItem = state.userGrid[fIdx][targetPos];
        if (oldItem?.reasoningId) {
          state.reasoningHistory = state.reasoningHistory.filter(
            (h) => h.id !== oldItem.reasoningId,
          );
        }

        const rid = state.nextReasoningId++;
        state.reasoningHistory.push({
          id: rid,
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
};

/**
 * 為自動推理建立推理依據規則列表（內部輔助函式）
 * @param {string} val
 * @param {FeasibleMap} remainingPosMap
 * @param {RuleAnalysisResult[]} ruleAnalysisResults
 * @returns {number[]}
 */
function _buildAutoReasoningRules(val, remainingPosMap, ruleAnalysisResults) {
  const S0 = remainingPosMap[val] || [];

  if (S0.length === 1) {
    return [{ id: "G1", desc: GENERAL_RULES.G1(val) }];
  }

  /** @type {number[]} */
  const recordRules = [];
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

/** 渲染解答區表格 */
function renderAnswerGrid() {
  const grid = document.getElementById("answer-grid");
  let html = `<thead><tr class="table-light"><th style="width:80px;">特徵類別</th>`;
  for (let p = 1; p <= state.entityCount; p++) {
    html += `<th class="text-center">位置 ${p}</th>`;
  }
  html += `</tr></thead><tbody>`;

  state.features.forEach((feat, fIdx) => {
    const usedValuesInFeature = new Set();
    for (let p = 1; p <= state.entityCount; p++) {
      const v = state.userGrid[fIdx][p]?.value;
      if (v) usedValuesInFeature.add(v);
    }

    html += `<tr><td class="fw-bold bg-light">${escapeHtml(feat.name)}</td>`;

    for (let p = 1; p <= state.entityCount; p++) {
      const selectedVal = state.userGrid[fIdx][p]?.value || "";
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
 * @param {number} fIdx
 * @param {number} pos
 * @param {string} value
 */
window.onUserSelectChange = function (fIdx, pos, value) {
  const oldItem = state.userGrid[fIdx][pos];
  if (oldItem?.reasoningId) {
    state.reasoningHistory = state.reasoningHistory.filter(
      (h) => h.id !== oldItem.reasoningId,
    );
  }

  if (value) {
    const rid = state.nextReasoningId++;
    state.reasoningHistory.push({
      id: rid,
      feature: state.features[fIdx].name,
      value,
      position: Number(pos),
      desc: `${value} 位於 第 ${pos} 個位置`,
      rules: [],
      isAuto: false,
    });
    state.userGrid[fIdx][pos] = { value, reasoningId: rid };
  } else {
    state.userGrid[fIdx][pos] = { value: "", reasoningId: null };
  }

  updateSolveWorkspace();
};

/** 重置所有使用者填答 */
window.resetUserChoices = function () {
  initUserGrid();
  updateSolveWorkspace();
};

/**
 * 計算每個特徵值的剩餘可能位置
 * @returns {FeasibleMap} remMap
 */
function computeRemainingPositions() {
  /** @type {FeasibleMap} */
  const remMap = {};
  const N = state.entityCount;

  state.features.forEach((feat, fIdx) => {
    /** @type {Record<FeatureValue, Position>} */
    const selectedValues = {};
    /** @type {Set<Position>} */
    const occupiedPositions = new Set();

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
 * 渲染雙列位置可行性表格
 * @param {string} tableId
 * @param {FeasibleMap} posMap
 * @param {"dynamic"|"static"} badgeType
 */
function renderTwoRowPositionGrid(tableId, posMap, badgeType) {
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

/**
 * 對所有已啟用規則執行推理分析
 * @param {FeasibleMap} remMap
 * @returns {RuleAnalysisResult[]}
 */
function computeRuleAnalysis(remMap) {
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
 * 取得推理歷史項目可用的規則列表
 * @param {ReasoningItem} item  推理歷史項目
 * @returns {RuleDescription[]}
 */
function getAvailableRulesForHistory(item) {
  const { value, position, isAuto } = item;

  const generalRules = isAuto
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

/** 渲染推理過程紀錄表格 */
function renderReasoningHistory() {
  const tbody = document.getElementById("reasoning-history-tbody");
  if (!tbody) return;

  if (state.reasoningHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">目前尚無推理過程紀錄。</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  state.reasoningHistory.forEach((item) => {
    const tr = document.createElement("tr");

    // 欄 1：編號
    const idTd = document.createElement("td");
    idTd.className = "text-center fw-bold text-secondary";
    idTd.textContent = item.id;
    tr.appendChild(idTd);

    // 欄 2：推理結果描述
    const descTd = document.createElement("td");
    descTd.className = "fw-bold text-dark";
    descTd.textContent = item.desc;
    tr.appendChild(descTd);

    // 欄 3：推理依據
    tr.appendChild(_buildRulesTd(item));

    // 欄 4：刪除按鈕
    const optTd = document.createElement("td");
    optTd.className = "text-center";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger py-0 px-2";
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = () => deleteHistoryItem(item.id);
    optTd.appendChild(deleteBtn);
    tr.appendChild(optTd);

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

/**
 * 建立推理依據欄的 DOM（內部輔助函式）
 * @param {ReasoningItem} item
 * @returns {HTMLTableCellElement}
 */
function _buildRulesTd(item) {
  const rulesTd = document.createElement("td");
  rulesTd.className = "p-1";

  const availableRules = getAvailableRulesForHistory(item);
  const innerTable = document.createElement("table");
  innerTable.className = "table table-sm table-borderless mb-0";
  const innerTbody = document.createElement("tbody");

  item.rules.forEach((r, rIdx) => {
    const innerTr = document.createElement("tr");
    const contentTd = document.createElement("td");

    if (item.isAuto) {
      // 自動推理：純文字顯示，不可編輯
      contentTd.innerHTML = `
        <span class="text-muted" style="font-size:0.85rem;">
          <i class="bi bi-info-circle me-1"></i>${escapeHtml(r.desc)}
        </span>`;
      innerTr.appendChild(contentTd);
    } else {
      // 使用者推理：下拉選單可編輯
      const select = document.createElement("select");
      select.className = "form-select form-select-sm p-1";
      select.style.cssText = "font-size:0.8rem;max-width:220px;";
      select.onchange = (e) =>
        onHistoryRuleChange(item.id, rIdx, e.target.value);

      availableRules.forEach((rule) => {
        const option = document.createElement("option");
        option.value = rule.id;
        option.textContent = rule.desc;
        if (String(rule.id) === String(r.id)) option.selected = true;
        select.appendChild(option);
      });

      // 若規則已被停用，補充顯示
      const isStillInList = availableRules.some(
        (rule) => String(rule.id) === String(r.id),
      );
      if (!isStillInList) {
        const option = document.createElement("option");
        option.value = r.id;
        option.textContent = `${r.desc} (已停用)`;
        option.selected = true;
        select.appendChild(option);
      }

      contentTd.appendChild(select);
      innerTr.appendChild(contentTd);

      // 刪除依據按鈕
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

  // 僅使用者推理可手動新增依據
  if (!item.isAuto) {
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
 * @param {number} itemId
 * @param {number} ruleIndex
 * @param {string} newRuleId
 */
window.onHistoryRuleChange = function (itemId, ruleIndex, newRuleId) {
  const item = findHistoryItem(itemId);
  if (!item || item.isAuto) return;

  // 通用規則 G1 / G2 / G3
  const generalRuleDesc = {
    G1: GENERAL_RULES.G1(item.value),
    G2: GENERAL_RULES.G2(item.value, item.position),
    G3: GENERAL_RULES.G3(item.value),
  };

  if (generalRuleDesc[newRuleId] !== undefined) {
    item.rules[ruleIndex] = { id: newRuleId, desc: generalRuleDesc[newRuleId] };
    updateSolveWorkspace();
    return;
  }

  const rule = findRule(newRuleId);
  if (rule) {
    item.rules[ruleIndex] = { id: rule.id, desc: rule.desc };
    updateSolveWorkspace();
  }
};

/**
 * 刪除推理歷史中某條依據規則
 * @param {number} itemId
 * @param {number} ruleIndex
 */
window.deleteHistoryRule = function (itemId, ruleIndex) {
  const item = findHistoryItem(itemId);
  if (!item || item.isAuto) return;
  item.rules.splice(ruleIndex, 1);
  updateSolveWorkspace();
};

/**
 * 在推理歷史項目中新增一條依據規則
 * @param {number} itemId
 */
window.addHistoryRule = function (itemId) {
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
};

/**
 * 刪除推理歷史項目，並清除對應的解答格
 * @param {number} itemId
 */
window.deleteHistoryItem = function (itemId) {
  if (!findHistoryItem(itemId)) return;

  state.reasoningHistory = state.reasoningHistory.filter(
    (h) => h.id !== itemId,
  );

  // 清除對應的解答格
  outer: for (const fIdx in state.userGrid) {
    for (const pos in state.userGrid[fIdx]) {
      if (state.userGrid[fIdx][pos]?.reasoningId === itemId) {
        state.userGrid[fIdx][pos] = { value: "", reasoningId: null };
        break outer;
      }
    }
  }

  updateSolveWorkspace();
};

/**
 * 整合所有規則分析結果，計算每個特徵值的最終可行位置
 * @param {FeasibleMap} remMap
 * @param {RuleAnalysisResult[]} analysisResults
 * @returns {FeasibleMap} resultMap
 */
function computeFinalFeasiblePositions(remMap, analysisResults) {
  // 以 Set 進行交集運算
  const finalMap = Object.fromEntries(
    Object.entries(remMap).map(([v, positions]) => [v, new Set(positions)]),
  );

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
      Array.from(set).sort((a, b) => a - b),
    ]),
  );
}

/**
 * 判斷某特徵值是否已填入解答格
 * @param {string} val
 * @returns {boolean}
 */
function isValueSelectedInAnswerGrid(val) {
  for (const fIdx in state.userGrid) {
    for (const pos in state.userGrid[fIdx]) {
      if (state.userGrid[fIdx][pos]?.value === val) return true;
    }
  }
  return false;
}

/**
 * 渲染規則分析表格（含三階段狀態排序）
 * - Stage 1 READY      - 已推出唯一解但尚未填入
 * - Stage 2 UNRESOLVED - 尚未推出唯一解
 * - Stage 3 COMPLETED  - 已推出唯一解且已填入
 * @param {RuleAnalysisResult[]} analysisResults
 * @param {FeasibleMap} finalFeasibleMap
 */
function renderRuleAnalysisTable(analysisResults, finalFeasibleMap) {
  const tbody = document.getElementById("rule-analysis-tbody");

  if (analysisResults.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">目前無啟用的限制條件規則。</td></tr>`;
    return;
  }

  /**
   * 判定規則所處的推理階段
   * @param {RuleAnalysisResult} res
   * @returns {1|2|3}
   */
  const getRuleStage = (res) => {
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

    // 模式子表格
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
// 啟動應用程式
// ==========================================
document.addEventListener("DOMContentLoaded", initApp);
