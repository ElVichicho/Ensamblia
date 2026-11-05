import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { requestBuildFromOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters: BuilderFilters = body.filters;
    
    // Obtener clave del servidor (Vercel)
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";

    if (!filters || !filters.budgetCLP) {
      return NextResponse.json(
        { error: "Presupuesto no especificado" },
        { status: 400 }
      );
    }

    const result = await requestBuildFromOpenRouter(filters, apiKey, model);

    return NextResponse.json({
      quote: result.quote,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error("Error en API /api/quote:", error);
    return NextResponse.json(
      { error: error.message || "Error al conectar con la API de OpenRouter" },
      { status: 502 }
    );
  }
}
