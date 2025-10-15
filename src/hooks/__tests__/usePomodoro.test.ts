import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "../usePomodoro";

describe("usePomodoro", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("初始化狀態 (State Initialization)", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => usePomodoro());

      expect(result.current.mode).toBe("focus");
      expect(result.current.timeLeft).toBe(25 * 60); // 25 minutes in seconds
      expect(result.current.isActive).toBe(false);
      expect(result.current.cycleCount).toBe(0);
    });
  });

  describe("AC-1.1: 準確倒數 (Accurate Countdown)", () => {
    it("should countdown correctly when active", () => {
      const { result } = renderHook(() => usePomodoro());

      // Start the timer
      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);
      const initialTime = result.current.timeLeft;

      // Advance time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(initialTime - 1);

      // Advance time by 5 more seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(initialTime - 6);
    });

    it("should not countdown when paused", () => {
      const { result } = renderHook(() => usePomodoro());

      // Start the timer
      act(() => {
        result.current.start();
      });

      // Advance 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const timeAfterStart = result.current.timeLeft;

      // Pause the timer
      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Time should remain the same
      expect(result.current.timeLeft).toBe(timeAfterStart);
    });

    it("should maintain accurate countdown over multiple seconds", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.start();
      });

      const initialTime = result.current.timeLeft;

      // Test countdown over 10 seconds
      for (let i = 1; i <= 10; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
        expect(result.current.timeLeft).toBe(initialTime - i);
      }
    });
  });

  describe("AC-1.2: 時間歸零停止 (Timer Stops at Zero)", () => {
    it("should stop timer when time reaches zero", () => {
      const { result } = renderHook(() => usePomodoro());

      // Set timer to 3 seconds for testing
      act(() => {
        result.current.switchMode("focus");
      });

      // Manually set timeLeft to 3 for faster testing
      act(() => {
        result.current.start();
      });

      // Fast forward to 1 second remaining
      const timeToAdvance = result.current.timeLeft - 1;
      act(() => {
        jest.advanceTimersByTime(timeToAdvance * 1000);
      });

      expect(result.current.timeLeft).toBe(1);
      expect(result.current.isActive).toBe(true);

      // Advance the final second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timer should be stopped and time should be 0
      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isActive).toBe(false);
    });

    it("should not go below zero", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.start();
      });

      // Fast forward to beyond the timer duration
      const totalTime = result.current.timeLeft;
      act(() => {
        jest.advanceTimersByTime((totalTime + 10) * 1000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe("計時器控制 (Timer Controls)", () => {
    it("should start timer correctly", () => {
      const { result } = renderHook(() => usePomodoro());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);
    });

    it("should pause timer correctly", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);
    });

    it("should reset timer to initial mode duration", () => {
      const { result } = renderHook(() => usePomodoro());

      // Start and let some time pass
      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      const initialTime = 25 * 60; // focus mode duration
      expect(result.current.timeLeft).toBeLessThan(initialTime);

      // Reset timer
      act(() => {
        result.current.reset();
      });

      expect(result.current.timeLeft).toBe(initialTime);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe("模式切換 (Mode Switching)", () => {
    it("should switch to short break mode", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.switchMode("shortBreak");
      });

      expect(result.current.mode).toBe("shortBreak");
      expect(result.current.timeLeft).toBe(5 * 60); // 5 minutes
      expect(result.current.isActive).toBe(false);
    });

    it("should switch to long break mode", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.switchMode("longBreak");
      });

      expect(result.current.mode).toBe("longBreak");
      expect(result.current.timeLeft).toBe(15 * 60); // 15 minutes
      expect(result.current.isActive).toBe(false);
    });

    it("should stop timer when switching mode", () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.switchMode("shortBreak");
      });

      expect(result.current.isActive).toBe(false);
    });
  });
});
