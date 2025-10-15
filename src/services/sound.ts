export interface Sound {
  playAlert(): Promise<void>;
  playTick(): Promise<void>;
  setVolume(v: number): void;
  enableTick(enabled: boolean): void;
}

function clamp01(v: number) {
  if (Number.isNaN(v)) return 1;
  return Math.max(0, Math.min(1, v));
}

export function createDefaultSound(): Sound {
  const hasAudio = typeof Audio !== "undefined";
  const alertEl = hasAudio ? new Audio("/sounds/alert.mp3") : null;
  const tickEl = hasAudio ? new Audio("/sounds/tick.mp3") : null;

  // 避免連播延遲（短音效）
  if (tickEl) tickEl.preload = "auto";
  if (alertEl) alertEl.preload = "auto";

  let volume = 1;
  let tickEnabled = false;

  return {
    async playAlert() {
      if (!alertEl) return;
      try {
        // jsdom 會對未實作的 API 噴錯，因此真實瀏覽器才會走到這段
        alertEl.pause();
        alertEl.currentTime = 0;
        alertEl.volume = volume;
        await alertEl.play();
      } catch {
        // 靜默失敗（測試或無音訊裝置）
      }
    },
    async playTick() {
      if (!tickEnabled || !tickEl) return;
      try {
        tickEl.pause();
        tickEl.currentTime = 0;
        tickEl.volume = volume;
        await tickEl.play();
      } catch {
        // 靜默失敗
      }
    },
    setVolume(v: number) {
      volume = clamp01(v);
    },
    enableTick(enabled: boolean) {
      tickEnabled = !!enabled;
    },
  };
}

export function createNoopSound(): Sound {
  return {
    playAlert: async () => {},
    playTick: async () => {},
    setVolume: () => {},
    enableTick: () => {},
  };
}

// 在 JSDOM/Node-like（測試/SSR）環境下改用 no-op，避免觸發未實作的 play/pause
function isJsDomLike(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined")
    return true;
  const ua = navigator.userAgent || "";
  return /jsdom|node\.js/i.test(ua);
}

// 預設單例（可被 jest.mock 取代）
export const sound: Sound =
  typeof Audio !== "undefined" && !isJsDomLike()
    ? createDefaultSound()
    : createNoopSound();
