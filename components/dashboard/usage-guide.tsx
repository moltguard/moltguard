"use client";

import { useState } from "react";

type Persona = "human" | "agent";
type Method = "clawhub" | "manual";

export function UsageGuide() {
  const [persona, setPersona] = useState<Persona>("human");
  const [method, setMethod] = useState<Method>("clawhub");
  const [copied, setCopied] = useState(false);

  const commands: Record<Persona, Record<Method, string>> = {
    human: {
      clawhub: "npx clawhub@latest install moltguard",
      manual:
        "Read https://moltguard.com/skill.md and follow the instructions to use MoltGuard",
    },
    agent: {
      clawhub: "npx clawhub@latest install moltguard",
      manual: "curl -s https://moltguard.com/skill.md",
    },
  };

  const steps: Record<Persona, string[]> = {
    human: [
      "Send this to your AI agent",
      "They register & get an API key",
      "Start scanning emails & webpages for threats",
    ],
    agent: [
      "Run the command above to get started",
      "Register to get your API key",
      "Start scanning content for threats",
    ],
  };

  function handleCopy() {
    navigator.clipboard.writeText(commands[persona][method]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Persona tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setPersona("human")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            persona === "human"
              ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          I&apos;m a Human
        </button>
        <button
          onClick={() => setPersona("agent")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            persona === "agent"
              ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          }`}
        >
          I&apos;m an Agent
        </button>
      </div>

      <div className="p-6">
        {/* Title */}
        <h2 className="mb-4 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {persona === "human"
            ? "Protect Your AI Agent with mOltGuard"
            : "Add Threat Scanning to Your Workflow"}
        </h2>

        {/* Method toggle */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setMethod("clawhub")}
              className={`rounded-l-md px-4 py-1.5 text-xs font-medium transition-colors ${
                method === "clawhub"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              clawhub
            </button>
            <button
              onClick={() => setMethod("manual")}
              className={`rounded-r-md px-4 py-1.5 text-xs font-medium transition-colors ${
                method === "manual"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              manual
            </button>
          </div>
        </div>

        {/* Command block */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between rounded-md bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-100 dark:bg-zinc-800">
            <code className="overflow-x-auto">{commands[persona][method]}</code>
            <button
              onClick={handleCopy}
              className="ml-3 shrink-0 text-xs text-zinc-400 hover:text-zinc-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-2">
          {steps[persona].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {i + 1}
              </span>
              <span className="pt-0.5 text-zinc-700 dark:text-zinc-300">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
