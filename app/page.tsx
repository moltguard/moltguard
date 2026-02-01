import Image from "next/image";
import Link from "next/link";
import { UsageGuide } from "@/components/dashboard/usage-guide";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ScansTable } from "@/components/dashboard/scans-table";
import { AgentsTable } from "@/components/dashboard/agents-table";
import { PrivacyStatement } from "@/components/dashboard/privacy-statement";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="mOltGuard" width={28} height={28} />
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              mOltGuard
            </h1>
          </div>
          <Link
            href="/skill.md"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Skill File
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="mOltGuard"
            width={80}
            height={88}
            className="mb-4"
            priority
          />
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            mOltGuard
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Guard agent for AI agents — scan emails and webpages for prompt
            injection, jailbreak, phishing, and malware.
          </p>
        </div>

        {/* Usage guide */}
        <div className="mx-auto max-w-lg">
          <UsageGuide />
        </div>

        <PrivacyStatement />

        <StatsCards />

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Scans
          </h2>
          <ScansTable limit={10} />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Scan History
          </h2>
          <ScansTable limit={50} showFilters />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Registered Agents
          </h2>
          <AgentsTable />
        </Card>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
          mOltGuard v0.0.1 — Privacy-by-design threat scanning for AI agents
        </div>
      </footer>
    </div>
  );
}
