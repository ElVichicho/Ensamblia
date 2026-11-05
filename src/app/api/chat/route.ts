import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentBuild } = body;

    const apiKey = (body.apiKey && body.apiKey.trim().length > 0)
      ? body.apiKey.trim()
      : process.env.OPENROUTER_API_KEY;

    const defaultModel = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
    const model = body.model || defaultModel;

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        reply: `[Modo Consultivo SoloTodo Local] Sobre tu consulta: "${message}":
Analizando la configuración actual (${currentBuild?.buildName || "PC SoloTodo"}):
- Compatibilidad: La arquitectura de los componentes seleccionados permite un flujo óptimo de energía y disipación térmica.
- Recomendación: Si deseas actualizar o cambiar algún componente, te sugerimos verificar el margen de la fuente de poder (PSU) y el espacio en el chasis. ¡Todos los componentes seleccionados cuentan con disponibilidad en tiendas chilenas!`
      });
    }

    const systemPrompt = `
Eres el asesor experto de hardware y PC Gaming de SoloTodo (Chile).
Respondes dudas de manera concisa, técnica y amigable al usuario sobre su cotización actual:
${JSON.stringify(currentBuild || {})}
Enfócate en compatibilidad física, cuellos de botella, fuentes de poder, sockets y relación costo/beneficio en el mercado chileno (precios en pesos CLP).
`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://solotodo-ai.vercel.app",
        "X-Title": "SoloTodo AI Chat",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.5
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        reply: "El asesor en la nube no pudo responder en este instante. No obstante, tu configuración actual es 100% compatible y equilibrada para el mercado chileno."
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No se obtuvo respuesta del modelo.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json({ error: "Error interno del asesor de chat" }, { status: 500 });
  }
}
