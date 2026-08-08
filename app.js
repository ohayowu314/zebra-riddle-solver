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
  reasoningHistory: [],
  nextReasoningId: 1,
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
      state.userGrid[fIdx][p] = { value: "", reasoningId: null };
    }
  });
  state.reasoningHistory = [];
  state.nextReasoningId = 1;
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

      // 兼容舊版: 匯入的規則加入 enabled 屬性，並將參數收入 params
      state.rules = importedData.rules.map(
        ({ id, type, params, desc, enabled, ...args }) => {
          const sourceParams = params ?? args;
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
        const importedGrid = importedData.userGrid;
        state.userGrid = {};
        state.features.forEach((_, fIdx) => {
          state.userGrid[fIdx] = {};
          for (let p = 1; p <= state.entityCount; p++) {
            const item = importedGrid?.[fIdx]?.[p];
            if (item) {
              if (typeof item === "object") {
                state.userGrid[fIdx][p] = {
                  value: item.value || "",
                  reasoningId: item.reasoningId || null,
                };
              } else {
                state.userGrid[fIdx][p] = { value: item, reasoningId: null };
              }
            } else {
              state.userGrid[fIdx][p] = { value: "", reasoningId: null };
            }
          }
        });
        state.reasoningHistory = importedData.reasoningHistory || [];
        state.nextReasoningId = importedData.nextReasoningId || 1;
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
    container.className =
      "mb-3 p-4 bg-light rounded border border-dashed text-center text-muted";
    container.innerHTML = `
      <i class="bi bi-sliders fs-2 mb-2 d-block opacity-50"></i>
      <p class="mb-0 small fw-bold">待設定輸入參數</p>
      <span class="small opacity-75">請從上方下拉選單選擇規則類型</span>
    `;
    return;
  }
  container.className = "mb-3 p-3 bg-light rounded border text-start";

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

    // 1. 定義每種型態的渲染策略
    const renderStrategies = {
      VALUE_SELECT: (inputElem, { allValues }) => {
        allValues.forEach((val) => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          inputElem.appendChild(opt);
        });
      },

      POS_SELECT: (inputElem, { state }) => {
        for (let i = 1; i <= state.entityCount; i++) {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = `第 ${i} 個位置`;
          inputElem.appendChild(opt);
        }
      },

      DIR_SELECT: (inputElem) => {
        inputElem.innerHTML = `
          <option value="left">左側</option>
          <option value="right">右側</option>
        `;
      },

      NUM_SELECT: (inputElem, { input }) => {
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

          inputElem.appendChild(opt);
        }
      },

      CUSTOM_SELECT: (inputElem, { input, state, allValues }) => {
        // 做法 1：如果 input 設定檔中帶有自訂的 render 函式，直接執行
        if (typeof input.render === "function") {
          input.render(inputElem, { input, state, allValues });
          return;
        }

        // 做法 2：支援傳入 options 陣列 [{ value: 'a', label: '選項 A' }, ...]
        const options = input.options || [];

        // 如果 options 是個函式，先執行取得陣列 (動態產生情境)
        const items =
          typeof options === "function"
            ? options({ state, allValues })
            : options;

        items.forEach((item) => {
          const opt = document.createElement("option");
          // 支援純字串/數字陣列，也支援物件結構
          if (typeof item === "object" && item !== null) {
            opt.value = item.value;
            opt.textContent = item.label ?? item.text ?? item.value;
            if (item.disabled) opt.disabled = true;
          } else {
            opt.value = item;
            opt.textContent = item;
          }
          inputElem.appendChild(opt);
        });
      },
    };

    // 2. 主程式呼叫：一行搞定，極好擴充
    const renderFn = renderStrategies[input.type];
    if (renderFn) {
      renderFn(inputElem, { allValues, state, input });
    } else {
      console.warn(`未知的輸入型態: ${input.type}`);
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
      "<tr><td></td><td></td><td>目前尚無任何規則，請於左方新增。</td><td></td></tr>";
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

// 🤖 數獨自動推理功能
window.autoSolveStepByStep = function () {
  let changedInLoop = false;
  let totalSteps = 0;
  const maxLoops = 50;

  for (let loop = 0; loop < maxLoops; loop++) {
    const { finalFeasibleMap, remainingPosMap, ruleAnalysisResults } =
      updateSolveWorkspace();
    let stepChanged = false;

    state.features.forEach((feat, fIdx) => {
      feat.values.forEach((val) => {
        const feasiblePositions = finalFeasibleMap[val] || [];
        if (feasiblePositions.length === 1) {
          const targetPos = feasiblePositions[0];
          if (state.userGrid[fIdx][targetPos].value !== val) {
            // 找到該特徵值在此之前的剩餘位置 S0
            const S0 = remainingPosMap[val] || [];

            // 計算推理依據 rules
            const recordRules = [];
            let currentS = new Set(S0);

            if (S0.length === 1) {
              recordRules.push({ id: "G1", desc: `${val} 僅剩一個位置` });
            } else {
              ruleAnalysisResults.forEach((res) => {
                const ruleFeasible = res.feasibleMap[val];
                if (!ruleFeasible) return;

                const ruleSet = new Set(ruleFeasible);
                const nextS = new Set(
                  [...currentS].filter((x) => ruleSet.has(x)),
                );
                if (nextS.size < currentS.size) {
                  recordRules.push({ id: res.ruleId, desc: res.ruleDesc });
                  currentS = nextS;
                }
              });
            }

            // 如果原本有舊的值，要先刪除舊的歷史紀錄
            const oldItem = state.userGrid[fIdx][targetPos];
            if (oldItem && oldItem.reasoningId) {
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

    html += `<tr><td class="fw-bold bg-light">${feat.name}</td>`;
    for (let p = 1; p <= state.entityCount; p++) {
      const selectedVal = state.userGrid[fIdx][p]?.value || "";

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
  const oldItem = state.userGrid[fIdx][pos];
  if (oldItem && oldItem.reasoningId) {
    state.reasoningHistory = state.reasoningHistory.filter(
      (h) => h.id !== oldItem.reasoningId,
    );
  }

  if (value) {
    const rid = state.nextReasoningId++;
    state.reasoningHistory.push({
      id: rid,
      feature: state.features[fIdx].name,
      value: value,
      position: Number(pos),
      desc: `${value} 位於 第 ${pos} 個位置`,
      rules: [],
      isAuto: false,
    });
    state.userGrid[fIdx][pos] = { value: value, reasoningId: rid };
  } else {
    state.userGrid[fIdx][pos] = { value: "", reasoningId: null };
  }
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
      const val = state.userGrid[fIdx][p]?.value;
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
  if (!table) return;
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
        ruleId: rule.id,
        ruleDesc: rule.desc,
        patterns: patterns,
        involvedValues: involvedValues,
        feasibleMap: finalFeasibleMap,
      };
    });
}

// 取得供推理依據選擇的規則列表
function getAvailableRulesForHistory(item) {
  const { value, position, isAuto } = item;
  const posStr = position ?? "i";

  if (isAuto === true) {
    // 自動推理：限縮於與特徵值相關的規則以及通用規則 G1
    const generalRules = [{ id: "G1", desc: `${value} 僅剩一個位置` }];
    const dbRules = state.rules.filter((rule) => {
      if (!rule.enabled) return false;
      const involved = ruleEngine.getInvolvedValues(rule.type, rule.params);
      return involved.includes(value);
    });
    return [...generalRules, ...dbRules];
  } else {
    // 使用者自行推理：所有已啟用的規則與通用規則 G1, G2, G3
    const generalRules = [
      { id: "G1", desc: `${value} 僅剩一個位置` },
      { id: "G2", desc: `第 ${posStr} 個位置僅能填入 ${value}` },
      { id: "G3", desc: `數獨規則 ${value} 刪去部分可能位置` },
    ];
    const dbRules = state.rules.filter((rule) => rule.enabled);
    return [...generalRules, ...dbRules];
  }
}

// 渲染推理過程紀錄區
function renderReasoningHistory() {
  const tbody = document.getElementById("reasoning-history-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (state.reasoningHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-3">目前尚無推理過程紀錄。</td></tr>`;
    return;
  }

  state.reasoningHistory.forEach((item) => {
    const tr = document.createElement("tr");

    // 1. 編號
    const idTd = document.createElement("td");
    idTd.className = "text-center fw-bold text-secondary";
    idTd.textContent = item.id;
    tr.appendChild(idTd);

    // 2. 推理結果簡要描述
    const descTd = document.createElement("td");
    descTd.className = "fw-bold text-dark";
    descTd.textContent = item.desc;
    tr.appendChild(descTd);

    // 3. 推理依據規則描述 (小表格形式)
    const rulesTd = document.createElement("td");
    rulesTd.className = "p-1";

    const availableRules = getAvailableRulesForHistory(item);

    const innerTable = document.createElement("table");
    innerTable.className = "table table-sm table-borderless mb-0";
    const innerTbody = document.createElement("tbody");

    item.rules.forEach((r, rIdx) => {
      const innerTr = document.createElement("tr");

      const contentTd = document.createElement("td");
      if (item.isAuto === true) {
        // 自動推理：直接以純文字顯示，不提供編輯
        contentTd.innerHTML = `<span class="text-muted" style="font-size: 0.85rem;"><i class="bi bi-info-circle me-1"></i>${r.desc}</span>`;
        innerTr.appendChild(contentTd);
      } else {
        // 使用者自行推理：顯示下拉選單以進行編輯
        const select = document.createElement("select");
        select.className = "form-select form-select-sm p-1";
        select.style.fontSize = "0.8rem";
        select.style.maxWidth = "220px";
        select.onchange = (e) =>
          onHistoryRuleChange(item.id, rIdx, e.target.value);

        availableRules.forEach((rule) => {
          const option = document.createElement("option");
          option.value = rule.id;
          option.textContent = rule.desc;
          if (String(rule.id) === String(r.id)) {
            option.selected = true;
          }
          select.appendChild(option);
        });

        const isStillInList = availableRules.some(
          (rule) => String(rule.id) === String(r.id),
        );
        if (!isStillInList) {
          const option = document.createElement("option");
          option.value = r.id;
          option.textContent = r.desc + " (已停用)";
          option.selected = true;
          select.appendChild(option);
        }

        contentTd.appendChild(select);
        innerTr.appendChild(contentTd);

        // 刪除規則按鈕
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

    // 只有非自動推理（使用者自行推理）才可以手動新增依據
    if (item.isAuto !== true) {
      const addRuleBtn = document.createElement("button");
      addRuleBtn.className =
        "btn btn-sm btn-outline-primary py-0 px-1 mt-1 d-block";
      addRuleBtn.style.fontSize = "0.75rem";
      addRuleBtn.innerHTML = '<i class="bi bi-plus-circle me-1"></i>新增依據';
      addRuleBtn.onclick = () => addHistoryRule(item.id);
      rulesTd.appendChild(addRuleBtn);
    }

    tr.appendChild(rulesTd);

    // 4. 操作
    const optTd = document.createElement("td");
    optTd.className = "text-center";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger py-0 px-2";
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = () => deleteHistoryItem(item.id);
    optTd.appendChild(deleteBtn);
    tr.appendChild(optTd);

    tbody.appendChild(tr);
  });
}

window.onHistoryRuleChange = function (itemId, ruleIndex, newRuleId) {
  const item = state.reasoningHistory.find((h) => h.id === itemId);
  if (!item || item.isAuto === true) return;

  if (newRuleId === "G1" || newRuleId === "G2" || newRuleId === "G3") {
    let desc = "";
    if (newRuleId === "G1") desc = `${item.value} 僅剩一個位置`;
    else if (newRuleId === "G2")
      desc = `第 ${item.position || "i"} 個位置僅能填入 ${item.value}`;
    else if (newRuleId === "G3")
      desc = `數獨規則 ${item.value} 刪去部分可能位置`;

    item.rules[ruleIndex] = { id: newRuleId, desc: desc };
    updateSolveWorkspace();
    return;
  }

  const rule = state.rules.find((r) => String(r.id) === String(newRuleId));
  if (rule) {
    item.rules[ruleIndex] = { id: rule.id, desc: rule.desc };
    updateSolveWorkspace();
  }
};

window.deleteHistoryRule = function (itemId, ruleIndex) {
  const item = state.reasoningHistory.find((h) => h.id === itemId);
  if (!item || item.isAuto === true) return;

  item.rules.splice(ruleIndex, 1);
  updateSolveWorkspace();
};

window.addHistoryRule = function (itemId) {
  const item = state.reasoningHistory.find((h) => h.id === itemId);
  if (!item || item.isAuto === true) return;

  const availableRules = getAvailableRulesForHistory(item);
  if (availableRules.length === 0) {
    alert("沒有可用的限制規則。");
    return;
  }

  const firstRule = availableRules[0];
  item.rules.push({ id: firstRule.id, desc: firstRule.desc });
  updateSolveWorkspace();
};

window.deleteHistoryItem = function (itemId) {
  const item = state.reasoningHistory.find((h) => h.id === itemId);
  if (!item) return;

  state.reasoningHistory = state.reasoningHistory.filter(
    (h) => h.id !== itemId,
  );

  let found = false;
  for (const fIdx in state.userGrid) {
    for (const pos in state.userGrid[fIdx]) {
      if (state.userGrid[fIdx][pos]?.reasoningId === itemId) {
        state.userGrid[fIdx][pos] = { value: "", reasoningId: null };
        found = true;
        break;
      }
    }
    if (found) break;
  }

  updateSolveWorkspace();
};

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
      if (state.userGrid[fIdx][pos]?.value === val) return true;
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
      const keys = p.keys || Object.keys(p.feasMap);
      keys.forEach((v) => {
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
