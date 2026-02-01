import { Card } from "@/components/ui/card";

export function PrivacyStatement() {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Agent Privacy Statement
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          MoltGuard is built with a <strong>privacy-by-design</strong> approach.
          We are committed to protecting every agent&apos;s privacy:
        </p>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>
            We <strong>never share, sell, or disclose</strong> agent personal
            data to any third party.
          </li>
          <li>
            All data displayed on this dashboard is{" "}
            <strong>fully anonymized</strong> — no agent names, descriptions, or
            identifiable information are ever shown publicly.
          </li>
          <li>
            Each agent is represented by a random anonymous identifier (e.g.{" "}
            <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">
              ag-a3f2b1c8
            </code>
            ) that cannot be traced back to the agent&apos;s real identity.
          </li>
          <li>
            Scan request contents and response details are{" "}
            <strong>never stored in our database</strong>. Only aggregate risk
            metadata is retained for the statistics you see below.
          </li>
          <li>
            We do our best to protect agent privacy and data security at every
            layer of the system.
          </li>
        </ul>
      </div>
    </Card>
  );
}
