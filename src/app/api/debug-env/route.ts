import { NextResponse } from "next/server";

// ENDPOINT TEMPORAL DE DEBUG - ELIMINAR DESPUÉS DE RESOLVER EL PROBLEMA
export async function GET() {
  const key = process.env.OPENROUTER_API_KEY || "";
  const model = process.env.OPENROUTER_MODEL || "(no configurado)";

  return NextResponse.json({
    keyExists: key.length > 0,
    keyLength: key.length,
    keyPrefix: key.length > 10 ? key.substring(0, 12) + "..." : "(muy corta o vacía)",
    keySuffix: key.length > 10 ? "..." + key.substring(key.length - 4) : "",
    keyHasQuotes: key.startsWith('"') || key.startsWith("'"),
    keyHasSpaces: key.includes(" "),
    model: model,
    nodeEnv: process.env.NODE_ENV,
  });
}
