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

interface Agent {
  anonymous_id: string;
  scan_count: number;
  created_at: string;
  last_active: string;
}

export function AgentsTable() {
  const [agentList, setAgentList] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/agents")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data) => setAgentList(data.agents || []))
      .catch(() => {});
  }, []);

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead>Agent ID</TableHead>
          <TableHead>Scans</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead>Last Active</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {agentList.length === 0 ? (
          <tr>
            <TableCell>
              <span className="text-zinc-400">No agents registered</span>
            </TableCell>
            <TableCell>{""}</TableCell>
            <TableCell>{""}</TableCell>
            <TableCell>{""}</TableCell>
          </tr>
        ) : (
          agentList.map((agent) => (
            <TableRow key={agent.anonymous_id}>
              <TableCell>
                <code className="text-xs">{agent.anonymous_id}</code>
              </TableCell>
              <TableCell>{agent.scan_count}</TableCell>
              <TableCell>
                {new Date(agent.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(agent.last_active).toLocaleString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
