// moltguard — the OGR-protocol enforcement point for OpenClaw.
//
// moltguard is the open-source implementation of the OpenGuardrails (OGR)
// protocol at the agent-hook altitude. It registers a `before_tool_call` gate
// hook: every tool call the agent is about to make becomes an OGR GuardEvent,
// is sent to your OpenGuardrails Runtime for a verdict, and is allowed,
// blocked, or held for phone approval before it can execute. The runtime (the
// paid platform) is where policy, detection, approvals, and audit live;
// moltguard is the open plug that speaks the protocol.
import os from "node:os";
import path from "node:path";
import { OgrClient } from "./lib/ogr-client.js";

const STATE_DIR = path.join(os.homedir(), ".openclaw", "moltguard");

// Best-effort taint: a tool call carrying web/fetched content is untrusted
// input that could be driving a privileged action (indirect prompt injection).
function provenanceFor(params) {
  const blob = JSON.stringify(params || {}).toLowerCase();
  if (/(https?:\/\/|fetched|web_|scrape|readability)/.test(blob)) {
    return [{ source: "web", trust: "untrusted", taint_tags: ["external_content"] }];
  }
  return [];
}

function readConfig(api, pluginConfig) {
  const cfg = pluginConfig || api?.config?.plugins?.entries?.moltguard?.config || {};
  return {
    server: process.env.OGR_SERVER || cfg.server || "http://127.0.0.1:8878",
    enrollToken: process.env.OGR_ENROLL_TOKEN || cfg.enrollToken || "",
    principal: process.env.OGR_PRINCIPAL || cfg.principal || "openclaw-user",
    failOpen: cfg.failOpenWhenUnconfigured !== false,
    heartbeatIntervalS: cfg.heartbeatIntervalS || 60,
  };
}

// Register the gate hook on whichever API shape this OpenClaw exposes.
function onHook(api, name, handler, opts) {
  const reg = api?.hooks?.on?.bind(api.hooks) || api?.on?.bind(api) || api?.registerTypedHook?.bind(api);
  if (!reg) throw new Error("moltguard: no hook registration API found on plugin api");
  return reg(name, handler, opts);
}

// A held action can wait on a human tapping approve on their phone, so the gate
// must not be killed by a short hook timeout. Bounded by the runtime's own
// approval TTL.
const APPROVAL_HOOK_TIMEOUT_MS = 600000;

export default {
  id: "moltguard",
  name: "moltguard",
  description: "Zero Trust security for OpenClaw agents — the OGR-protocol enforcement point.",
  register(api) {
    const log = api?.logger?.info?.bind(api.logger) || (() => {});
    const warn = api?.logger?.warn?.bind(api.logger) || (() => {});
    const cfg = readConfig(api);
    const client = new OgrClient({ server: cfg.server, stateDir: STATE_DIR });
    let enrollPromise = null;

    async function ensureEnrolled() {
      if (client.enrolled) return true;
      if (!cfg.enrollToken) return false; // unconfigured
      if (!enrollPromise) {
        enrollPromise = client
          .enroll({ enrollToken: cfg.enrollToken, agentType: "openclaw", principal: cfg.principal, heartbeatIntervalS: cfg.heartbeatIntervalS })
          .then((d) => { log(`moltguard enrolled as ${d.agent_id} (${d.policy.rules.length} rules)`); return true; })
          .catch((e) => { warn(`moltguard enroll failed: ${e.message}`); enrollPromise = null; return false; });
      }
      return enrollPromise;
    }

    // enroll + start heartbeat when the gateway comes up
    onHook(api, "gateway_start", async () => {
      const ok = await ensureEnrolled();
      if (ok && !client._hb) {
        client._hb = setInterval(() => client.heartbeat().catch(() => {}), cfg.heartbeatIntervalS * 1000);
        if (client._hb.unref) client._hb.unref();
      }
    });

    // THE enforcement point: gate every tool call through the runtime.
    onHook(api, "before_tool_call", async (event, ctx) => {
      const ready = await ensureEnrolled();
      if (!ready) {
        // not configured: fail open (default) so we never brick an agent that
        // simply hasn't been pointed at a runtime yet.
        if (cfg.failOpen) return;
        return { block: true, blockReason: "moltguard is enabled but not connected to a runtime" };
      }
      const guardEvent = client.makeEvent(
        "tool_call",
        { name: event.toolName, arguments: event.params || {} },
        { sessionId: ctx?.sessionId || ctx?.sessionKey, provenance: provenanceFor(event.params) }
      );
      let verdict;
      try {
        verdict = await client.decide(guardEvent);
      } catch (e) {
        warn(`moltguard decide error: ${e.message}`);
        return; // never crash the agent loop on a transport error
      }
      if (verdict.decision === "block") {
        return { block: true, blockReason: (verdict.reasons || []).join("; ") || "blocked by moltguard policy" };
      }
      // allow (incl. approved-on-phone, receipt-verified) -> proceed
      return;
    }, { timeoutMs: APPROVAL_HOOK_TIMEOUT_MS });

    log(`moltguard active → runtime ${cfg.server}${cfg.enrollToken ? "" : " (unconfigured: set enrollToken to enforce)"}`);
  },
};
