// jest.config.js

const nextJest = require("next/jest");

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // 提供 Next.js app 的路徑，以便在測試環境中載入 next.config.js 和 .env 檔案
  dir: "./",
});

// 加入任何你想傳遞給 Jest 的自訂設定
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom", // <-- 正確設定了 jsdom 環境
  // 在每次測試執行前，加入更多設定選項
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

// createJestConfig 會確保 next/jest 能載入 Next.js 的非同步設定
// 這就是 next/jest 提供的「魔法」，它在背後處理了所有 TypeScript 和 Babel 的轉換（翻譯）工作
module.exports = createJestConfig(config);
