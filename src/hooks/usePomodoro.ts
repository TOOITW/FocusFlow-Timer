import { useState, useEffect, useRef, useCallback } from "react";
import { now } from "../services/clock";
import { sound } from "@/services/sound";
import { notifier } from "@/services/notifier";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

export interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  cycleCount: number;
}

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const usePomodoro = () => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimestampRef = useRef<number | null>(null);
  const autoSwitchTimeoutRef = useRef<number | null>(null);

  // 最新狀態快取
  const modeRef = useRef<TimerMode>(mode);
  const cycleRef = useRef<number>(cycleCount);
  const isActiveRef = useRef<boolean>(isActive);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { cycleRef.current = cycleCount; }, [cycleCount]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const clearIntervalIfAny = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const clearAutoSwitchIfAny = () => {
    if (autoSwitchTimeoutRef.current != null) {
      clearTimeout(autoSwitchTimeoutRef.current);
      autoSwitchTimeoutRef.current = null;
    }
  };

  // —— 只播一次提示音（通知改移到 setTimeout(0)）——
  const alertedRef = useRef(false);
  const playAlertOnce = useCallback(() => {
    if (alertedRef.current) return;
    alertedRef.current = true;
    void sound.playAlert();
  }, []);

  // —— 在 0ms 任務中發通知（測試會 advanceTimersByTime(1)）——
  const notifyAtZeroAsync = useCallback(() => {
    // 以 0ms macrotask 執行，配合測試節奏
    setTimeout(() => {
      // 以「歸零當下的模式」決定文案（尚未切換前）
      const curMode = modeRef.current;
      void (async () => {
        try {
          const p = await notifier.ensurePermission();
          if (p === "granted") {
            const body =
              curMode === "focus"
                ? "Focus session ended. Time for a break!"
                : "Break finished. Back to focus!";
            await notifier.notify({ title: "FocusFlow Timer", body });
          }
        } catch {
          // 靜默失敗
        }
      })();
    }, 0);
  }, []);

  // —— 自動切換（不自動開始）——
  const scheduleAutoSwitch = () => {
    clearAutoSwitchIfAny();
    autoSwitchTimeoutRef.current = window.setTimeout(() => {
      const curMode = modeRef.current;
      const curCycles = cycleRef.current;

      // 先發通知（若授權），再切模式
      notifyAtZeroAsync();

      if (curMode === "focus") {
        if (curCycles % 4 === 3) {
          setMode("longBreak");
          setTimeLeft(TIMER_DURATIONS.longBreak);
          setCycleCount(0);
        } else {
          setMode("shortBreak");
          setTimeLeft(TIMER_DURATIONS.shortBreak);
          setCycleCount((prev) => (prev + 1) % 4);
        }
      } else {
        setMode("focus");
        setTimeLeft(TIMER_DURATIONS.focus);
      }
      endTimestampRef.current = null;
      alertedRef.current = false; // 下一段可再次播提示音
      clearAutoSwitchIfAny();
    }, 0);
  };

  // Unmount 清理
  useEffect(() => {
    return () => {
      clearIntervalIfAny();
      clearAutoSwitchIfAny();
    };
  }, []);

  // 動態標題（FR-004）
  useEffect(() => {
    const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const ss = (timeLeft % 60).toString().padStart(2, "0");
    const modeLabel =
      mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break";
    if (typeof document !== "undefined") {
      document.title = `${mm}:${ss} - ${modeLabel}`;
    }
  }, [timeLeft, mode]);

  // —— 滴答：放在回圈內比對秒變化（更穩）——
  const lastTickSecondRef = useRef<number | null>(null);

  // 前景計時（以 endTimestamp 校正）
  useEffect(() => {
    if (!isActive || endTimestampRef.current == null) {
      clearIntervalIfAny();
      return;
    }

    intervalRef.current = setInterval(() => {
      const msLeft = endTimestampRef.current! - now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));

      // 滴答：整秒變化就觸發一次（service 會依 enableTick 決定是否出聲）
      if (secLeft > 0) {
        if (lastTickSecondRef.current === null) {
          lastTickSecondRef.current = secLeft;
        } else if (secLeft !== lastTickSecondRef.current) {
          void sound.playTick();
          lastTickSecondRef.current = secLeft;
        }
      }

      setTimeLeft(secLeft);

      if (secLeft === 0) {
        setIsActive(false);
        playAlertOnce();      // 立刻播提示音
        endTimestampRef.current = null;
        lastTickSecondRef.current = null; // 下一段重算
        scheduleAutoSwitch();  // 通知在 setTimeout(0) 內發出
      }
    }, 500);

    return clearIntervalIfAny;
  }, [isActive, playAlertOnce]);

  // 背景/喚醒校正（FR-008）
  useEffect(() => {
    const recalibrate = () => {
      if (!isActiveRef.current || endTimestampRef.current == null) return;
      const msLeft = endTimestampRef.current - now();
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000));

      // 滴答對齊
      if (secLeft > 0) {
        if (lastTickSecondRef.current === null) {
          lastTickSecondRef.current = secLeft;
        } else if (secLeft !== lastTickSecondRef.current) {
          void sound.playTick();
          lastTickSecondRef.current = secLeft;
        }
      }

      setTimeLeft(secLeft);
      if (secLeft === 0) {
        setIsActive(false);
        playAlertOnce();
        endTimestampRef.current = null;
        lastTickSecondRef.current = null;
        scheduleAutoSwitch();
      }
    };

    document.addEventListener("visibilitychange", recalibrate);
    window.addEventListener("pageshow", recalibrate);
    return () => {
      document.removeEventListener("visibilitychange", recalibrate);
      window.removeEventListener("pageshow", recalibrate);
    };
  }, [playAlertOnce]);

  // 控制
  const resetFlags = () => {
    lastTickSecondRef.current = null;
    alertedRef.current = false;
  };

  const start = useCallback(() => {
    endTimestampRef.current = now() + timeLeft * 1000;
    resetFlags();
    setIsActive(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsActive(false);
    endTimestampRef.current = null;
    lastTickSecondRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    clearAutoSwitchIfAny();
    setTimeLeft(TIMER_DURATIONS[mode]);
    endTimestampRef.current = null;
    resetFlags();
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsActive(false);
    clearAutoSwitchIfAny();
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    endTimestampRef.current = null;
    resetFlags();
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
