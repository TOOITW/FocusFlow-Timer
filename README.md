# FocusFlow Timer — 規格驅動（SDD）x AI 協作

> 本專案以 **SDD（Spec-Driven Development）** 為核心：`SPEC.md` 是單一真相（SSOT）。  
> 所有程式與測試必須對齊規格的 FR/AC（Functional Requirements / Acceptance Criteria）。

## ✨ 核心原則

-   **SPEC.md 是唯一真相 (SSOT)**：所有開發工作都必須以 `SPEC.md` 中定義的規格與驗收條件 (Acceptance Criteria) 為準。
-   **邏輯與畫面分離**:
    -   **`src/hooks`**: 存放所有核心商業邏輯與狀態管理，使其可獨立測試與重用。
    -   **`src/components`**: 僅負責 UI 渲染與使用者事件的傳遞，不包含複雜的商業邏輯。
-   **先求生存，再求發展**: 優先實現能驗證市場的核心功能 (MVP)，延遲導入過重的工程流程 (如完整 CI/CD, Docs-as-Code)。

## Tech Stack
- Next.js (App Router) + TypeScript + Tailwind
- 核心邏輯：純 TypeScript（可測試、可共用）
- 測試：Jest / Vitest（二選一）
- CI：GitHub Actions（lint / test / 規格檢查）

## Project Structure

### 結構原則
- **/SPEC.md**：產品規格（Problem/Goals/FR/NFR/AC）。PR 需勾選覆蓋哪些 AC。
- **核心邏輯與 UI 分離**：`packages/core`（或 `src/core`）不依賴 React/Next，易於測試與複用。
- **/.github**：Issue/PR 模板與 CI，確保規格與程式一致。
- **/docs**：ADR、Runbooks、延伸文件。**規格定稿仍以根目錄 `SPEC.md` 為準**。

## SDD Workflow
1. 修改或新增 `SPEC.md`（包含驗收條件 Given/When/Then）。
2. 建 Issue（套用模板，貼上 User Story 與 AC）。
3. 先實作 **core**（純 TS）+ 單元測試，通過後再做 UI。
4. 開 PR（勾選覆蓋 AC），CI 必須通過（lint/test/spec）。
5. 合併後發版（可用 semantic-release 自動產生 CHANGELOG）。
6. **核心邏輯在 `src/core`（或 `packages/core`），UI 只調用 hook**。  

## Scripts（apps/web）
```bash
npm run dev
npm run test
npm run lint
