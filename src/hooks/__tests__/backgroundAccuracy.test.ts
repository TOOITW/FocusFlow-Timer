import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "@/hooks/usePomodoro";
import * as clock from "@/services/clock";

describe("FR-008 背景/分頁切換/喚醒後校正", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("模擬分頁切換 10 秒回來 → timeLeft 至少減 10 秒（±1 秒）", () => {
    const base = Date.now();
    jest.spyOn(clock, "now").mockImplementation(() => base);

    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.start();
    });

    const initial = result.current.timeLeft;

    // 模擬 10 秒後回到前景
    (clock.now as jest.Mock).mockImplementation(() => base + 10_000);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const diff = initial - result.current.timeLeft;
    expect(diff).toBeGreaterThanOrEqual(9); // 容許 ±1 秒
  });

  it("模擬休眠/喚醒 60 秒 → 正確校正", () => {
    const base = Date.now();
    jest.spyOn(clock, "now").mockImplementation(() => base);

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const initial = result.current.timeLeft;

    // 模擬喚醒（pageshow）60 秒之後
    (clock.now as jest.Mock).mockImplementation(() => base + 60_000);
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });

    const diff = initial - result.current.timeLeft;
    expect(diff).toBeGreaterThanOrEqual(59); // 容許 ±1 秒
  });
});
