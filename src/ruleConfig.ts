// ruleConfig.ts — 規則設定（新增、刪除、啟用、渲染）

import { ruleEngine } from "./ruleEngine.js";
import { state, escapeHtml, findRule, getAllValues } from "./state.js";
import type {
  RuleId,
  RuleInputRenderFn,
  RenderStrategyContext,
  RenderStrategyInput,
} from "./types.js";

// ==========================================
// 規則輸入欄位渲染策略（Strategy Pattern）
// ==========================================

/**
 * 各輸入類型對應的渲染函式
 * 每個函式接收 (selectElem, context)，負責填充 <select> 的 <option>
 */
export const RULE_INPUT_RENDER_STRATEGIES: Record<string, RuleInputRenderFn> =
  {
    VALUE_SELECT(selectElem, { allValues }) {
      allValues.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = String(val);
        opt.textContent = String(val);
        selectElem.appendChild(opt);
      });
    },

    POS_SELECT(selectElem, { state }) {
      for (let i = 1; i <= state.entityCount; i++) {
        const opt = document.createElement("option");
        opt.value = `${i}`;
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
      const { min = 1, max = 5, pattern, texts } = input as RenderStrategyInput;
      for (let i = min; i <= max; i++) {
        const opt = document.createElement("option");
        opt.value = `${i}`;
        if (Array.isArray(texts) && texts[i - min] !== undefined) {
          opt.textContent = texts[i - min];
        } else if (pattern) {
          opt.textContent = pattern.replace("${i}", `${i}`);
        } else {
          opt.textContent = `${i}`;
        }
        selectElem.appendChild(opt);
      }
    },

    CUSTOM_SELECT(
      selectElem,
      context: RenderStrategyContext,
    ) {
      const { input, state: ctxState, allValues } = context;
      const inp = input as RenderStrategyInput;

      if (typeof inp.render === "function") {
        inp.render(selectElem, context);
        return;
      }

      const rawOptions = inp.options ?? [];
      const items =
        typeof rawOptions === "function"
          ? rawOptions({ state: ctxState, allValues })
          : rawOptions;

      items.forEach((item) => {
        const opt = document.createElement("option");
        if (typeof item === "object" && item !== null) {
          opt.value = String(item.value);
          opt.textContent = String(item.label ?? item.text ?? item.value);
          if (item.disabled) opt.disabled = true;
        } else {
          opt.value = String(item);
          opt.textContent = String(item);
        }
        selectElem.appendChild(opt);
      });
    },
  };

// ==========================================
// 規則表單
// ==========================================

/** 填入「規則類型」下拉選單 */
export function populateRuleTypeSelect(): void {
  const select = document.getElementById(
    "rule-type-select",
  ) as HTMLSelectElement;
  select.innerHTML = '<option value="">-- 請選擇規則類型 --</option>';

  ruleEngine.getRegisteredRules().forEach((meta: { type: string; name: string }) => {
    const option = document.createElement("option");
    option.value = meta.type;
    option.textContent = meta.name;
    select.appendChild(option);
  });
}

/** 依據選擇的規則類型動態渲染輸入表單 */
export function renderRuleFormInputs(): void {
  const select = document.getElementById(
    "rule-type-select",
  ) as HTMLSelectElement;
  const container = document.getElementById(
    "rule-inputs-container",
  ) as HTMLElement;
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

  const meta = ruleEngine.getRuleMeta(selectedType) as {
    inputs?: Array<RenderStrategyInput>;
  } | undefined;
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
    selectElem.dataset["key"] = input.key;

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
}

/** 處理「新增規則」點擊事件 */
export function handleAddRule(): void {
  const select = document.getElementById(
    "rule-type-select",
  ) as HTMLSelectElement;
  const type = select.value;
  if (!type) {
    alert("請先選擇規則類型");
    return;
  }

  const inputs = document
    .getElementById("rule-inputs-container")!
    .querySelectorAll<HTMLSelectElement | HTMLInputElement>("[data-key]");

  const params: Record<string, string | number> = {};
  inputs.forEach((elem) => {
    const key = elem.dataset["key"]!;
    const val = elem.value;
    params[key] =
      !isNaN(Number(val)) && (elem as HTMLInputElement).type !== "text"
        ? Number(val)
        : val;
  });

  state.rules.push({
    id: `rule-${Date.now()}`,
    type,
    params,
    desc: ruleEngine.buildDescription(type, params),
    enabled: true,
  });

  renderRulesTable();
}

// ==========================================
// 規則清單渲染
// ==========================================

/** 渲染規則清單表格 */
export function renderRulesTable(): void {
  const container = document.getElementById(
    "rules-table-body",
  ) as HTMLElement;

  if (state.rules.length === 0) {
    container.innerHTML =
      "<tr><td></td><td></td><td>目前尚無任何規則，請於左方新增。</td><td></td></tr>";
    return;
  }

  const activeCount = state.rules.filter((r) => r.enabled).length;
  (document.getElementById("rule-count-badge") as HTMLElement).innerText =
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

// ==========================================
// 規則 CRUD 與批次操作
// ==========================================

/**
 * 刪除指定規則
 */
export function removeRule(ruleId: RuleId): void {
  state.rules = state.rules.filter((r) => r.id !== ruleId);
  renderRulesTable();
}

/**
 * 切換規則啟用狀態
 */
export function toggleRuleEnabled(id: RuleId, enabled: boolean): void {
  const rule = findRule(id);
  if (rule) rule.enabled = enabled;
  renderRulesTable();
}

/**
 * 批次啟用或停用所有規則
 */
export function toggleAllRules(status: boolean): void {
  state.rules.forEach((r) => (r.enabled = status));
  renderRulesTable();
}

/** 刪除所有規則（需確認） */
export function removeAllRules(): void {
  if (confirm("確定要刪除全部限制條件嗎？")) {
    state.rules = [];
    renderRulesTable();
  }
}
