import { useCallback, useEffect, useRef, useState } from "react";

export type PomodoroMode = "focus" | "short_break" | "long_break";

export const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export type UsePomodoroState = {
  mode: PomodoroMode;
  timeLeft: number; // seconds
  isActive: boolean;
  cycleCount: number; // 已完成的專注次數（自上次長休後，0..3）
};

export type UsePomodoroApi = UsePomodoroState & {
  start: () => void;
  pause: () => void;
  handleStartPause: () => void;
  handleReset: () => void;
};

type TimerId = ReturnType<typeof setInterval>;

export function usePomodoro(): UsePomodoroApi {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const intervalRef = useRef<TimerId | null>(null);
  const endAtRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endAtRef.current = null;
  }, []);

  const decideNext = useCallback(
    (currentMode: PomodoroMode, currentCycles: number) => {
      if (currentMode === "focus") {
        if (currentCycles === 3) {
          // 第 4 次專注結束 -> 長休，cycle 歸零
          return { nextMode: "long_break" as PomodoroMode, nextCycles: 0 };
        }
        // 專注結束（0,1,2）-> 短休，cycle +1
        return {
          nextMode: "short_break" as PomodoroMode,
          nextCycles: currentCycles + 1,
        };
      }
      // 休息結束 -> 專注，cycle 不變
      return { nextMode: "focus" as PomodoroMode, nextCycles: currentCycles };
    },
    []
  );

  const stopAndAutoSwitch = useCallback(() => {
    clearTimer();
    setIsActive(false);
    setTimeLeft(0);

    setCycleCount((prevC) => {
      const { nextMode, nextCycles } = decideNext(mode, prevC);
      setMode(nextMode);
      setTimeLeft(DURATIONS[nextMode]);
      return nextCycles;
    });
  }, [clearTimer, decideNext, mode]);

  const tick = useCallback(() => {
    const endAt = endAtRef.current;
    if (!endAt) return;

    const msLeft = endAt - Date.now();
    const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));

    setTimeLeft((prev) => (prev !== secsLeft ? secsLeft : prev));

    if (secsLeft <= 0) {
      stopAndAutoSwitch();
    }
  }, [stopAndAutoSwitch]);

  const start = useCallback(() => {
    if (isActive) return;
    endAtRef.current = Date.now() + timeLeft * 1000;
    intervalRef.current = setInterval(tick, 250);
    setIsActive(true);
  }, [isActive, timeLeft, tick]);

  const pause = useCallback(() => {
    if (!isActive) return;
    if (endAtRef.current != null) {
      const msLeft = Math.max(0, endAtRef.current - Date.now());
      const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setTimeLeft(secsLeft);
    }
    clearTimer();
    setIsActive(false);
  }, [clearTimer, isActive]);

  const handleStartPause = useCallback(() => {
    if (isActive) pause();
    else start();
  }, [isActive, pause, start]);

  const handleReset = useCallback(() => {
    clearTimer();
    setIsActive(false);
    setTimeLeft(DURATIONS[mode]);
  }, [clearTimer, mode]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // 僅在「模式改變」且目前未運行時，同步 timeLeft 到該模式的預設值
  // 避免 Pause（isActive 變為 false）時把剩餘時間重置掉
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(DURATIONS[mode]);
    }
  }, [mode]);

  return {
    mode,
    timeLeft,
    isActive,
    cycleCount,
    start,
    pause,
    handleStartPause,
    handleReset,
  };
}

export default usePomodoro;
