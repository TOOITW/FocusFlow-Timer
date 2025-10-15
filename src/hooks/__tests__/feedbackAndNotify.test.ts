// ───────────────────────────────────────────────────────────────
// 1) 在所有 import 之前先定義「全域可用的 mock」
//    （避免 jest.mock 被 hoist 時抓不到變數的初始化）
// ───────────────────────────────────────────────────────────────
// @ts-ignore
(globalThis as any).__tickEnabled = false;
// @ts-ignore
(globalThis as any).__playAlertMock = jest.fn(async () => {});
// @ts-ignore
(globalThis as any).__playTickMock = jest.fn(async () => {});
// @ts-ignore
(globalThis as any).__setVolumeMock = jest.fn();
// @ts-ignore
(globalThis as any).__enableTickMock = jest.fn((v: boolean) => {
  (globalThis as any).__tickEnabled = v;
});

// @ts-ignore
(globalThis as any).__permission = "default" as
  | "default"
  | "denied"
  | "granted";
// @ts-ignore
(globalThis as any).__ensurePermissionMock = jest.fn(
  async () => (globalThis as any).__permission
);
// @ts-ignore
(globalThis as any).__notifyMock = jest.fn(
  async (_opts: { title: string; body?: string }) => {}
);

// ───────────────────────────────────────────────────────────────
// 2) mock 工廠只「代理」到全域 mock，不直接引用區域變數
// ───────────────────────────────────────────────────────────────
jest.mock("@/services/sound", () => ({
  sound: {
    playAlert: (...args: any[]) => (globalThis as any).__playAlertMock(...args),
    playTick: () =>
      (globalThis as any).__tickEnabled
        ? (globalThis as any).__playTickMock()
        : Promise.resolve(),
    setVolume: (v: number) => (globalThis as any).__setVolumeMock(v),
    enableTick: (v: boolean) => (globalThis as any).__enableTickMock(v),
  },
}));

jest.mock("@/services/notifier", () => ({
  notifier: {
    ensurePermission: () => (globalThis as any).__ensurePermissionMock(),
    notify: (opts: { title: string; body?: string }) =>
      (globalThis as any).__notifyMock(opts),
  },
}));

// ───────────────────────────────────────────────────────────────
// 3) 現在才 import（import 時就會吃到上面的 mock）
// ───────────────────────────────────────────────────────────────
import { renderHook, act } from "@testing-library/react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { sound } from "@/services/sound";

// 4) 在測試區塊裡，拿到可斷言的 mock 實體
const playAlertMock = (globalThis as any).__playAlertMock as jest.Mock;
const playTickMock = (globalThis as any).__playTickMock as jest.Mock;
const setVolumeMock = (globalThis as any).__setVolumeMock as jest.Mock;
const enableTickMock = (globalThis as any).__enableTickMock as jest.Mock;
const ensurePermissionMock = (globalThis as any)
  .__ensurePermissionMock as jest.Mock;
const notifyMock = (globalThis as any).__notifyMock as jest.Mock;

// 幫 permission 做個易讀別名（就是改全域那個值）
let permission = (globalThis as any).__permission as
  | "default"
  | "denied"
  | "granted";

describe("FR-004/005/009/010 回饋與通知", () => {
  beforeEach(() => {
    jest.useFakeTimers();

    (globalThis as any).__tickEnabled = false;
    (globalThis as any).__permission = "default";
    permission = (globalThis as any).__permission;

    playAlertMock.mockClear();
    playTickMock.mockClear();
    notifyMock.mockClear();
    ensurePermissionMock.mockClear();
    setVolumeMock.mockClear();
    enableTickMock.mockClear();
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

  it("開啟滴答且 isActive 時逐秒觸發;暫停不觸發", () => {
    const { result } = renderHook(() => usePomodoro());

    // 開啟滴答
    act(() => {
      sound.enableTick(true);
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(playTickMock).toHaveBeenCalledTimes(3);

    // 暫停後不再累計
    act(() => {
      result.current.pause();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(playTickMock).toHaveBeenCalledTimes(3);
  });

  it("通知：拒絕或未授權時不拋錯、不發通知", () => {
    (globalThis as any).__permission = "denied";

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const total = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(total * 1000);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(ensurePermissionMock).toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  // 👇 1. 將測試函式標記為 async
  it("通知：授權時在歸零時發出一次通知", async () => {
    (globalThis as any).__permission = "granted";

    const { result } = renderHook(() => usePomodoro());
    act(() => {
      result.current.start();
    });
    const total = result.current.timeLeft;

    act(() => {
      jest.advanceTimersByTime(total * 1000);
    });

    // 👇 2. 將 runAllTimers 包在一個 async 的 act 中，並用 await 等待它完成
    await act(async () => {
        jest.runAllTimers();
    });

    expect(ensurePermissionMock).toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledTimes(1);
    const [[notification]] = notifyMock.mock.calls as [
      [{ title: string; body?: string }],
    ];
    expect(notification.title).toBe("FocusFlow Timer");
  });
});
