import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { agents } from "@/db/schema";
import { generateApiKey, generateAnonymousId } from "@/lib/api-key";
import { errorResponse, successResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 100) {
    return errorResponse("Name is required (1-100 characters)", 400);
  }

  const description = body.description?.trim() || null;
  const apiKey = generateApiKey();
  const anonymousId = generateAnonymousId();

  const db = getDb();
  try {
    db.insert(agents)
      .values({ name, description, apiKey, anonymousId })
      .run();
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
      return errorResponse("An agent with that key already exists. Please try again.", 409);
    }
    throw err;
  }

  return successResponse(
    {
      agent: { name, description, api_key: apiKey, anonymous_id: anonymousId },
      important: "Save your API key! You need it for all authenticated requests.",
    },
    201
  );
}
