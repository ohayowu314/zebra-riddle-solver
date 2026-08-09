import { FeasibleMap, RuleParams, RuleModule } from "./types.js";

// ruleEngine.ts
class RuleEngine {
    readonly modules: Map<string, RuleModule>;
    constructor() {
        this.modules = new Map(); // 存放 { ruleType: { meta, instance } }
    }

    /**
     * 初始化：讀取 manifest.json 並動態載入所有規則模組
     */
    async init() {
        try {
            const manifestRes = await fetch("./src/rules/manifest.json");
            const manifest = await manifestRes.json();

            for (const ruleDir of manifest.rules) {
                try {
                    const metaRes = await fetch(`./src/rules/${ruleDir}/meta.json`);
                    const meta = await metaRes.json();

                    // 動態匯入 ES Module
                    const moduleInstance = await import(`./rules/${ruleDir}/index.js`);

                    this.modules.set(meta.type, {
                        meta: meta,
                        instance: moduleInstance.default,
                    });
                    console.log(`模組 ${meta.type} 成功載入`);
                } catch (ruleError) {
                    console.error(`模組 ${ruleDir} 加載失敗:`, ruleError);
                }
            }
            console.log(
                "規則引擎初始化完成，已載入模組:",
                Array.from(this.modules.keys()),
            );
        } catch (err) {
            console.error("規則引擎初始化失敗:", err);
        }
    }

    /**
     * 取得所有已載入規則的 Metadata (供 UI 產生下拉選單)
     */
    getRegisteredRules() {
        return Array.from(this.modules.values()).map((m) => m.meta);
    }

    /**
     * 取得特定規則類型的 Metadata
     */
    getRuleMeta(type: string) {
        return this.modules.get(type)?.meta || null;
    }

    /**
     * 透過 params 與模組執行 buildDescription
     */
    buildDescription(type: string, params: RuleParams) {
        const mod = this.modules.get(type);
        if (!mod) return `未知規則類型 (${type})`;
        return mod.instance.buildDescription(params);
    }

    /**
     * 透過 params 與模組執行 getInvolvedValues
     */
    getInvolvedValues(type: string, params: RuleParams) {
        const mod = this.modules.get(type);
        if (!mod) return [];
        return mod.instance.getInvolvedValues(params);
    }

    /**
     * 呼叫模組計算 Patterns
     */
    getPatterns(type: string, params: RuleParams, remMap: FeasibleMap, N: number) {
        const mod = this.modules.get(type);
        if (!mod) return [];
        return mod.instance.getPatterns(params, remMap, N);
    }

    /**
     * 呼叫模組計算可行位置
     */
    calculateFeasiblePositions(type: string, params: RuleParams, remMap: FeasibleMap, N: number) {
        const mod = this.modules.get(type);
        if (!mod) return {};
        return mod.instance.calculateFeasiblePositions(params, remMap, N);
    }
}

export const ruleEngine = new RuleEngine();
