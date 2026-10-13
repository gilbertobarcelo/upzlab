export type UpzLabSDKOptions = {
  appId: string;
  apiUrl: string;
  appVersion?: string;
  getAccessToken: () => string | null | Promise<string | null>;
  timezone?: string;
  platform?: "web" | "react-native" | "android" | "ios" | "unknown";
  onError?: (error: Error) => void;
};

type CheckinResponse = {
  success: boolean;
  data: {
    opened_today: boolean;
    status: string;
    points_awarded: number;
    reward: number;
    last_seen_at: string | null;
  };
};

export class UpzLabSDK {
  private readonly appId: string;
  private readonly apiUrl: string;
  private readonly appVersion?: string;
  private readonly getAccessToken: UpzLabSDKOptions["getAccessToken"];
  private readonly timezone: string;
  private readonly platform: NonNullable<UpzLabSDKOptions["platform"]>;
  private readonly onError?: UpzLabSDKOptions["onError"];
  private readonly sessionId: string;
  private lastSentDay: string | null = null;
  private visibilityListener?: () => void;

  constructor(options: UpzLabSDKOptions) {
    this.appId = options.appId;
    this.apiUrl = options.apiUrl.replace(/\/+$/, "");
    this.appVersion = options.appVersion;
    this.getAccessToken = options.getAccessToken;
    this.timezone =
      options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
    this.platform = options.platform ?? "web";
    this.onError = options.onError;
    this.sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `upzlab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error("Autenticação UpzLab necessária para registrar o check-in.");
    }

    const response = await fetch(`${this.apiUrl}/sdk/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`UpzLab SDK respondeu HTTP ${response.status}: ${message}`);
    }
    return response.json() as Promise<T>;
  }

  async trackOpen(): Promise<CheckinResponse> {
    const result = await this.request<CheckinResponse>("checkin", {
      method: "POST",
      body: JSON.stringify({
        app_id: this.appId,
        platform: this.platform,
        session_id: this.sessionId,
        timezone: this.timezone,
        ...(this.appVersion ? { app_version: this.appVersion } : {}),
      }),
    });
    this.lastSentDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timezone,
    }).format(new Date());
    return result;
  }

  async getStatus<T = unknown>(): Promise<T> {
    const query = new URLSearchParams({
      app_id: this.appId,
      timezone: this.timezone,
    });
    return this.request<T>(`checkin/status?${query.toString()}`);
  }

  bindAutoOpen(): () => void {
    if (typeof document === "undefined") return () => undefined;

    const register = () => {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: this.timezone,
      }).format(new Date());
      if (this.lastSentDay === today) return;
      void this.trackOpen().catch((error: unknown) => {
        const sdkError =
          error instanceof Error ? error : new Error("Falha desconhecida do UpzLab SDK.");
        if (this.onError) {
          this.onError(sdkError);
        } else {
          console.error("[UpzLab SDK] Não foi possível registrar a abertura.", sdkError);
        }
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") register();
    };
    this.visibilityListener = onVisibilityChange;
    document.addEventListener("visibilitychange", onVisibilityChange);
    register();

    return () => {
      if (this.visibilityListener) {
        document.removeEventListener("visibilitychange", this.visibilityListener);
        this.visibilityListener = undefined;
      }
    };
  }
}

export default UpzLabSDK;
