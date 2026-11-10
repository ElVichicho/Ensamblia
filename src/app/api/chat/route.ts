import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_OPENROUTER_MODEL } from "@/lib/openrouter";

export const maxDuration = 60;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentBuild } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        reply: "El asesor no puede responder porque la variable OPENROUTER_API_KEY no está configurada en el servidor."
      });
    }

    const systemPrompt = `
Eres el asesor experto de hardware y PC de SoloTodo (Chile).
Respondes dudas de manera concisa, técnica y amigable al usuario sobre su cotización actual:
${JSON.stringify(currentBuild || {})}
Enfócate en compatibilidad física, cuellos de botella, fuentes de poder, sockets y relación costo/beneficio en el mercado chileno (precios en pesos CLP).
`;

    const fullPrompt = `${systemPrompt}\n\n---\nPREGUNTA DEL USUARIO:\n${message}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://solotodo-ai.vercel.app",
        "X-Title": "SoloTodo AI Chat",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: fullPrompt }
        ],
        temperature: 0.5,
        max_tokens: 450,
        ...(model === DEFAULT_OPENROUTER_MODEL && { reasoning: { effort: "minimal" } })
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.error("OpenRouter chat:", response.status);
      return NextResponse.json({
        reply: `Aviso del asesor: La API de OpenRouter respondió con error (${response.status})`
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No se obtuvo respuesta del modelo.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ reply: "El asesor tardó demasiado. Puedes volver a enviar tu consulta." });
    }
    console.error("Error en /api/chat:", error);
    return NextResponse.json({ error: "Error interno del asesor de chat" }, { status: 500 });
  }
}
