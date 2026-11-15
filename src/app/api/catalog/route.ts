import { NextResponse } from "next/server";
import { encodeSnapshot, refreshSnapshot } from "@/lib/catalog-snapshot";

export const maxDuration = 60;
export async function POST() {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return NextResponse.json({error:"Falta configurar el servicio."},{status:503});
  try {
    const snapshot = await refreshSnapshot();
    return NextResponse.json({
      token:encodeSnapshot(snapshot,key),updatedAt:snapshot.updatedAt,count:snapshot.products.length,
    });
  } catch (error) {
    console.warn("Actualización de catálogo:",error);
    return NextResponse.json({error:"No se pudo actualizar el catálogo. Puedes seguir usando la copia guardada."},{status:503});
  }
}
