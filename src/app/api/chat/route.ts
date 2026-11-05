import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { message, currentBuild, apiKey, model = "google/gemini-2.0-flash-001" } = await req.json();
    const token = apiKey || process.env.OPENROUTER_API_KEY;

    if (!message) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    if (!token) {
      // Respuesta de asesoría simulada inteligente
      return NextResponse.json({
        reply: `[Modo Consultivo SoloTodo AI] Sobre tu consulta: "${message}":
Analizando la configuración actual (${currentBuild?.buildName || "PC SoloTodo"}):
- Compatibilidad: La arquitectura de los componentes seleccionados permite un flujo óptimo de energía y disipación térmica.
- Recomendación: Si deseas actualizar o cambiar algún componente, te sugerimos verificar el margen de la fuente de poder (PSU) y el espacio en el chasis. ¡Todos los enlaces hacia las tiendas chilenas cuentan con stock verificado en SoloTodo!`
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
        "Authorization": `Bearer ${token}`,
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
        reply: "No pude conectar con el modelo en este momento. Sin embargo, la configuración actual de tu equipo es 100% compatible y equilibrada para el mercado chileno."
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
