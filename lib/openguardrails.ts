const BASE_URL =
  process.env.OPENGUARDRAILS_BASE_URL || "https://api.openguardrails.com/v1";
const API_KEY = () => process.env.OPENGUARDRAILS_API_KEY || "";

interface ScanResult {
  risk_level: string;
  risk_types: string[];
  score: number;
  [key: string]: unknown;
}

async function proxyRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ data: ScanResult; raw: unknown }> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OpenGuardRails API error (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  return {
    data: {
      risk_level: data.risk_level ?? "unknown",
      risk_types: data.risk_types ?? [],
      score: data.score ?? 0,
      ...data,
    },
    raw: data,
  };
}

export interface AgentInfo {
  agent_id: number;
  agent_name: string;
  agent_description: string | null;
}

export async function scanEmail(content: string, agent: AgentInfo) {
  return proxyRequest("/scan/email", { content, ...agent });
}

export async function scanWebpage(content: string, agent: AgentInfo, url?: string) {
  const body: Record<string, unknown> = { content, ...agent };
  if (url) body.url = url;
  return proxyRequest("/scan/webpage", body);
}
