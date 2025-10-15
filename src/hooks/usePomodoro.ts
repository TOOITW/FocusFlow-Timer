import { useState, useEffect, useRef, useCallback } from "react";
import { now } from "../services/clock";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  cycleCount: number;
}

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60, // 25 minutes in seconds
  shortBreak: 5 * 60, // 5 minutes in seconds
  longBreak: 15 * 60, // 15 minutes in seconds
};

export const usePomodoro = () => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 校正用：當 start() 時設定截止時間；visibility/pageshow 事件時依據 now() 校正
  const endTimestampRef = useRef<number | null>(null);
  const autoSwitchTimeoutRef = useRef<number | null>(null);

  // 避免閉包過期：持有最新狀態
  const modeRef = useRef<TimerMode>(mode);
  const cycleRef = useRef<number>(cycleCount);
  const isActiveRef = useRef<boolean>(isActive);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    cycleRef.current = cycleCount;
  }, [cycleCount]);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const clearIntervalIfAny = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearAutoSwitchIfAny = () => {
    if (autoSwitchTimeoutRef.current != null) {
      // window.setTimeout 回傳 number（jsdom/瀏覽器環境）
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
    }
  };

  const scheduleAutoSwitch = () => {
    clearAutoSwitchIfAny();
    autoSwitchTimeoutRef.current = window.setTimeout(() => {
      const curMode = modeRef.current;
      const curCycles = cycleRef.current;

      if (curMode === "focus") {
        // 完成一個專注
        if (curCycles % 4 === 3) {
          // 第 4 次專注完成 → 長休，cycleCount 歸 0（mod-4）
          setMode("longBreak");
          setTimeLeft(TIMER_DURATIONS.longBreak);
          setCycleCount(0);
        } else {
          // 第 1~3 次完成 → 短休，cycleCount + 1
          setMode("shortBreak");
          setTimeLeft(TIMER_DURATIONS.shortBreak);
          setCycleCount((prev) => (prev + 1) % 4);
        }
      } else {
        // 任何休息結束 → 回到專注
        setMode("focus");
        setTimeLeft(TIMER_DURATIONS.focus);
      }
      // 不自動啟動
      endTimestampRef.current = null;
      clearAutoSwitchIfAny();
    }, 0);
  };

  // AC-1.1: Accurate countdown - decrements by 1 second every second
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // AC-1.2: Time reaches zero, stop the timer
            setIsActive(false);
            // 歸零後排程自動切換（以 setTimeout(0)），避免破壞現有 AC-1.2 測試
            scheduleAutoSwitch();
            endTimestampRef.current = null;
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearIntervalIfAny();
    }

    return () => {
      clearIntervalIfAny();
    };
  }, [isActive, timeLeft]);

  // 背景/分頁切換/喚醒後校正（FR-008）
  useEffect(() => {
    const recalibrate = () => {
      if (!isActiveRef.current || endTimestampRef.current == null) return;
      const msLeft = endTimestampRef.current - now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));
      setTimeLeft(secLeft);
      if (secLeft === 0) {
        setIsActive(false);
        endTimestampRef.current = null;
        scheduleAutoSwitch();
      }
    };

    document.addEventListener("visibilitychange", recalibrate);
    window.addEventListener("pageshow", recalibrate);
    return () => {
      document.removeEventListener("visibilitychange", recalibrate);
      window.removeEventListener("pageshow", recalibrate);
    };
  }, []);

  // Unmount 時確保清理任何掛起的計時器
  useEffect(() => {
    return () => {
      clearIntervalIfAny();
      if (autoSwitchTimeoutRef.current != null) {
        clearTimeout(autoSwitchTimeoutRef.current);
        autoSwitchTimeoutRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    // 啟動時計算截止時間，用於後續校正
    endTimestampRef.current = now() + timeLeft * 1000;
    setIsActive(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsActive(false);
    endTimestampRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    clearAutoSwitchIfAny();
    setTimeLeft(TIMER_DURATIONS[mode]);
    endTimestampRef.current = null;
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsActive(false);
    clearAutoSwitchIfAny();
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    endTimestampRef.current = null;
  }, []);

  return {
    mode,
    timeLeft,
    isActive,
    cycleCount,
    start,
    pause,
    reset,
    switchMode,
  };
};
