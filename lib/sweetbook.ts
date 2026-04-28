import { buildOrderZipBuffer, type OrderRecord } from "./order-export";
import type { Couple } from "./repo";

export type SweetbookConfig = {
  enabled: boolean;
  apiUrl: string | null;
  apiKey: string | null;
  apiToken: string | null;
};

export function getSweetbookConfig(): SweetbookConfig {
  const rawEnabled = process.env.SWEETBOOK_ENABLED ?? "";
  return {
    enabled: ["1", "true", "yes"].includes(rawEnabled.toLowerCase()),
    apiUrl: process.env.SWEETBOOK_API_URL?.trim() ?? null,
    apiKey: process.env.SWEETBOOK_API_KEY?.trim() ?? null,
    apiToken: process.env.SWEETBOOK_API_TOKEN?.trim() ?? null,
  };
}

export function ensureSweetbookConfig(): SweetbookConfig {
  const config = getSweetbookConfig();
  if (!config.enabled) throw new Error("Sweetbook 연동이 활성화되지 않았습니다.");
  if (!config.apiUrl) throw new Error("SWEETBOOK_API_URL을 설정해주세요.");
  return config;
}

export async function sendOrderToSweetbook(order: OrderRecord, couple: Couple) {
  const config = ensureSweetbookConfig();
  const zipBuffer = await buildOrderZipBuffer(order, couple);
  const form = new FormData();
  form.append("order_id", order.id);
  form.append("title", order.title);
  form.append("range_start", order.range_start);
  form.append("range_end", order.range_end);
  form.append("include_questions", String(!!order.include_questions));
  form.append("include_dates", String(!!order.include_dates));
  if (config.apiKey) form.append("api_key", config.apiKey);
  if (config.apiToken) form.append("api_token", config.apiToken);
  form.append(
    "package",
    new Blob([zipBuffer], { type: "application/zip" }),
    `${order.id}.zip`
  );

  const headers: Record<string, string> = {};
  if (config.apiToken) {
    headers["Authorization"] = `Bearer ${config.apiToken}`;
  } else if (config.apiKey) {
    headers["X-API-KEY"] = config.apiKey;
  }

  const apiUrl = config.apiUrl!;
  const response = await fetch(apiUrl, {
    method: "POST",
    body: form,
    headers,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Sweetbook 전송 실패 (${response.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { status: response.status, message: text };
  }
}
