import { NextResponse } from "next/server";

export function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status }
  );
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, ...data as object }, { status });
}
