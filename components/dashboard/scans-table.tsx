"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Scan {
  id: number;
  scan_id: string;
  agent: string;
  scan_type: string;
  risk_level: string;
  risk_types: string[];
  score: number;
  created_at: string;
}

export function ScansTable({
  limit = 20,
  showFilters = false,
}: {
  limit?: number;
  showFilters?: boolean;
}) {
  const [scanList, setScanList] = useState<Scan[]>([]);
  const [riskFilter, setRiskFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (riskFilter) params.set("risk_level", riskFilter);
    if (typeFilter) params.set("scan_type", typeFilter);

    fetch(`/api/dashboard/scans?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => setScanList(data.scans || []))
      .catch(() => {});
  }, [limit, riskFilter, typeFilter]);

  return (
    <div>
      {showFilters && (
        <div className="mb-4 flex gap-3">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          >
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="webpage">Webpage</option>
          </select>
        </div>
      )}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Time</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Risk Types</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {scanList.length === 0 ? (
            <tr>
              <TableCell>
                <span className="text-zinc-400">No scans yet</span>
              </TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
            </tr>
          ) : (
            scanList.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell>
                  {new Date(scan.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <code className="text-xs">{scan.agent}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={scan.scan_type}>{scan.scan_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={scan.risk_level || "default"}>
                    {scan.risk_level || "unknown"}
                  </Badge>
                </TableCell>
                <TableCell>{scan.score ?? "-"}</TableCell>
                <TableCell>
                  {scan.risk_types.length > 0
                    ? scan.risk_types.join(", ")
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
