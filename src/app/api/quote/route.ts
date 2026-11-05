import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { requestBuildFromOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filters: BuilderFilters = body.filters;
    
    // Si el cliente no pasa una clave, toma la configurada en Vercel
    const apiKey = (body.apiKey && body.apiKey.trim().length > 0) 
      ? body.apiKey.trim() 
      : process.env.OPENROUTER_API_KEY;

    // Modelo: si no se envía o es default, usar el configurado en servidor o Gemma 4 31B Free
    const defaultModel = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
    const model = body.model || defaultModel;

    if (!filters || !filters.budgetCLP) {
      return NextResponse.json(
        { error: "Presupuesto no especificado" },
        { status: 400 }
      );
    }

    const result = await requestBuildFromOpenRouter(filters, apiKey, model);

    return NextResponse.json({
      ...result,
      isGlobalKeyActive: !!process.env.OPENROUTER_API_KEY
    });
  } catch (error) {
    console.error("Error en API /api/quote:", error);
    return NextResponse.json(
      { error: "Error al generar la cotización de hardware" },
      { status: 500 }
    );
  }
}
