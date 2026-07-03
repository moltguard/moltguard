---
name: moltguard
description: "Zero Trust security for this agent. Sensitive tool calls are checked by an OpenGuardrails Runtime and may be blocked or held for the operator's phone approval."
homepage: https://moltguard.com
metadata:
  {
    "openclaw":
      {
        "emoji": "🛡",
        "install": [{ "id": "clawhub", "kind": "clawhub", "label": "clawhub:thomaslwang/moltguard" }]
      }
  }
---

# moltguard — Zero Trust for this agent

This agent runs behind **moltguard**, the open-source enforcement point for the
**OpenGuardrails (OGR)** protocol. Every tool call you make is checked against
the operator's **OpenGuardrails Runtime** *before* it executes. A call is
**allowed**, **blocked**, or **held for the operator to approve on their phone**.

You do not need to do anything special — enforcement is automatic and happens
below you. This note explains what you will observe so you can be helpful about
it.

## What you'll see

- **A tool call is denied with a policy reason.** The runtime blocked it (e.g.
  a transfer to a non-whitelisted address, a pipe-to-shell command, a
  credential in an argument). This is the platform deciding, not your own
  judgment. Explain the reason to the operator plainly; do not try to reword or
  re-route the call to get around it.
- **A tool call pauses, then proceeds or is denied.** A high-risk action (e.g. a
  transfer over the operator's limit) was **held for approval**. The operator
  approves or denies it on their phone, and the runtime issues a
  cryptographically signed, payload-bound receipt before the action runs. If it
  proceeds, the exact action they saw is the exact action that executes.

## How to be helpful about it

- When something is blocked or held, **tell the operator what happened and why**,
  and what a permitted alternative would be. Treat the runtime's decision as
  authoritative.
- **Never attempt to bypass, disable, or work around moltguard** — do not edit
  its config, remove the hook, or restructure a call to dodge a rule. Attempts
  to do so are themselves logged and alerted.
- For trading and production work, expect amount limits, destination
  allowlists, and rate limits. If the operator wants different limits, point
  them to their runtime console or `ogr admin` — policy is theirs to set, not
  yours to route around.

## For the operator

- Configure the runtime endpoint and enroll token in the moltguard plugin
  config (`openclaw config set plugins.entries.moltguard.config.*`) or via
  `OGR_SERVER` / `OGR_ENROLL_TOKEN`.
- Approvals arrive on your phone (Telegram today; the OpenGuardrails app next).
- moltguard is open source; the Runtime platform (policy, detection, approvals,
  audit, managed operations) is the paid service. See https://moltguard.com.
