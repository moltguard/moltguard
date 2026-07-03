// Payload canonicalization + digests, matching the OGR runtime (RFC 8785 JCS).
//
// The runtime (Python) computes payload_digest with rfc8785; a moltguard PEP
// must recompute the identical digest to verify approval-receipt bindings.
// RFC 8785 is defined in ECMAScript terms, so for the JSON value space OGR uses
// (strings, integers, simple floats, arrays, objects) a recursive
// sort-keys + JSON.stringify reproduces it exactly.
import crypto from "node:crypto";

// kind -> payload fields included in the digest input (must match ogr/jcs.py)
export const DIGEST_FIELDS = {
  tool_call: ["name", "arguments"],
  exec: ["argv", "cwd"],
  network: ["host", "port", "direction"],
  file: ["op", "path"],
  tool_register: ["name", "description", "schema"],
  mcp_connect: ["server", "url"],
  skill_load: ["name", "source", "content_ref"],
};

export const APPROVABLE_KINDS = new Set(Object.keys(DIGEST_FIELDS));

// RFC 8785 canonical JSON. Object keys sorted by UTF-16 code units (JS default
// string sort); strings/numbers use JSON.stringify's ES6 serialization.
export function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
}

export function digestInput(kind, payload) {
  const fields = DIGEST_FIELDS[kind];
  if (!fields) throw new Error(`kind ${kind} is not approvable in OGR v0.2`);
  const input = {};
  for (const f of fields) if (payload != null && f in payload) input[f] = payload[f];
  return input;
}

export function payloadDigest(kind, payload) {
  const canon = canonicalize(digestInput(kind, payload));
  return "sha256:" + crypto.createHash("sha256").update(canon, "utf8").digest("hex");
}
