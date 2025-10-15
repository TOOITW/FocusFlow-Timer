import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "../usePomodoro";

describe("FR-003 番茄鐘週期管理", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("完成 1 次專注 → 自動短休", () => {
    const { result } = renderHook(() => usePomodoro());
    // Focus start
    act(() => {
      result.current.start();
    });

    const focusTotal = result.current.timeLeft;
    // 完整跑完專注
    act(() => {
      jest.advanceTimersByTime(focusTotal * 1000);
    });
    // 歸零後安排自動切換（setTimeout(0)），推進 1ms 執行
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(5 * 60);
    expect(result.current.cycleCount).toBe(1);
  });

  it("連續 4 次專注 → 第 4 次後自動長休", () => {
    const { result } = renderHook(() => usePomodoro());

    const runToZeroAndAutoSwitch = () => {
      const total = result.current.timeLeft;
      act(() => {
        jest.advanceTimersByTime(total * 1000);
      });
      act(() => {
        jest.advanceTimersByTime(1);
      });
    };

    // 1st focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch(); // → shortBreak
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.cycleCount).toBe(1);

    // 完成短休 → 回 focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch(); // → focus
    expect(result.current.mode).toBe("focus");

    // 2nd focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch(); // → shortBreak
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.cycleCount).toBe(2);

    // 完成短休 → 回 focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch();
    expect(result.current.mode).toBe("focus");

    // 3rd focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch(); // → shortBreak
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.cycleCount).toBe(3);

    // 完成短休 → 回 focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch();
    expect(result.current.mode).toBe("focus");

    // 4th focus
    act(() => {
      result.current.start();
    });
    runToZeroAndAutoSwitch(); // → longBreak
    expect(result.current.mode).toBe("longBreak");
    expect(result.current.cycleCount).toBe(0); // 歸 0（mod-4）
    expect(result.current.timeLeft).toBe(15 * 60);
  });

  it("休息結束 → 自動回專注且時間重置", () => {
    const { result } = renderHook(() => usePomodoro());

    // 切到短休
    act(() => {
      result.current.switchMode("shortBreak");
    });
    expect(result.current.mode).toBe("shortBreak");
    expect(result.current.timeLeft).toBe(5 * 60);

    // 跑完短休
    act(() => {
      result.current.start();
    });
    const shortTotal = result.current.timeLeft;
    act(() => {
      jest.advanceTimersByTime(shortTotal * 1000);
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.mode).toBe("focus");
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isActive).toBe(false);
  });
});
