<div align="center">

# 🛡 moltguard

**Zero Trust security for OpenClaw agents.**
The open-source [OpenGuardrails (OGR)](https://github.com/openguardrails/openguardrails) enforcement point at the agent-hook altitude.

[moltguard.com](https://moltguard.com) · Apache-2.0

</div>

---

moltguard sits inside your OpenClaw agent and checks **every tool call before it
executes**. Each call becomes an OGR `GuardEvent`, is sent to your
**OpenGuardrails Runtime** for a verdict, and is **allowed**, **blocked**, or
**held for phone approval** — before anything runs.

It is the answer to a specific, dangerous question: *your autonomous agent is
about to send real money / touch production / email a customer — should it?*

```
   OpenClaw agent
        │  about to call a tool (transfer, exec, http, …)
        ▼
   ┌──────────────────────────┐
   │  moltguard (this plugin)  │   before_tool_call gate hook
   │  = OGR PEP, agent-hook    │   → OGR GuardEvent
   └───────────┬──────────────┘
               │  allow / block / require_approval
               ▼
   OpenGuardrails Runtime  ──►  policy · detection · phone approval · audit
     (the paid platform)        signed approval receipts (payload-bound)
```

## What it does

- **Gates every tool call** through your runtime (`before_tool_call` hook).
- **Offline-first.** Cached `hard` rules (per-tx caps, non-whitelist transfers,
  pipe-to-shell) are enforced locally even when the runtime is unreachable — the
  ceilings that protect real money never depend on connectivity.
- **Phone approval with signed receipts.** High-risk actions are held until the
  operator approves; the runtime issues an Ed25519-signed receipt bound to the
  exact payload digest. Approve-$100-execute-$10,000 (TOCTOU) fails closed.
- **Enrolls into the platform.** Each agent gets a cryptographic identity;
  went-dark detection and a kill switch come for free.

## Positioning

moltguard is the **open-source implementation** of the OGR protocol for
OpenClaw. It speaks the wire and enforces decisions; it does **not** contain the
policy engine, detection models, approval UX, or audit — those live in the
**OpenGuardrails Runtime**, the platform you pay for. Run moltguard for free;
pay for the runtime service that makes it smart and gives you a place to
approve, audit, and operate.

This mirrors the OGR project's own principle: *standardize the boundary, not the
brains.*

## Install

```bash
openclaw plugins install clawhub:thomaslwang/moltguard      # or a git/npm/path spec
openclaw config set plugins.entries.moltguard.config.server "https://your-runtime.example.com"
openclaw config set plugins.entries.moltguard.config.enrollToken "<TENANT_ENROLL_TOKEN>"
openclaw config set plugins.entries.moltguard.config.principal "you@corp"
openclaw gateway restart
```

Environment variables `OGR_SERVER`, `OGR_ENROLL_TOKEN`, `OGR_PRINCIPAL` override
config. Get a runtime and an enroll token at [moltguard.com](https://moltguard.com).

## Config

| Key | Env | Meaning |
|---|---|---|
| `server` | `OGR_SERVER` | OpenGuardrails Runtime base URL |
| `enrollToken` | `OGR_ENROLL_TOKEN` | One-time tenant enroll token |
| `principal` | `OGR_PRINCIPAL` | Who the agent acts for (shown on approvals) |
| `failOpenWhenUnconfigured` | — | Allow tool calls when no runtime is set (default `true`) |
| `heartbeatIntervalS` | — | Went-dark / kill-switch heartbeat cadence |

## What's open vs. paid

| Open source (this repo) | OpenGuardrails Runtime (paid) |
|---|---|
| the OpenClaw PEP: `before_tool_call` gate, OGR client, local hard-rule fast path, receipt verification | policy engine, detection (rules + LLM judge), phone approvals, signed receipts, audit trail, managed security operations |

## Related

- [openguardrails/openguardrails](https://github.com/openguardrails/openguardrails) — the OGR protocol spec (v0.2) & benchmark
- OpenGuardrails Runtime — the platform (see moltguard.com)

## License

Apache-2.0.
