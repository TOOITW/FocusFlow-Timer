import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "@/hooks/usePomodoro";

// Mock sound：可切換 tick 開關；Alert/Notify 可觀察次數
let tickEnabled = false;
const playAlertMock = jest.fn(async () => {});
const tickCounter = { count: 0 };
const playTickWrapper = async () => {
  if (tickEnabled) tickCounter.count += 1;
};
const setVolumeMock = jest.fn();
const enableTickMock = jest.fn((v: boolean) => {
  tickEnabled = v;
});

jest.mock("@/services/sound", () => ({
  sound: {
    playAlert: () => playAlertMock(),
    playTick: () => playTickWrapper(),
    setVolume: (v: number) => setVolumeMock(v),
    enableTick: (v: boolean) => enableTickMock(v),
  },
}));

// Mock notifier：可設定授權狀態
let permission: "default" | "denied" | "granted" = "default";
const ensurePermissionMock = jest.fn(async () => permission);
const notifyMock = jest.fn(async () => {});

jest.mock("@/services/notifier", () => ({
  notifier: {
    ensurePermission: () => ensurePermissionMock(),
    notify: (opts: { title: string; body?: string }) => notifyMock(opts),
  },
}));

describe("FR-004/005/009/010 回饋與通知", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    tickEnabled = false;
    playAlertMock.mockClear();
    notifyMock.mockClear();
    ensurePermissionMock.mockClear();
    setVolumeMock.mockClear();
    enableTickMock.mockClear();
    tickCounter.count = 0;
    permission = "default";
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("動態標題格式為 MM:SS - [mode]", () => {
    const { result } = renderHook(() => usePomodoro());

    // 初始
    expect(document.title).toBe("25:00 - Focus");

    // 走 1 秒
    act(() => {
      result.current.start();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(document.title).toBe("24:59 - Focus");

    // 切到短休
    act(() => {
      result.current.switchMode("shortBreak");
    });
    expect(document.title).toBe("05:00 - Short Break");
  });

  it("timeLeft 歸零只觸發一次 playAlert", () => {
    const { result } = renderHook(() => usePomodoro());

    act(() => {
      result.current.start();
    });
    const total = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(total * 1000);
    });
    // 讓自動切換的 setTimeout(0) 有機會執行
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(playAlertMock).toHaveBeenCalledTimes(1);
  });

  it("開啟滴答且 isActive 時逐秒觸發；暫停不觸發", () => {
    const { result } = renderHook(() => usePomodoro());

    // 開啟滴答
    act(() => {
      // 透過 service 切換偏好（hook 不暴露 API）
      enableTickMock(true);
      tickEnabled = true;
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(tickCounter.count).toBe(3);

    // 暫停後不再累計
    act(() => {
      result.current.pause();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(tickCounter.count).toBe(3);
  });

  it("通知：拒絕或未授權時不拋錯、不發通知", () => {
    permission = "denied";

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const total = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(total * 1000);
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(ensurePermissionMock).toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("通知：授權時在歸零時發出一次通知", () => {
    permission = "granted";

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const total = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(total * 1000);
    });
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(ensurePermissionMock).toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock.mock.calls[0][0].title).toBe("FocusFlow Timer");
  });
});
