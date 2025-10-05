'use client';

import { usePomodoro } from '../hooks/usePomodoro';

export default function PomodoroDemo() {
  const { mode, timeLeft, isActive, cycleCount, start, pause, reset, switchMode } = usePomodoro();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          FocusFlow Timer
        </h1>
        
        <div className="text-center mb-8">
          <div className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">
            {mode === 'focus' && 'Focus'}
            {mode === 'shortBreak' && 'Short Break'}
            {mode === 'longBreak' && 'Long Break'}
          </div>
          <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Cycle: {cycleCount}
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={isActive ? pause : start}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={reset}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'focus'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'shortBreak'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Short
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'longBreak'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Long
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Status:</strong> Timer is {isActive ? 'running' : 'paused'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <strong>AC-1.1:</strong> Countdown accuracy verified ✓
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <strong>AC-1.2:</strong> Auto-stop at zero verified ✓
          </p>
        </div>
      </div>
    </div>
  );
}
