type SupabaseClientConfig = {
  url: string;
  apiKey: string;
};

export function getSupabaseAnonConfig(): SupabaseClientConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) return null;
  return { url, apiKey };
}

export function getSupabaseServiceConfig(): SupabaseClientConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, apiKey: serviceKey };
}

export function supabaseHeaders(
  apiKey: string,
  extra: Record<string, string> = {},
) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function supabaseRest<T>(
  config: SupabaseClientConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, init);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
