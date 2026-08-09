# 在純 HTML / JS 專案中輕鬆使用 TypeScript：從零配置到自動化開發流程

## TL;DR (快速通關)

如果在簡單的原生 HTML 專案中不想使用 Vite、Webpack 等複雜打包工具，只需要透過原生的 `tsc` 與 ES Modules (ESM) 即可實現 TypeScript 開發：

### 1. 安裝 TypeScript

```sh
# 全域安裝
npm install -g typescript

# 建議採用專案區域安裝 (Local)
npm install --save-dev typescript
```

### 2. 配置 `tsconfig.json`

執行 `npx tsc --init` 後，調整 key 設定（建議使用 Node16+ 的模組解析策略）：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16", // `node16`, `node18`, `node20`, `nodenext`
    "moduleResolution": "Node16", // `node16`, `nodenext`
    "rootDir": "./src",
    "outDir": "./dist",
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### 3. 配置 `package.json`

確保專案聲明為 ES Module：

```json
{
  "type": "module"
}
```

### 4. 撰寫 TS 代碼 (關鍵：引入路徑)

在 ES Module 規範下，**TS 檔內的 `import` 必須明確寫出擴充號為 `.js`**：

```typescript
// src/index.ts
import { Chicken } from "./chicken.js"; // 注意：這裡必須寫 .js，即使原始檔案是 chicken.ts

const chicken = new Chicken();
chicken.croak();
```

### 5. 編譯與 HTML 引入

執行編譯：

```sh
npx tsc
```

在 HTML 中使用 `<script type="module">` 引入編譯後的 JavaScript：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>TS in HTML Example</title>
</head>
<body>
  <script type="module" src="dist/index.js"></script>
</body>
</html>
```

---

## 自動化開發流程：告別手動 `tsc`

開發過程中每次修改 `.ts` 都重新執行 `tsc` 是極度低效的。我們可以使用 VS Code 內建的 Task 機制實現存檔即編譯。

### 步驟一：開啟 Watch 模式

使用 `--watch`, `-w` (簡寫) 選項讓 TypeScript 監聽檔案變更：

```sh
npx tsc -w
```

### 步驟二：配置 VS Code 自動任務 (Tasks)

透過 VS Code 任務自動在背景執行編譯：

1. 按下 `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`) 開啟命令選擇區。
2. 輸入並選擇 `Tasks: Configure Default Build Task`。
3. 選擇 `tsc: watch - tsconfig.json`。
4. VS Code 會自動建立 `.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "typescript",
      "tsconfig": "tsconfig.json",
      "option": "watch",
      "problemMatcher": ["$tsc-watch"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "label": "tsc: watch - tsconfig.json"
    }
  ]
}
```

> **提示**：只有當專案本地（`node_modules`）安裝了 `typescript` 時，VS Code 才能自動偵測並生成 `tsc: watch` 任務。

#### 預設任務 (`isDefault`) 的差異

* **`isDefault: false`**：每次觸發需按 `Ctrl + Shift + P` -> 選 `Run Task` -> 找到任務並點擊。
* **`isDefault: true`**：只需按下快捷鍵 **`Ctrl + Shift + B`** (Mac: `Cmd + Shift + B`)，即可瞬間啟動 watch 監聽。

### 步驟三：開啟專案時自動啟動 Watch

讓 VS Code 在開啟專案時，自動於背景背景啟動 TS 編譯：

1. 在 `tasks.json` 的任務物件中加入 `"runOptions"`：
```json
{
  "type": "typescript",
  "tsconfig": "tsconfig.json",
  "option": "watch",
  "problemMatcher": ["$tsc-watch"],
  // ...
  "label": "tsc: watch - tsconfig.json",
  "runOptions": {
    "runOn": "folderOpen"
  }
}
```


2. 按下 `Ctrl + ,` 打開 VS Code 設定，搜尋 **`Tasks: Allow Automatic Tasks`**，並將其設定為 `on`（允許自動執行任務）。

---

## 偵錯設定 (Debugging)

要實現直接在 VS Code 設定斷點（Breakpoint）並除錯，需要配合 Source Map 與 `launch.json` 設定。

### 1. 網頁前端偵錯 (Chrome / Edge)

如果你的代碼是在瀏覽器執行，推薦使用 VS Code 的 JavaScript Debugger 直接啟動瀏覽器：

在 `.vscode/launch.json` 新增：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "file": "${workspaceFolder}/index.html",
      "preLaunchTask": "tsc: watch - tsconfig.json"
    }
  ]
}
```

* `"file"`：指定你的 HTML 入口。
* `"preLaunchTask"`：啟動除錯前自動觸發 TS 監聽編譯。
* 由於 `tsconfig.json` 開啟了 `"sourceMap": true`，你在 `.ts` 檔案中下的斷點會精準對應到瀏覽器執行的 JS 上。

### 2. Node.js 環境除錯 (若無 HTML 頁面)

如果是單純使用 Node.js 測試腳本：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug TS in Node",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "tsc: watch - tsconfig.json"
    }
  ]
}
```

---

## 觀念深度解析與常見坑點

### 為什麼 `.ts` 裡的 `import` 必須寫 `.js`？

這是在純 ESM 環境下最常遇到的坑。

1. **瀏覽器原生 ESM 機制**：現代瀏覽器支援原生 `import/export`，但瀏覽器發送網路請求時**不會**自動補全檔名（例如把 `./chicken` 補成 `./chicken.js`）。因此，產出的 JS 代碼必須明確帶有 `.js` 副檔名。
2. **TypeScript 堅持不修改導入路徑**：TypeScript 的設計哲學是「編譯後不改變你的路徑字串」。當你在 `tsconfig.json` 設定 `"moduleResolution": "Node16"` 時，TypeScript 會強制要求你在寫 TS 時就補上 `.js` 檔名，以確保編譯後的 JavaScript 能直接在瀏覽器或 Node.js ESM 環境中無縫運行。

### 核心運作邏輯解析

當我們配置以下設定時：

* `package.json`: `"type": "module"`
* `tsconfig.json`: `"module": "Node16"`

TypeScript 編譯器會將你的程式碼轉換為標準 ESM 格式，而非舊式的 CommonJS (`require`)：

**原始 TS (`src/chicken.ts`)**

```typescript
export class Chicken {
  cluck() {
    console.log("Cluck!!!!");
  }
}
```

**原始 TS (`src/index.ts`)**

```typescript
import { Chicken } from "./chicken.js";
const chicken = new Chicken();
chicken.cluck();
```

**編譯後的 JS (`dist/index.js`)**

```javascript
import { Chicken } from "./chicken.js";
const chicken = new Chicken();
chicken.cluck();
```

瀏覽器透過 `<script type="module" src="dist/index.js"></script>` 載入時，就能以原生 ES Module 機制依次載入 `dist/index.js` 與 `dist/chicken.js`，完全不需要 Webpack 或 Vite 等 Bundler！

> 如果你的 tsconfig.json 使用 `module: "commonjs"` ，編譯後會出現
> ```
> Object.defineProperty(exports, "__esModule", { value: true });
> exports.test = void 0;
> ```
> 這在瀏覽器執行會出錯 `ReferenceError: exports is not defined`


---

## 進階建議：實現真正的全自動體驗 (Live Reload)

目前我們實現了「修改 TS 檔 $\rightarrow$ 自動編譯成 JS 檔」。但要看到網頁變化，還是需要手動刷新瀏覽器。

**極簡解決方案：VS Code Live Server 套件**

1. 在 VS Code 安裝擴充套件：**Live Server** (by Ritwick Dey)。
2. 在 `index.html` 上點擊右鍵 $\rightarrow$ 選擇 **Open with Live Server**。

現在你的開發流程變成了：
**修改 `.ts` 存檔 $\rightarrow$ `tsc -w` 自動生成 `.js` $\rightarrow$ Live Server 偵測到 `.js`/`.html` 變更 $\rightarrow$ 瀏覽器自動刷新**。

完全無需複雜的 Node.js 工具鏈，即可享受現代化的開發體驗！