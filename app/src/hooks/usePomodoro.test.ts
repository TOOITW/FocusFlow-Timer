import { renderHook, act } from "@testing-library/react";
import { usePomodoro, DURATIONS } from "./usePomodoro";

describe("usePomodoro - FR-001~FR-003", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  it("AC-1.1: 經過 M 秒後，剩餘為 N-M 秒", () => {
    const { result } = renderHook(() => usePomodoro());
    const initial = result.current.timeLeft;

    act(() => {
      result.current.handleStartPause();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(initial - 5);
  });

  it("AC-1.2: 歸零時停止並為 inactive", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.handleStartPause();
    });
    act(() => {
      jest.advanceTimersByTime(DURATIONS.focus * 1000);
    });

    expect(result.current.isActive).toBe(false);
    expect(["short_break", "long_break"]).toContain(result.current.mode);
    expect(result.current.timeLeft).toBe(DURATIONS[result.current.mode]);
  });

  it("AC-2.1: Start 使計時器 active", () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.isActive).toBe(false);
    act(() => {
      result.current.handleStartPause();
    });
    expect(result.current.isActive).toBe(true);
  });

  it("AC-2.2: Pause 使計時器 inactive 並保留時間", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.handleStartPause();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    const before = result.current.timeLeft;

    act(() => {
      result.current.handleStartPause();
    }); // Pause
    expect(result.current.isActive).toBe(false);
    expect(result.current.timeLeft).toBe(before);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(before);
  });

  it("AC-2.3: Reset 會 inactive 並重置為當前模式初始值", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.handleStartPause();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(DURATIONS.focus - 1);

    act(() => {
      result.current.handleReset();
    });
    expect(result.current.isActive).toBe(false);
    expect(result.current.timeLeft).toBe(DURATIONS.focus);
  });

  it("AC-3.1: 專注結束且完成 <3 週期 -> 短休", () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.mode).toBe("focus");
    expect(result.current.cycleCount).toBe(0);

    act(() => {
      result.current.handleStartPause();
    });
    act(() => {
      jest.advanceTimersByTime(DURATIONS.focus * 1000);
    });

    expect(result.current.mode).toBe("short_break");
    expect(result.current.timeLeft).toBe(DURATIONS.short_break);
    expect(result.current.cycleCount).toBe(1);
  });
});
