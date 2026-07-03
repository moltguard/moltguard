// Minimal local policy engine — the offline-first fast path.
//
// The OGR runtime is the primary decider. When it is reachable, moltguard sends
// every tool call for a verdict. When it is not, the cached `hard: true` rules
// from the policy bundle are still enforced locally (the ceilings that protect
// real money must not depend on connectivity). This is a faithful subset of the
// runtime's rule engine (ogr/rules.py) covering the ops the baseline + trading
// packs use.

// tool-name conventions for the trading decoder (mirror ogr/trading.py)
const TRANSFER_RE = /(transfer|withdraw|send|payout)/i;
const ORDER_RE = /(order|trade|buy|sell|swap)/i;
const AMOUNT_KEYS = ["amount_usd", "usd", "notional_usd", "amount", "notional", "quantity", "size"];
const DEST_KEYS = ["to", "destination", "address", "to_address", "recipient"];
const SYMBOL_KEYS = ["symbol", "pair", "market", "ticker", "token"];

const first = (obj, keys) => {
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== "" && obj[k] !== null) return obj[k];
  return undefined;
};

// Inject a normalized `_ogr` block so trading rules match stable paths.
export function normalizeForRules(payload) {
  const args = payload && payload.arguments;
  if (!args || typeof args !== "object") return payload;
  const name = String(payload.name || "");
  const amount = first(args, AMOUNT_KEYS);
  const dest = first(args, DEST_KEYS);
  const symbol = first(args, SYMBOL_KEYS);
  let actionType = "tool_call";
  if (TRANSFER_RE.test(name)) actionType = "transfer";
  else if (ORDER_RE.test(name)) actionType = "order";
  const amountUsd = amount == null ? null : Number(amount);
  return {
    ...payload,
    _ogr: {
      action_type: actionType,
      amount_usd: Number.isFinite(amountUsd) ? amountUsd : null,
      destination: dest == null ? null : String(dest),
      symbol: symbol == null ? null : String(symbol),
    },
  };
}

const SEVERITY = { block: 4, require_approval: 3, redact: 2, modify: 1, allow: 0 };
export const mostSevere = (ds) => ds.reduce((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a), "allow");

function getField(obj, path) {
  let cur = obj;
  for (const part of String(path).split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

const asText = (v) => (Array.isArray(v) ? v.join(" ") : String(v ?? ""));
const asNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function evalLeaf(cond, event) {
  if (cond.untrusted_provenance)
    return (event.provenance || []).some((p) => p.trust === "untrusted");
  if (cond.outside_time_window) {
    const hhmm = new Date().toISOString().slice(11, 16);
    const allowed = cond.outside_time_window.allowed || [];
    return !allowed.some(([s, e]) => s <= hhmm && hhmm <= e);
  }
  const value = getField(event, cond.field || "");
  if ("exists" in cond) return (value !== undefined && value !== null) === !!cond.exists;
  if (value === undefined || value === null) {
    if ("rate_gt" in cond || "daily_sum_gt" in cond) return false; // stateful — server-only
    return false;
  }
  if ("regex" in cond) return new RegExp(cond.regex, "is").test(asText(value));
  if ("contains" in cond) return asText(value).toLowerCase().includes(String(cond.contains).toLowerCase());
  if ("prefix" in cond) return asText(value).startsWith(String(cond.prefix));
  if ("equals" in cond) return value === cond.equals;
  if ("not_equals" in cond) return value !== cond.not_equals;
  if ("in" in cond) return cond.in.includes(value);
  if ("not_in" in cond) return !cond.not_in.includes(value);
  for (const op of ["gt", "gte", "lt", "lte"]) {
    if (op in cond) {
      const n = asNum(value), r = asNum(cond[op]);
      if (n == null || r == null) return false;
      return { gt: n > r, gte: n >= r, lt: n < r, lte: n <= r }[op];
    }
  }
  // stateful ops (rate_gt/daily_sum_gt) are enforced by the runtime, not locally
  return false;
}

function evalCond(cond, event) {
  if (cond.all) return cond.all.every((c) => evalCond(c, event));
  if (cond.any) return cond.any.some((c) => evalCond(c, event));
  if (cond.not) return !evalCond(cond.not, event);
  return evalLeaf(cond, event);
}

// Evaluate cached rules locally. hardOnly=true => degraded-mode enforcement.
export function evaluateLocal(policy, event, { hardOnly = false } = {}) {
  const evalEvent =
    event.kind === "tool_call" ? { ...event, payload: normalizeForRules(event.payload) } : event;
  const matches = [];
  for (const rule of (policy && policy.rules) || []) {
    if (hardOnly && !rule.hard) continue;
    if (rule.kinds && !rule.kinds.includes(event.kind)) continue;
    if (rule.when == null || evalCond(rule.when, evalEvent)) {
      matches.push({
        rule_id: rule.id || "unnamed",
        decision: rule.decision || "block",
        reasons: rule.reason ? [rule.reason] : [],
        hard: !!rule.hard,
      });
    }
  }
  return matches;
}
