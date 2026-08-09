// featureConfig.ts — 個體數量與特徵類別設定

import { state, initUserGrid, escapeHtml } from "./state.js";
import { ENTITY_COUNT_MIN, ENTITY_COUNT_MAX } from "./constants.js";

// ==========================================
// 個體數量
// ==========================================

/**
 * 調整個體數量
 * @param delta  +1 或 -1
 */
export function changeEntityCount(delta: number): void {
  const newCount = state.entityCount + delta;
  if (newCount < ENTITY_COUNT_MIN || newCount > ENTITY_COUNT_MAX) return;

  state.entityCount = newCount;
  (document.getElementById("entity-count") as HTMLInputElement).value =
    String(newCount);

  state.features.forEach((f) => {
    while (f.values.length < newCount)
      f.values.push(`${f.name}_${f.values.length + 1}`);
    while (f.values.length > newCount) f.values.pop();
  });

  initUserGrid();
  renderFeatureConfig();
}

// ==========================================
// 特徵類別 CRUD
// ==========================================

/** 新增特徵類別 */
export function addFeature(): void {
  const fName = `特徵${state.features.length + 1}`;
  const values = Array.from(
    { length: state.entityCount },
    (_, i) => `${fName}_值${i + 1}`,
  );
  state.features.push({ name: fName, values });
  initUserGrid();
  renderFeatureConfig();
}

/**
 * 刪除特徵類別
 */
export function removeFeature(fIdx: number): void {
  if (state.features.length <= 1) {
    alert("至少需要保留一個特徵類別！");
    return;
  }
  state.features.splice(fIdx, 1);
  initUserGrid();
  renderFeatureConfig();
}

/**
 * 更新特徵類別名稱
 */
export function updateFeatureName(fIdx: number, name: string): void {
  state.features[fIdx].name = name;
}

/**
 * 更新特徵值
 */
export function updateFeatureValue(
  fIdx: number,
  vIdx: number,
  val: string,
): void {
  state.features[fIdx].values[vIdx] = val;
}

// ==========================================
// 渲染
// ==========================================

/** 渲染特徵設定面板 */
export function renderFeatureConfig(): void {
  const container = document.getElementById(
    "feature-list-container",
  ) as HTMLElement;
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
