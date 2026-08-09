// app.ts — 應用程式主入口

import { ruleEngine } from "./ruleEngine.js";
import { initUserGrid } from "./state.js";
import {
  exportData,
  triggerImport,
  handleFileImport,
} from "./importExport.js";
import {
  changeEntityCount,
  addFeature,
  removeFeature,
  updateFeatureName,
  updateFeatureValue,
  renderFeatureConfig,
} from "./featureConfig.js";
import {
  populateRuleTypeSelect,
  renderRuleFormInputs,
  handleAddRule,
  renderRulesTable,
  removeRule,
  toggleRuleEnabled,
  toggleAllRules,
  removeAllRules,
} from "./ruleConfig.js";
import {
  updateSolveWorkspace,
  autoSolveStepByStep,
  onUserSelectChange,
  resetUserChoices,
  onHistoryRuleChange,
  deleteHistoryRule,
  addHistoryRule,
  deleteHistoryItem,
} from "./solveWorkspace.js";

// ==========================================
// 掛載全域函式（供 HTML inline 事件使用）
// ==========================================

declare global {
  interface Window {
    exportData: typeof exportData;
    triggerImport: typeof triggerImport;
    handleFileImport: typeof handleFileImport;
    changeEntityCount: typeof changeEntityCount;
    addFeature: typeof addFeature;
    removeFeature: typeof removeFeature;
    updateFeatureName: typeof updateFeatureName;
    updateFeatureValue: typeof updateFeatureValue;
    renderRuleFormInputs: typeof renderRuleFormInputs;
    handleAddRule: typeof handleAddRule;
    removeRule: typeof removeRule;
    toggleRuleEnabled: typeof toggleRuleEnabled;
    toggleAllRules: typeof toggleAllRules;
    removeAllRules: typeof removeAllRules;
    autoSolveStepByStep: typeof autoSolveStepByStep;
    onUserSelectChange: typeof onUserSelectChange;
    resetUserChoices: typeof resetUserChoices;
    onHistoryRuleChange: typeof onHistoryRuleChange;
    deleteHistoryRule: typeof deleteHistoryRule;
    addHistoryRule: typeof addHistoryRule;
    deleteHistoryItem: typeof deleteHistoryItem;
  }
}

window.exportData = exportData;
window.triggerImport = triggerImport;
window.handleFileImport = handleFileImport;
window.changeEntityCount = changeEntityCount;
window.addFeature = addFeature;
window.removeFeature = removeFeature;
window.updateFeatureName = updateFeatureName;
window.updateFeatureValue = updateFeatureValue;
window.renderRuleFormInputs = renderRuleFormInputs;
window.handleAddRule = handleAddRule;
window.removeRule = removeRule;
window.toggleRuleEnabled = toggleRuleEnabled;
window.toggleAllRules = toggleAllRules;
window.removeAllRules = removeAllRules;
window.autoSolveStepByStep = autoSolveStepByStep;
window.onUserSelectChange = onUserSelectChange;
window.resetUserChoices = resetUserChoices;
window.onHistoryRuleChange = onHistoryRuleChange;
window.deleteHistoryRule = deleteHistoryRule;
window.addHistoryRule = addHistoryRule;
window.deleteHistoryItem = deleteHistoryItem;

// ==========================================
// 初始化
// ==========================================

/** 初始化頁面 */
async function initApp(): Promise<void> {
  await ruleEngine.init();
  populateRuleTypeSelect();
  initUserGrid();
  renderFeatureConfig();
  renderRulesTable();
  renderRuleFormInputs();

  document.getElementById("solve-tab")?.addEventListener("shown.bs.tab", () => {
    updateSolveWorkspace();
  });
}

document.addEventListener("DOMContentLoaded", initApp);
