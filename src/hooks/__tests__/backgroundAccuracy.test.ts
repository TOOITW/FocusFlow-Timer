import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "@/hooks/usePomodoro";

// 可控時鐘：以工廠 mock 取代 spyOn（避免 ESM namespace 屬性不可重定義）
let __now: () => number = () => Date.now();
jest.mock("@/services/clock", () => ({
  now: () => __now(),
}));

describe("FR-008 背景/分頁切換/喚醒後校正", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    // 將計時器刷新包在 act，避免 React 的未包裹更新警告
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    // 重置時鐘委派
    __now = () => Date.now();
  });

  it("模擬分頁切換 10 秒回來 → timeLeft 至少減 10 秒（±1 秒）", () => {
    const base = Date.now();
    __now = () => base;

    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.start();
    });

    const initial = result.current.timeLeft;

    // 模擬 10 秒後回到前景
    __now = () => base + 10_000;
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const diff = initial - result.current.timeLeft;
    expect(diff).toBeGreaterThanOrEqual(9); // 容許 ±1 秒
  });

  it("模擬休眠/喚醒 60 秒 → 正確校正", () => {
    const base = Date.now();
    __now = () => base;

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const initial = result.current.timeLeft;

    // 模擬喚醒（pageshow）60 秒之後
    __now = () => base + 60_000;
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });

    const diff = initial - result.current.timeLeft;
    expect(diff).toBeGreaterThanOrEqual(59); // 容許 ±1 秒
  });
});
