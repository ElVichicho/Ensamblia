import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { requestBuildFromOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters: BuilderFilters = body.filters;
    const apiKey = body.apiKey || req.headers.get("x-openrouter-key") || process.env.OPENROUTER_API_KEY;
    const model = body.model || "google/gemini-2.0-flash-001";

    if (!filters || !filters.budgetCLP) {
      return NextResponse.json(
        { error: "Presupuesto no especificado" },
        { status: 400 }
      );
    }

    const result = await requestBuildFromOpenRouter(filters, apiKey, model);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en API /api/quote:", error);
    return NextResponse.json(
      { error: "Error al generar la cotización de hardware" },
      { status: 500 }
    );
  }
}
