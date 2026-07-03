// OGR v0.2 PEP client for Node — the enforcement-point side of the protocol,
// as used by the moltguard OpenClaw plugin. Mirrors the Python PEP SDK
// (ogr/pep/client.py): enroll, decide (local hard rules -> runtime), approval
// polling, and receipt verification (signature + expiry + guard_id + recomputed
// payload digest — approve-X-execute-X' fails closed).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { payloadDigest, APPROVABLE_KINDS } from "./jcs.js";
import { evaluateLocal, matchCondition, mostSevere } from "./rules.js";

const b64urlToBuf = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const b64urlJson = (s) => JSON.parse(b64urlToBuf(s).toString("utf8"));
const nowIso = () => new Date().toISOString();
const uid = (p) => p + crypto.randomBytes(6).toString("hex");

export class ReceiptError extends Error {}

// Verify a runtime-signed approval receipt against the event being enforced.
export function verifyReceipt(jws, event, jwks) {
  const [h, p, s] = String(jws).split(".");
  if (!h || !p || !s) throw new ReceiptError("malformed receipt");
  const header = b64urlJson(h);
  const jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) throw new ReceiptError(`unknown runtime key id ${header.kid}`);
  const pub = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const ok = crypto.verify(null, Buffer.from(`${h}.${p}`), pub, b64urlToBuf(s));
  if (!ok) throw new ReceiptError("signature invalid");
  if (header.typ && header.typ !== "ogr-receipt+jws") throw new ReceiptError("not an approval receipt");
  const claims = b64urlJson(p);
  if (new Date(claims.expires_at) < new Date()) throw new ReceiptError("receipt expired");
  if (claims.scope === "single_action") {
    if (claims.guard_id !== event.guard_id) throw new ReceiptError("guard_id mismatch");
    const digest = payloadDigest(event.kind, event.payload); // recompute — the point
    const bound = (claims.bindings || []).some(
      (b) => b.kind === event.kind && b.payload_digest === digest
    );
    if (!bound) throw new ReceiptError("no binding matches this event (payload digest mismatch)");
  } else if (claims.scope === "pre_authorization") {
    const c = claims.constraints || {};
    if (c.kinds && !c.kinds.includes(event.kind)) throw new ReceiptError("kind not covered");
    if (c.session_id && c.session_id !== event.session_id) throw new ReceiptError("session mismatch");
  } else {
    throw new ReceiptError(`unknown scope ${claims.scope}`);
  }
  return claims;
}

export class OgrClient {
  constructor({ server, stateDir, log = () => {} }) {
    this.server = String(server || "").replace(/\/$/, "");
    this.stateDir = stateDir;
    this.log = log;
    this.state = {};
    this.killed = false;
    this.degraded = false;
    fs.mkdirSync(stateDir, { recursive: true });
    this._load();
  }

  get _stateFile() { return path.join(this.stateDir, "state.json"); }
  get _spoolFile() { return path.join(this.stateDir, "spool.jsonl"); }
  get agentId() { return this.state.agent_id || ""; }
  get enrolled() { return !!this.state.credential; }

  _load() {
    try { this.state = JSON.parse(fs.readFileSync(this._stateFile, "utf8")); } catch { this.state = {}; }
  }
  _save() { fs.writeFileSync(this._stateFile, JSON.stringify(this.state, null, 1)); }
  _headers() { return { Authorization: `Bearer ${this.state.credential || ""}`, "Content-Type": "application/json" }; }

  async _fetch(pathname, opts = {}, timeoutMs = 5000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(`${this.server}${pathname}`, { ...opts, signal: ctrl.signal });
    } finally { clearTimeout(t); }
  }

  async enroll({ enrollToken, agentType = "openclaw", principal, heartbeatIntervalS = 60 }) {
    // register a local Ed25519 key so degraded-mode replay batches are signed
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const jwk = publicKey.export({ format: "jwk" });
    const resp = await this._fetch("/api/v1/enroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enroll_token: enrollToken, agent_type: agentType, principal,
        heartbeat_interval_s: heartbeatIntervalS,
        pep_public_jwk: { kty: "OKP", crv: "Ed25519", x: jwk.x, alg: "EdDSA" },
      }),
    });
    if (!resp.ok) throw new Error(`enroll failed: ${resp.status} ${await resp.text()}`);
    const data = await resp.json();
    this.state = {
      server: this.server, agent_id: data.agent_id, tenant_id: data.tenant_id, principal,
      credential: data.credential, credential_expires_at: data.credential_expires_at,
      jwks: data.jwks, policy: data.policy,
      pep_private_pem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    };
    this._save();
    return data;
  }

  async refreshPolicy() {
    const resp = await this._fetch("/api/v1/policy", { headers: this._headers() });
    if (resp.ok) { this.state.policy = await resp.json(); this._save(); }
  }

  makeEvent(kind, payload, { sessionId, provenance = [] } = {}) {
    return {
      ogr_version: "0.2", event_id: uid("evt-"), guard_id: uid("ga-"),
      session_id: sessionId, timestamp: nowIso(), observation_point: "agent_hook",
      kind, subject: { agent_id: this.agentId, principal: this.state.principal },
      payload, provenance,
    };
  }

  _verdict(event, decision, reasons, provider = "moltguard.pep") {
    return { event_id: event.event_id, guard_id: event.guard_id, provider, decision, reasons };
  }

  // Does a cached exception cover this event? Category-scoped exceptions only
  // apply when that category is among the ones that fired locally.
  _exceptionSuppresses(event, categoryIds) {
    const excs = (this.state.policy || {}).exceptions || [];
    for (const exc of excs) {
      if (exc.expires_at && new Date(exc.expires_at) < new Date()) continue;
      if (exc.category && !categoryIds.includes(exc.category)) continue;
      if (matchCondition(exc.match, event)) return true;
    }
    return false;
  }

  // Runtime decides when reachable (it enforces rules + exceptions + all);
  // cached hard rules are the offline floor when it is not.
  async decide(event, { localApprover } = {}) {
    if (this.killed) return this._verdict(event, "block", ["kill switch engaged — deny-all"]);
    let resp;
    try {
      resp = await this._fetch("/api/v1/decide", {
        method: "POST", headers: this._headers(), body: JSON.stringify(event),
      });
    } catch {
      return this._decideDegraded(event, localApprover);
    }
    if (resp.status === 401) { this.killed = true; return this._verdict(event, "block", ["credential revoked — deny-all"]); }
    if (!resp.ok) return this._verdict(event, "block", [`runtime error ${resp.status}`]);
    this.degraded = false;
    const verdict = await resp.json();
    if (verdict.decision === "require_approval" && verdict.approval_id) {
      const { approved, claims } = await this.waitApproval(verdict.approval_id, event);
      return approved
        ? this._verdict(event, "allow", [`approved by ${claims.approver} (receipt verified)`], "moltguard.pep")
        : this._verdict(event, "block", ["approval denied or timed out"], "moltguard.pep");
    }
    return verdict;
  }

  async _decideDegraded(event, localApprover) {
    this.degraded = true;
    this._spool(event);
    const matches = evaluateLocal(this.state.policy, event);
    const decision = mostSevere(matches.map((m) => m.decision));
    const reasons = matches.flatMap((m) => m.reasons);
    // honor cached exceptions offline too
    if (decision !== "allow") {
      const cats = matches.flatMap((m) => m.categories || []);
      if (this._exceptionSuppresses(event, cats))
        return this._verdict(event, "allow", ["local exception applied (degraded mode)"], "moltguard.pep.local");
    }
    if (decision === "block") return this._verdict(event, "block", reasons, "moltguard.pep.local");
    if (!localApprover)
      return this._verdict(event, "block", ["runtime unreachable, no local approver — failing closed"], "moltguard.pep.local");
    const ok = await localApprover(event, reasons.length ? reasons : ["runtime unreachable — local approval required"]);
    return this._verdict(event, ok ? "allow" : "block", [`local approver ${ok ? "granted" : "denied"}`], "moltguard.pep.local");
  }

  async waitApproval(approvalId, event, { timeoutMs = 300000, pollMs = 1500 } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const resp = await this._fetch(`/api/v1/approvals/${approvalId}`, { headers: this._headers() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === "approved") return { approved: true, claims: verifyReceipt(data.receipt, event, this.state.jwks) };
        if (data.status === "denied" || data.status === "expired") return { approved: false };
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    return { approved: false };
  }

  async heartbeat() {
    try {
      const resp = await this._fetch("/api/v1/heartbeat", {
        method: "POST", headers: this._headers(),
        body: JSON.stringify({ counters: {}, policy_versions: (this.state.policy || {}).versions || {} }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.status === "kill") this.killed = true;
      else if (data.policy_stale) await this.refreshPolicy();
      return data;
    } catch { /* offline heartbeat is a no-op */ }
  }

  _spool(event) { fs.appendFileSync(this._spoolFile, JSON.stringify(event) + "\n"); }

  async flushSpool() {
    let lines;
    try { lines = fs.readFileSync(this._spoolFile, "utf8").split("\n").filter((l) => l.trim()); }
    catch { return { accepted: 0 }; }
    if (!lines.length) return { accepted: 0 };
    const events = lines.map((l) => JSON.parse(l));
    const { canonicalize } = await import("./jcs.js");
    const batchSha = crypto.createHash("sha256").update(canonicalize(events), "utf8").digest("hex");
    const priv = crypto.createPrivateKey(this.state.pep_private_pem);
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ batch_sha256: batchSha, agent_id: this.agentId })).toString("base64url");
    const sig = crypto.sign(null, Buffer.from(`${header}.${body}`), priv).toString("base64url");
    const resp = await this._fetch("/api/v1/report", {
      method: "POST", headers: this._headers(),
      body: JSON.stringify({ events, batch_jws: `${header}.${body}.${sig}`, degraded: true }),
    }, 20000);
    if (resp.ok) { fs.rmSync(this._spoolFile, { force: true }); this.degraded = false; return resp.json(); }
    return { accepted: 0 };
  }
}
