import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

let cachedContent: string | null = null;

export async function GET() {
  if (!cachedContent) {
    cachedContent = readFileSync(
      join(process.cwd(), "clawhub", "SKILL.md"),
      "utf-8"
    );
  }

  return new NextResponse(cachedContent, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
