import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runDailySync } from "@/lib/daily-catalog";
export const maxDuration=180;
export async function POST(request: NextRequest) {
  const key=process.env.CATALOG_SYNC_SECRET;
  const supplied=request.headers.get("authorization")?.replace(/^Bearer /,"") ?? "";
  if (!key || Buffer.byteLength(key)!==Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(key),Buffer.from(supplied))) return NextResponse.json({error:"No autorizado."},{status:401});
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV!=="production") return NextResponse.json({error:"Sincronización deshabilitada en Preview."},{status:403});
  try { return NextResponse.json(await runDailySync()); }
  catch { return NextResponse.json({error:"No se pudo actualizar. Se conserva el catálogo anterior."},{status:502}); }
}
