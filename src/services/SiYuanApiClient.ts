import { FETCH_TIMEOUT } from "../utils/constants";

export interface ISiYuanApiClient {
  post<TData>(endpoint: string, payload: unknown): Promise<TData | null>;
}

interface SiYuanApiResponse<TData> {
  code: number;
  data?: TData;
  msg?: string;
}

export class SiYuanApiClient implements ISiYuanApiClient {
  async post<TData>(endpoint: string, payload: unknown): Promise<TData | null> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as SiYuanApiResponse<TData>;
      return data.code === 0 ? data.data ?? null : null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

export interface BlockInfo {
  box?: string;
  path?: string;
}

export interface ListDocsByPathResult<TFile> {
  files?: TFile[];
}
