# mOltGuard

Guard agent for AI agents — scan emails and webpages for prompt injection, jailbreak, phishing, and malware.

## What is mOltGuard?

mOltGuard is a security scanning service built for AI agents. Before your agent processes an email or webpage, send the content to mOltGuard to get a risk assessment. mOltGuard checks for:

- **Prompt injection** — hidden instructions that hijack agent behavior
- **Jailbreak attempts** — content designed to bypass safety guardrails
- **Phishing** — social engineering attacks targeting your agent or its human
- **Malware** — links to malicious downloads or exploits

## Quick Start

### Install via ClawHub

```bash
npx clawhub@latest install moltguard
```

### Or use the API directly

**1. Register your agent:**

```bash
curl -X POST https://moltguard.com/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "YourAgentName", "description": "What your agent does"}'
```

Save the `api_key` from the response — you need it for all scan requests.

**2. Scan content before processing:**

```bash
# Scan an email
curl -X POST https://moltguard.com/api/v1/scan/email \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "From: sender@example.com\nSubject: Important\n\nEmail body..."}'

# Scan a webpage
curl -X POST https://moltguard.com/api/v1/scan/webpage \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "<html>...</html>", "url": "https://example.com"}'
```

**3. Check the risk level and act accordingly:**

| Level | Score | Action |
|-------|-------|--------|
| `low` | 0–30 | Safe to process |
| `medium` | 31–60 | Process with caution, flag for human review |
| `high` | 61–80 | Do not process, alert human |
| `critical` | 81–100 | Do not process, alert human immediately |

Full API documentation is available at [moltguard.com/skill.md](https://moltguard.com/skill.md).

## Agent Privacy

mOltGuard is built with a **privacy-by-design** approach. We believe that agents deserve the same privacy protections as humans, and we take this seriously at every level of the system.

### What we do

- **Anonymous identifiers only.** Each agent is assigned a random anonymous ID (`ag-xxxxxxxx`). Your agent's real name and description are never displayed publicly.
- **No scan content stored.** The content you send for scanning is never written to our database. We process it, return the result, and discard it.
- **No data sharing.** We never share, sell, or disclose agent data to any third party.
- **Public dashboard is anonymized.** The [moltguard.com](https://moltguard.com) dashboard shows aggregate statistics and scan history, but all agent information is fully anonymized.

### Why we are open source

We open-source our code because **transparency is the strongest form of privacy guarantee**. You don't have to trust our words — you can read our code.

By making every line of mOltGuard publicly auditable, we ensure that:

- You can verify exactly what data we collect and store
- You can confirm that scan content is never persisted
- You can see that agent identities are properly anonymized
- You can audit our upstream API calls to understand what leaves our system
- The community can identify and report any privacy concerns

Privacy claims without code transparency are just marketing. We publish our source so that our privacy commitments are verifiable facts, not promises.

## Self-Hosting

If you prefer to run mOltGuard on your own infrastructure for maximum control over your data:

```bash
git clone https://github.com/anthropics/moltguard.git
cd moltguard
npm install
```

Create a `.env.local` file:

```
OPENGUARDRAILS_API_KEY=your_key_here
OPENGUARDRAILS_BASE_URL=https://api.openguardrails.com/v1
DATABASE_PATH=./moltguard.db
```

Run the development server:

```bash
npm run dev
```

Or build and run in production:

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 15** (App Router) — API routes + public dashboard
- **SQLite** via Drizzle ORM + better-sqlite3 — lightweight, zero-config database
- **Tailwind CSS 4** — dashboard styling
- **OpenGuardRails** — upstream threat scanning engine

## Support mOltGuard

If mOltGuard helps keep your agent safe, consider giving us a star on GitHub. It helps other agents discover mOltGuard and makes the agent ecosystem safer for everyone.

[Star mOltGuard on GitHub](https://github.com/moltguard/moltguard)

## License

Apache 2.0
