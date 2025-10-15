export interface Notifier {
  ensurePermission(): Promise<"granted" | "denied" | "default">;
  notify(opts: { title: string; body?: string }): Promise<void>;
}

export function createDefaultNotifier(): Notifier {
  return {
    async ensurePermission() {
      if (typeof Notification === "undefined") {
        return "denied";
      }
      const state = Notification.permission as "granted" | "denied" | "default";
      if (
        state === "default" &&
        typeof Notification.requestPermission === "function"
      ) {
        try {
          return await Notification.requestPermission();
        } catch {
          return "denied";
        }
      }
      return state;
    },
    async notify(opts) {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        // 觸發瀏覽器原生通知
        // eslint-disable-next-line no-new
        new Notification(opts.title, { body: opts.body });
      } catch {
        // 靜默失敗
      }
    },
  };
}

export function createNoopNotifier(): Notifier {
  return {
    ensurePermission: async () => "denied",
    notify: async () => {},
  };
}

// 預設單例（可被 jest.mock 取代）
export const notifier: Notifier =
  typeof Notification !== "undefined"
    ? createDefaultNotifier()
    : createNoopNotifier();
