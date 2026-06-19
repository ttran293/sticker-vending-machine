const VISITOR_SESSION_KEY = "sticker-machine-visitor-count";

let visitorCountRequest: Promise<number | null> | null = null;

function parseVisitorCount(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const count = typeof value === "number" ? value : Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : null;
}

export function getVisitorCount() {
  if (typeof window === "undefined") return Promise.resolve(null);

  const cached = parseVisitorCount(sessionStorage.getItem(VISITOR_SESSION_KEY));
  if (cached !== null) return Promise.resolve(cached);
  if (visitorCountRequest) return visitorCountRequest;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return Promise.resolve(null);
  }

  visitorCountRequest = fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/increment_visitor_count`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Visitor counter request failed with ${response.status}`);
      }

      const count = parseVisitorCount(await response.json());
      if (count !== null) {
        sessionStorage.setItem(VISITOR_SESSION_KEY, String(count));
      }
      return count;
    })
    .catch(() => null)
    .finally(() => {
      visitorCountRequest = null;
    });

  return visitorCountRequest;
}
