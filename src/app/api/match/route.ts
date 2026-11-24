import { NextResponse } from "next/server";
import { decideMatch } from "@/features/matching/lib/decide";
import { MatchRequestSchema, type MatchRequest } from "@/features/matching/schemas/match";
import { categoryById } from "@/features/specialists/data";
import { jevConfig } from "@/lib/jev/config";
import { JevError } from "@/lib/jev/errors";
import { takeToken } from "@/lib/rate-limit";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "local";
}

function membershipError(input: MatchRequest): string | null {
  if (input.step === "category") return null;
  if (!categoryById.has(input.categoryId)) return "Невідома категорія";
  if (input.step === "doctors") {
    const category = categoryById.get(input.categoryId);
    const subcategory = category?.subcategories.find((item) => item.id === input.subcategoryId);
    if (!subcategory) return "Підкатегорія не належить до обраної категорії";
  }
  return null;
}

export async function POST(request: Request) {
  const limit = takeToken(clientIp(request), jevConfig.rateLimitPerMin);
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "rate_limited", message: "Забагато запитів. Спробуйте за хвилину." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsed = MatchRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "bad_request", message: parsed.error.issues[0]?.message ?? "Некоректний запит" },
      { status: 400, headers: NO_STORE },
    );
  }

  const invalidMembership = membershipError(parsed.data);
  if (invalidMembership) {
    return NextResponse.json({ code: "bad_request", message: invalidMembership }, { status: 400, headers: NO_STORE });
  }

  try {
    const result = await decideMatch(parsed.data);
    return NextResponse.json(result, { status: 200, headers: NO_STORE });
  } catch (error) {
    const code = error instanceof JevError ? error.code : "internal";
    console.error(`[api/match] failed: ${code}`);
    return NextResponse.json(
      {
        code,
        message:
          code === "refusal"
            ? "JEV не зміг визначити відповідь. Оберіть варіант вручну."
            : "JEV тимчасово недоступний. Спробуйте ще раз.",
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
