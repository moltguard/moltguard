"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardValue } from "@/components/ui/card";

interface Stats {
  totalAgents: number;
  totalScans: number;
  scansToday: number;
  highRiskToday: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-3 h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardTitle>Total Agents</CardTitle>
        <CardValue>{stats.totalAgents}</CardValue>
      </Card>
      <Card>
        <CardTitle>Total Scans</CardTitle>
        <CardValue>{stats.totalScans}</CardValue>
      </Card>
      <Card>
        <CardTitle>Scans Today</CardTitle>
        <CardValue>{stats.scansToday}</CardValue>
      </Card>
      <Card>
        <CardTitle>High Risk Today</CardTitle>
        <CardValue>{stats.highRiskToday}</CardValue>
      </Card>
    </div>
  );
}
