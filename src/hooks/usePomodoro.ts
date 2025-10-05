import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

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
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATIONS.focus);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [cycleCount] = useState<number>(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // AC-1.1: Accurate countdown - decrements by 1 second every second
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // AC-1.2: Time reaches zero, stop the timer
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
  }, [mode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
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
